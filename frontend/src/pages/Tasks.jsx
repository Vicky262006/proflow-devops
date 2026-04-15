import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import { PageLoader } from '../components/UI/LoadingSpinner'
import KanbanBoard from '../components/Tasks/KanbanBoard'
import TaskCard from '../components/UI/TaskCard'
import TaskForm from '../components/Tasks/TaskForm'
import Modal from '../components/UI/Modal'
import toast from 'react-hot-toast'
import {
  Plus, LayoutGrid, List, Search, SlidersHorizontal,
  X, Calendar, MessageSquare, User, Tag, CheckSquare,
  Send, Trash2
} from 'lucide-react'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'

const PRIORITIES = ['', 'low', 'medium', 'high', 'urgent']
const STATUSES = ['', 'todo', 'in-progress', 'review', 'completed']

// Task Detail Modal
const TaskDetail = ({ task: initialTask, onClose, onUpdate, onDelete }) => {
  const { user } = useAuth()
  const [task, setTask] = useState(initialTask)
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [sendingComment, setSendingComment] = useState(false)

  useEffect(() => {
    fetchComments()
    fetchTask()
  }, [initialTask._id])

  const fetchTask = async () => {
    try {
      const { data } = await api.get(`/tasks/${initialTask._id}`)
      setTask(data)
    } catch {}
  }

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/comments/${initialTask._id}`)
      setComments(data)
    } catch {}
  }

  const sendComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setSendingComment(true)
    try {
      const { data } = await api.post(`/comments/${task._id}`, { content: commentText })
      setComments(prev => [...prev, data])
      setCommentText('')
    } catch {
      toast.error('Failed to send comment')
    } finally {
      setSendingComment(false)
    }
  }

  const deleteComment = async (id) => {
    try {
      await api.delete(`/comments/${id}`)
      setComments(prev => prev.filter(c => c._id !== id))
    } catch {
      toast.error('Failed to delete comment')
    }
  }

  const priorityColors = {
    urgent: 'priority-urgent', high: 'priority-high', medium: 'priority-medium', low: 'priority-low'
  }
  const statusColors = {
    'todo': 'status-todo', 'in-progress': 'status-in-progress', 'review': 'status-review', 'completed': 'status-completed'
  }

  return (
    <div className="space-y-5">
      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <span className={`badge ${priorityColors[task.priority]}`}>
          {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)} Priority
        </span>
        <span className={`badge ${statusColors[task.status]}`}>
          {task.status === 'in-progress' ? 'In Progress' : task.status?.charAt(0).toUpperCase() + task.status?.slice(1)}
        </span>
        {task.tags?.map(tag => (
          <span key={tag} className="badge bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
            <Tag className="w-3 h-3" /> {tag}
          </span>
        ))}
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{task.description}</p>
      )}

      {/* Meta */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {task.deadline && (
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar className="w-4 h-4 text-primary-500" />
            <span>Due: <span className="font-medium text-gray-700 dark:text-gray-300">{format(new Date(task.deadline), 'MMM d, yyyy')}</span></span>
          </div>
        )}
        {task.assignee && (
          <div className="flex items-center gap-2 text-gray-500">
            <User className="w-4 h-4 text-primary-500" />
            <span>Assigned: <span className="font-medium text-gray-700 dark:text-gray-300">{task.assignee?.username}</span></span>
          </div>
        )}
        {task.team && (
          <div className="flex items-center gap-2 text-gray-500">
            <CheckSquare className="w-4 h-4 text-primary-500" />
            <span>Team: <span className="font-medium text-gray-700 dark:text-gray-300">{task.team?.name}</span></span>
          </div>
        )}
        <div className="flex items-center gap-2 text-gray-500">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>Created: <span className="font-medium text-gray-700 dark:text-gray-300">{format(new Date(task.createdAt), 'MMM d')}</span></span>
        </div>
      </div>

      <hr className="border-gray-100 dark:border-gray-800" />

      {/* Comments section */}
      <div>
        <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
          <MessageSquare className="w-4 h-4" /> Comments ({comments.length})
        </h3>

        <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
          {comments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No comments yet. Start the discussion!</p>
          ) : (
            comments.map(c => (
              <div key={c._id} className={`flex gap-3 group ${c.author?._id === user?._id ? 'flex-row-reverse' : ''}`}>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                  {c.author?.avatar
                    ? <img src={c.author.avatar} className="w-full h-full object-cover" alt="" />
                    : c.author?.username?.[0]?.toUpperCase()
                  }
                </div>
                <div className={`flex-1 ${c.author?._id === user?._id ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`px-3 py-2 rounded-2xl text-sm max-w-[85%] ${
                    c.author?._id === user?._id
                      ? 'bg-primary-500 text-white rounded-tr-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                  }`}>
                    {c.content}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">{format(new Date(c.createdAt), 'MMM d, HH:mm')}</span>
                    {c.author?._id === user?._id && (
                      <button onClick={() => deleteComment(c._id)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3 h-3 text-red-400 hover:text-red-600" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={sendComment} className="flex gap-2">
          <input
            className="input flex-1 text-sm py-2"
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            placeholder="Write a comment..."
          />
          <button type="submit" disabled={sendingComment || !commentText.trim()} className="btn-primary px-3 py-2">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}

const Tasks = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('kanban')
  const [showCreate, setShowCreate] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [viewTask, setViewTask] = useState(null)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [filters, setFilters] = useState({ status: '', priority: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [defaultStatus, setDefaultStatus] = useState('todo')

  useEffect(() => { fetchTasks() }, [filters])

  useEffect(() => {
    const editId = searchParams.get('edit')
    const viewId = searchParams.get('view')
    if (editId && tasks.length) setEditTask(tasks.find(t => t._id === editId))
    if (viewId && tasks.length) setViewTask(tasks.find(t => t._id === viewId))
  }, [searchParams, tasks])

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.priority) params.set('priority', filters.priority)
      const { data } = await api.get(`/tasks?${params}`)
      setTasks(data)
    } catch {
      toast.error('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [filters])

  const handleDragEnd = async (result) => {
    if (!result.destination) return
    const { draggableId, destination } = result
    const newStatus = destination.droppableId
    const task = tasks.find(t => t._id === draggableId)
    if (!task || task.status === newStatus) return

    setTasks(prev => prev.map(t => t._id === draggableId ? { ...t, status: newStatus } : t))
    try {
      await api.put(`/tasks/${draggableId}`, { status: newStatus })
      toast.success(`Moved to ${newStatus === 'in-progress' ? 'In Progress' : newStatus}`)
    } catch {
      fetchTasks()
      toast.error('Failed to update task')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return
    try {
      await api.delete(`/tasks/${id}`)
      setTasks(prev => prev.filter(t => t._id !== id))
      toast.success('Task deleted')
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const handleTaskSaved = (saved) => {
    setTasks(prev => {
      const exists = prev.find(t => t._id === saved._id)
      return exists ? prev.map(t => t._id === saved._id ? saved : t) : [saved, ...prev]
    })
    setShowCreate(false)
    setEditTask(null)
    setSearchParams({})
  }

  const filtered = tasks.filter(t =>
    search ? t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description?.toLowerCase().includes(search.toLowerCase()) : true
  )

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Tasks</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{tasks.length} total · {tasks.filter(t => t.status === 'completed').length} completed</p>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            <button onClick={() => setView('kanban')} id="view-kanban"
              className={`p-2 rounded-lg transition-all ${view === 'kanban' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setView('list')} id="view-list"
              className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => setShowFilters(v => !v)} className="btn-secondary">
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>
          <button id="tasks-create-btn" onClick={() => { setDefaultStatus('todo'); setShowCreate(true) }} className="btn-primary">
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className={`space-y-3 ${showFilters ? '' : 'hidden'}`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input className="input pl-10" placeholder="Search tasks..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input sm:w-40" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
            {STATUSES.map(s => <option key={s} value={s}>{s ? (s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)) : 'All Statuses'}</option>)}
          </select>
          <select className="input sm:w-40" value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p ? p.charAt(0).toUpperCase() + p.slice(1) : 'All Priorities'}</option>)}
          </select>
          {(filters.status || filters.priority || search) && (
            <button onClick={() => { setFilters({ status: '', priority: '' }); setSearch('') }} className="btn-secondary">
              <X className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Board/List */}
      {view === 'kanban' ? (
        <KanbanBoard
          tasks={filtered}
          onDragEnd={handleDragEnd}
          onEdit={setEditTask}
          onDelete={handleDelete}
          onView={setViewTask}
          onAdd={(status) => { setDefaultStatus(status); setShowCreate(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full flex flex-col items-center py-20 text-gray-400">
              <CheckSquare className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-medium">No tasks found</p>
              <button onClick={() => setShowCreate(true)} className="mt-3 text-primary-600 text-sm hover:underline">
                Create your first task →
              </button>
            </div>
          ) : filtered.map(task => (
            <TaskCard key={task._id} task={task}
              onEdit={setEditTask} onDelete={handleDelete} onView={setViewTask} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Task">
        <TaskForm initial={{ status: defaultStatus }} onSuccess={handleTaskSaved} onCancel={() => setShowCreate(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editTask} onClose={() => { setEditTask(null); setSearchParams({}) }} title="Edit Task">
        {editTask && <TaskForm initial={editTask} onSuccess={handleTaskSaved} onCancel={() => { setEditTask(null); setSearchParams({}) }} />}
      </Modal>

      {/* View Modal */}
      <Modal isOpen={!!viewTask} onClose={() => { setViewTask(null); setSearchParams({}) }} title={viewTask?.title || ''} size="lg">
        {viewTask && (
          <TaskDetail task={viewTask} onClose={() => { setViewTask(null); setSearchParams({}) }}
            onUpdate={handleTaskSaved} onDelete={handleDelete} />
        )}
      </Modal>
    </div>
  )
}

export default Tasks
