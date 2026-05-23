import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Plus, User, Calendar, Flag, Tag, Layers, Clock, AlertTriangle } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const TaskForm = ({ onClose, task = null }) => {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'todo',
    deadline: task?.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
    assignee: task?.assignee?._id || task?.assignee || '',
    team: task?.team?._id || task?.team || '',
    labels: task?.labels || [],
    estimatedHours: task?.estimatedHours || 0,
    isRecurring: task?.isRecurring || false,
    recurringPattern: task?.recurringPattern || null,
  })

  const [employees, setEmployees] = useState([])
  const [teams, setTeams] = useState([])
  const [newLabel, setNewLabel] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [empRes, teamRes] = await Promise.all([
          api.get('/admin/users'), 
          api.get('/teams')
        ])
        setEmployees(empRes.data)
        setTeams(teamRes.data)
      } catch (e) {
        console.error('Failed to pre-fetch context', e)
      }
    }
    fetchData()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) return toast.error("Unit title is required")
    
    setLoading(true)
    try {
      if (task) {
        await api.put(`/tasks/${task._id}`, formData)
        toast.success("Unit updated successfully")
      } else {
        await api.post('/tasks', formData)
        toast.success("New unit initialized")
      }
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation failed")
    } finally {
      setLoading(false)
    }
  }

  const toggleLabel = (label) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.includes(label) 
        ? prev.labels.filter(l => l !== label)
        : [...prev.labels, label]
    }))
  }

  const addCustomLabel = () => {
    if (!newLabel.trim()) return
    if (!formData.labels.includes(newLabel)) {
      setFormData(prev => ({ ...prev, labels: [...prev.labels, newLabel] }))
    }
    setNewLabel('')
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
      />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
          <div>
            <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tighter">
              {task ? 'Update Unit' : 'Initialize Mission'}
            </h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Configure Task Parameters</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-800 rounded-full transition-all">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Column: Core Info */}
          <div className="space-y-8">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Task Designation</label>
              <input 
                type="text" 
                placeholder="Enter objective title..." 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-slate-200 font-bold focus:outline-none focus:border-indigo-500/50 transition-all"
                required
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Detailed Specification</label>
              <textarea 
                placeholder="Describe the mission requirements and deliverables..." 
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-slate-950/50 border border-slate-800 rounded-3xl p-5 text-slate-400 font-medium focus:outline-none focus:border-indigo-500/50 transition-all min-h-[180px] text-sm leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                  <Flag size={12} className="text-indigo-400" /> Priority
                </label>
                <select 
                  value={formData.priority}
                  onChange={e => setFormData({...formData, priority: e.target.value})}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 font-bold text-xs focus:outline-none focus:border-indigo-500/50 appearance-none"
                >
                  <option value="low">Low Impact</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Critical / Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                  <Layers size={12} className="text-indigo-400" /> Initial Status
                </label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 font-bold text-xs focus:outline-none focus:border-indigo-500/50 appearance-none"
                >
                  <option value="todo">Backlog</option>
                  <option value="in-progress">In Execution</option>
                  <option value="review">Quality Control</option>
                  <option value="completed">Deployed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Right Column: Meta & Assignments */}
          <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                  <User size={12} className="text-cyan-400" /> Assign To
                </label>
                <select 
                  value={formData.assignee}
                  onChange={e => setFormData({...formData, assignee: e.target.value})}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 font-bold text-xs focus:outline-none focus:border-indigo-500/50 appearance-none"
                >
                  <option value="">Unassigned</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.username}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                  <Calendar size={12} className="text-emerald-400" /> Cut-off Date
                </label>
                <input 
                  type="date"
                  value={formData.deadline}
                  onChange={e => setFormData({...formData, deadline: e.target.value})}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 font-bold text-xs focus:outline-none focus:border-indigo-500/50"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                <Tag size={12} className="text-amber-400" /> Operational Labels
              </label>
              <div className="flex flex-wrap gap-2 mb-4">
                {['Frontend', 'Backend', 'DevOps', 'Security', 'Bug', 'Feature', 'API'].map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => toggleLabel(l)}
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all border ${
                      formData.labels.includes(l) 
                        ? 'bg-indigo-600 border-indigo-500 text-white' 
                        : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Add custom label..." 
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomLabel())}
                  className="flex-1 bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2 text-[11px] font-bold text-slate-400 focus:outline-none"
                />
                <button 
                  type="button"
                  onClick={addCustomLabel}
                  className="bg-slate-800 p-2 rounded-xl text-slate-400 hover:bg-slate-700"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div className="bg-slate-950/40 p-6 rounded-3xl border border-slate-800 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Clock size={16} className="text-indigo-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Time Estimates</span>
                    </div>
                    <input 
                        type="number" 
                        value={formData.estimatedHours}
                        onChange={e => setFormData({...formData, estimatedHours: e.target.value})}
                        className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-black text-center text-indigo-400"
                    />
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <RefreshCcwIcon size={16} className="text-cyan-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recurring Mission</span>
                    </div>
                    <button 
                        type="button"
                        onClick={() => setFormData({...formData, isRecurring: !formData.isRecurring})}
                        className={`w-10 h-6 rounded-full transition-all relative ${formData.isRecurring ? 'bg-indigo-600' : 'bg-slate-800'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.isRecurring ? 'left-5' : 'left-1'}`} />
                    </button>
                </div>
            </div>
            
            <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-2xl flex gap-3">
                <AlertTriangle size={20} className="text-amber-500 shrink-0" />
                <p className="text-[10px] text-amber-500/80 font-bold leading-relaxed uppercase tracking-tighter">
                   Initializing a new unit will broadcast a real-time event to all relevant mission nodes. Ensure all parameters verified.
                </p>
            </div>
          </div>

          <div className="md:col-span-2 flex justify-end gap-4 mt-4 pt-10 border-at border-slate-800">
            <button 
              type="button" 
              onClick={onClose}
              className="px-8 py-3 rounded-2xl text-xs font-black uppercase text-slate-500 hover:text-slate-200 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:to-indigo-400 text-white px-12 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 active:scale-95 flex items-center gap-3"
            >
              {loading ? 'Processing...' : (task ? 'Apply Changes' : 'Initialize Unit')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

const RefreshCcwIcon = ({ size, className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={size} 
        height={size} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
        <path d="M16 16h5v5"/>
    </svg>
)

export default TaskForm