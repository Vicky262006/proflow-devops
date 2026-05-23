import { useState, useEffect, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Calendar, 
  Paperclip, 
  MessageSquare, 
  CheckCircle2,
  Clock,
  Zap,
  Tag,
  AlertCircle
} from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import TaskDetailDrawer from '../components/Tasks/TaskDetailDrawer'
import TaskForm from '../components/Tasks/TaskForm'

const COLUMNS = [
  { id: 'todo', title: 'Backlog', color: 'slate' },
  { id: 'in-progress', title: 'In Execution', color: 'indigo' },
  { id: 'review', title: 'Quality Assurance', color: 'cyan' },
  { id: 'completed', title: 'Deployed', color: 'emerald' },
]

const Tasks = () => {
  const { user, isAdmin } = useAuth()
  const { socket } = useSocket()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTask, setSelectedTask] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [filters, setFilters] = useState({ priority: '', team: '' })

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await api.get('/tasks', { params: { ...filters, search: searchTerm } })
      setTasks(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [filters, searchTerm])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  // Real-time updates
  useEffect(() => {
    if (!socket) return

    socket.on('task:created', (newTask) => {
      setTasks(prev => [newTask, ...prev])
    })

    socket.on('task:updated', (updatedTask) => {
      setTasks(prev => prev.map(t => t._id === updatedTask._id ? updatedTask : t))
      if (selectedTask?._id === updatedTask._id) {
        setSelectedTask(updatedTask)
      }
    })

    socket.on('task:deleted', (data) => {
      setTasks(prev => prev.filter(t => t._id !== data._id))
      if (selectedTask?._id === data._id) setSelectedTask(null)
    })

    return () => {
      socket.off('task:created')
      socket.off('task:updated')
      socket.off('task:deleted')
    }
  }, [socket, selectedTask])

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const task = tasks.find(t => t._id === draggableId)
    const newStatus = destination.droppableId
    
    // Optimistic update
    const updatedTasks = Array.from(tasks)
    const taskIdx = updatedTasks.findIndex(t => t._id === draggableId)
    updatedTasks[taskIdx].status = newStatus
    setTasks(updatedTasks)

    try {
      await api.put(`/tasks/${draggableId}`, { status: newStatus })
    } catch (e) {
      // Revert if failed
      fetchTasks()
    }
  }

  const columnsData = COLUMNS.map(col => ({
    ...col,
    tasks: tasks.filter(t => t.status === col.id)
  }))

  return (
    <div className="h-full flex flex-col space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-100 uppercase tracking-tighter">Mission Control</h1>
          <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Enterprise Kanban Surface</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Filter by keyword..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:border-indigo-500/50 w-64 transition-all"
            />
          </div>
          <button className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-indigo-400 transition-all">
            <Filter size={18} />
          </button>
          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            <Plus size={18} strokeWidth={3} /> Initialize
          </button>
        </div>
      </header>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex gap-6 overflow-x-auto pb-4 scrollbar-hide min-h-0">
          {columnsData.map((col) => (
            <div key={col.id} className="flex-shrink-0 w-80 flex flex-col h-full bg-slate-950/30 rounded-3xl border border-slate-900/50 p-4">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full bg-${col.color}-500 shadow-[0_0_10px_rgba(var(--${col.color}-rgb),0.5)]`} />
                  <h3 className="font-bold text-xs uppercase tracking-widest text-slate-200">{col.title}</h3>
                  <span className="bg-slate-900 px-2.5 py-0.5 rounded-full text-[10px] font-black text-slate-500">{col.tasks.length}</span>
                </div>
                <MoreVertical size={16} className="text-slate-600 cursor-pointer hover:text-slate-400" />
              </div>

              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className={`flex-1 overflow-y-auto space-y-4 px-1 rounded-2xl transition-colors ${
                      snapshot.isDraggingOver ? 'bg-indigo-500/5' : ''
                    }`}
                  >
                    {col.tasks.map((task, index) => (
                      <Draggable key={task._id} draggableId={task._id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => setSelectedTask(task)}
                            className={`bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl transition-all ${
                              snapshot.isDragging ? 'shadow-2xl ring-2 ring-indigo-500/50 rotate-3 z-50' : 'hover:border-indigo-500/30'
                            }`}
                          >
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {task.labels?.map(label => (
                                <span key={label} className="text-[9px] font-black uppercase tracking-tighter bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20">
                                  {label}
                                </span>
                              ))}
                              {task.priority === 'urgent' && (
                                <span className="text-[9px] font-black uppercase tracking-tighter bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <AlertCircle size={10} /> Urgent
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm font-bold text-slate-200 leading-snug mb-3">{task.title}</h4>

                            <div className="flex items-center justify-between mt-auto">
                              <div className="flex items-center gap-3">
                                {task.deadline && (
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                                    <Clock size={12} className={new Date(task.deadline) < new Date() ? 'text-red-400' : 'text-slate-600'} />
                                    {format(new Date(task.deadline), 'MMM d')}
                                  </div>
                                )}
                                {(task.comments?.length > 0 || task.attachments?.length > 0) && (
                                  <div className="flex items-center gap-3 border-l border-slate-800 pl-3">
                                    {task.comments?.length > 0 && (
                                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
                                        <MessageSquare size={12} /> {task.comments.length}
                                      </div>
                                    )}
                                    {task.attachments?.length > 0 && (
                                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
                                        <Paperclip size={12} /> {task.attachments.length}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex -space-x-2">
                                {task.assignee ? (
                                  <div className="h-6 w-6 rounded-full border-2 border-slate-900 overflow-hidden bg-slate-800" title={task.assignee.username}>
                                     {task.assignee.avatar ? <img src={task.assignee.avatar} className="h-full w-full object-cover" /> : <div className="h-full w-full flex items-center justify-center text-[10px] text-white">?</div>}
                                  </div>
                                ) : (
                                  <div className="h-6 w-6 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] text-slate-600 font-black">?</div>
                                )}
                              </div>
                            </div>

                            {task.progress > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-800/50">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Progress</span>
                                        <span className="text-[9px] font-black text-indigo-400">{task.progress}%</span>
                                    </div>
                                    <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                                            style={{ width: `${task.progress}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      <AnimatePresence>
        {selectedTask && (
            <TaskDetailDrawer 
                task={selectedTask} 
                onClose={() => setSelectedTask(null)} 
            />
        )}
        {isFormOpen && (
            <TaskForm 
                onClose={() => setIsFormOpen(false)} 
            />
        )}
      </AnimatePresence>
    </div>
  )
}

export default Tasks
