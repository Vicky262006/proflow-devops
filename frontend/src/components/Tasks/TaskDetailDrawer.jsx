import { useState, useEffect } from 'react'
import { 
  X, 
  CheckSquare, 
  Calendar, 
  User, 
  Tag, 
  Paperclip, 
  MessageSquare, 
  History, 
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Trash2
} from 'lucide-react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import api from '../../api/axios'
import { useAuth } from '../../context/AuthContext'
import toast from 'react-hot-toast'

const TaskDetailDrawer = ({ task, onClose }) => {
  const { user, isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('details')
  const [subtasks, setSubtasks] = useState(task.subtasks || [])
  const [newSubtask, setNewSubtask] = useState('')
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [activity, setActivity] = useState([])

  useEffect(() => {
     const fetchExtendedData = async () => {
         try {
             const [commentsRes, activityRes] = await Promise.all([
                 api.get(`/comments/${task._id}`),
                 api.get(`/tasks/${task._id}/activity`)
             ])
             setComments(commentsRes.data)
             setActivity(activityRes.data)
         } catch (e) {
             console.error(e)
         }
     }
     fetchExtendedData()
  }, [task._id])

  const toggleSubtask = async (subtaskId, done) => {
      try {
          const { data } = await api.put(`/tasks/${task._id}/subtask/${subtaskId}`, { done: !done })
          setSubtasks(data.subtasks)
      } catch (e) {
          toast.error("Failed to update subtask")
      }
  }

  const addSubtask = async () => {
      if (!newSubtask.trim()) return
      try {
          const { data } = await api.put(`/tasks/${task._id}`, { 
              subtasks: [...subtasks, { title: newSubtask, done: false }] 
          })
          setSubtasks(data.subtasks)
          setNewSubtask('')
      } catch (e) {
          toast.error("Failed to add subtask")
      }
  }

  const postComment = async () => {
      if (!newComment.trim()) return
      try {
          const { data } = await api.post(`/comments/${task._id}`, { text: newComment })
          setComments([data, ...comments])
          setNewComment('')
      } catch (e) {
          toast.error("Failed to post comment")
      }
  }

  const handleDeployStatus = async () => {
      try {
          await api.put(`/tasks/${task._id}`, { status: 'completed' })
          toast.success("Task deployed successfully!")
          onClose()
      } catch (e) {
          toast.error(e.response?.data?.message || "Failed to deploy task")
      }
  }

  const handleDeleteTask = async () => {
      if (!window.confirm("Are you sure you want to delete this task? This action cannot be undone.")) return
      try {
          await api.delete(`/tasks/${task._id}`)
          toast.success("Task deleted successfully")
          onClose()
      } catch (e) {
          toast.error(e.response?.data?.message || "Failed to delete task")
      }
  }

  const tabs = [
    { id: 'details', label: 'Overview', icon: CheckSquare },
    { id: 'activity', label: 'Audit Log', icon: History },
  ]

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-full max-w-2xl bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-800"
      >
        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/20 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              task.priority === 'urgent' ? 'bg-red-500/20 text-red-400' : 'bg-indigo-500/20 text-indigo-400'
            }`}>
              {task.priority} Priority
            </span>
            <span className="h-4 w-px bg-slate-800" />
            <span className="text-slate-500 font-bold text-xs uppercase tracking-tighter">ID: {task._id.slice(-6)}</span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-800 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <header className="mb-10">
            <h2 className="text-3xl font-black text-slate-100 leading-tight mb-4">{task.title}</h2>
            <div className="flex flex-wrap gap-6 items-center">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-800 flex items-center justify-center p-0.5">
                   {task.assignee?.avatar ? <img src={task.assignee.avatar} className="rounded-lg object-cover" /> : <User className="text-slate-500" />}
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Assignee</p>
                  <p className="text-sm font-bold text-slate-200">{task.assignee?.username || 'Unassigned'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-800/50 flex items-center justify-center">
                   <Calendar className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Deadline</p>
                  <p className="text-sm font-bold text-slate-200">{task.deadline ? format(new Date(task.deadline), 'MMM dd, yyyy') : 'No date'}</p>
                </div>
              </div>
            </div>
          </header>

          <div className="flex border-b border-slate-800 mb-8 gap-8">
            {tabs.map((tab) => {
              const TabIcon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 text-sm font-black uppercase tracking-widest flex items-center gap-2 transition-all relative ${
                    activeTab === tab.id ? 'text-indigo-400' : 'text-slate-600 hover:text-slate-400'
                  }`}
                >
                  <TabIcon size={16} /> {tab.label}
                  {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
                </button>
              )
            })}
          </div>

          <div className="space-y-10">
            {activeTab === 'details' && (
              <>
                <section>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Specification</h4>
                  <p className="text-slate-300 text-sm leading-relaxed font-medium whitespace-pre-wrap">
                    {task.description || 'No detailed documentation provided for this unit.'}
                  </p>
                </section>

                <section className="bg-slate-950/30 border border-slate-800 rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-6">
                     <h4 className="text-sm font-black text-slate-200 uppercase tracking-tighter flex items-center gap-2">
                        <CheckCircle2 size={18} className="text-emerald-400" /> Subtask Checklist
                     </h4>
                     <span className="text-[10px] font-black text-slate-500">{subtasks.filter(s => s.done).length} / {subtasks.length}</span>
                  </div>
                  <div className="space-y-3">
                    {subtasks.map((st) => (
                      <div 
                        key={st._id} 
                        onClick={() => toggleSubtask(st._id, st.done)}
                        className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-800/50 hover:border-slate-700 cursor-pointer active:scale-98 transition-all"
                      >
                        <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          st.done ? 'bg-indigo-500 border-indigo-500' : 'border-slate-700'
                        }`}>
                          {st.done && <X size={14} className="text-white rotate-45" />}
                        </div>
                        <span className={`text-sm font-medium ${st.done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{st.title}</span>
                      </div>
                    ))}
                    <div className="relative mt-4">
                        <input 
                            type="text" 
                            placeholder="Add subtask..." 
                            value={newSubtask}
                            onChange={e => setNewSubtask(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addSubtask()}
                            className="w-full bg-slate-100/5 border border-slate-800 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:border-indigo-500/50 transition-all font-medium"
                        />
                        <button 
                            onClick={addSubtask}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-indigo-400 hover:bg-slate-800 rounded-lg"
                        >
                            <Plus size={20} />
                        </button>
                    </div>
                  </div>
                </section>

                <section>
                   <div className="flex items-center justify-between mb-6">
                      <h4 className="text-sm font-black text-slate-200 uppercase tracking-tighter flex items-center gap-2">
                         <MessageSquare size={18} className="text-amber-400" /> Transmission Log
                      </h4>
                   </div>
                   <div className="space-y-6">
                       <div className="flex gap-4">
                           <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-800 flex items-center justify-center">
                               {user?.avatar ? <img src={user.avatar} className="rounded-lg" /> : <User size={20} />}
                           </div>
                           <div className="flex-1 space-y-3">
                               <textarea 
                                    placeholder="Write a status update..." 
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-sm focus:outline-none focus:border-indigo-500/50 transition-all min-h-[100px] font-medium"
                               />
                               <div className="flex justify-end">
                                   <button 
                                        onClick={postComment}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl text-xs font-black uppercase transition-all"
                                   >
                                       Post Update
                                   </button>
                               </div>
                           </div>
                       </div>

                       <div className="space-y-6 pt-6 mt-6 border-t border-slate-800">
                           {comments.map((c) => (
                               <div key={c._id} className="flex gap-4">
                                   <img src={c.author?.avatar} className="h-10 w-10 rounded-xl shrink-0" />
                                   <div className="flex-1 bg-slate-950/30 p-4 rounded-2xl border border-slate-800/50">
                                       <div className="flex justify-between mb-1">
                                           <span className="text-xs font-black text-slate-300">{c.author?.username}</span>
                                           <span className="text-[10px] font-bold text-slate-600 font-mono italic">{format(new Date(c.createdAt), 'HH:mm • MMM d')}</span>
                                       </div>
                                       <p className="text-sm text-slate-400 font-medium leading-relaxed">{c.text}</p>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
                </section>
              </>
            )}

            {activeTab === 'activity' && (
                <div className="space-y-8 relative before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-800">
                    {activity.map((log, i) => (
                        <div key={log._id} className="relative pl-12">
                            <div className="absolute left-0 top-0 h-10 w-10 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center z-10">
                                <History size={16} className="text-slate-500" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-300 font-medium">
                                    <span className="text-indigo-400 font-black">{log.user?.username}</span> {log.description}
                                </p>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-1">
                                    {format(new Date(log.createdAt), 'MMM d, yyyy • HH:mm:ss')}
                                </p>
                                {log.changes && (
                                    <div className="mt-3 bg-slate-950/50 p-3 rounded-xl text-[10px] font-mono text-slate-500 border border-slate-800/50">
                                        {JSON.stringify(log.changes, null, 2)}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>

        <div className="p-8 border-t border-slate-800 bg-slate-950/40 flex gap-4">
             {task.status !== 'completed' ? (
               <button 
                  onClick={handleDeployStatus}
                  className="flex-1 bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600 hover:text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
               >
                  <CheckCircle2 size={18} /> Deploy Status
               </button>
             ) : (
               <div className="flex-1 flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl py-4 text-xs font-black uppercase tracking-widest font-bold">
                  Task Deployed
               </div>
             )}
             {(isAdmin || user?._id === task.creator?._id || user?._id === task.creator) && (
               <button 
                  onClick={handleDeleteTask}
                  className="bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  title="Delete Task"
               >
                  <Trash2 size={18} /> Delete Task
               </button>
             )}
        </div>
      </motion.div>
    </div>
  )
}

export default TaskDetailDrawer
