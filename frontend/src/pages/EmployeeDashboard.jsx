import { useEffect, useState } from 'react'
import { 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Zap, 
  ArrowRight,
  TrendingUp,
  Briefcase
} from 'lucide-react'
import { 
  ResponsiveContainer, 
  LineChart, 
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import { format } from 'date-fns'

const EmployeeDashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [attendance, setAttendance] = useState(null)
  const [recentTasks, setRecentTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, attendanceRes, tasksRes] = await Promise.all([
          api.get('/tasks/analytics'),
          api.get('/attendance/my'),
          api.get('/tasks?limit=5')
        ])
        setStats(statsRes.data)
        setAttendance(attendanceRes.data)
        setRecentTasks(tasksRes.data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div className="p-8 text-center text-slate-500">Optimizing your workflow...</div>

  const productivityData = stats.dailyAgg.map(d => ({
    date: d._id,
    tasks: d.count,
    completed: d.completed
  }))

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-12 animate-in fade-in zoom-in-95 duration-700">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black text-slate-100 tracking-tighter">
            Bonjour, {user?.username} <span className="animate-wave inline-block text-2xl">👋</span>
          </h1>
          <p className="text-slate-400 mt-2 font-medium flex items-center gap-2">
            <Briefcase size={16} className="text-indigo-400" /> {user?.position || 'Team Member'} • {user?.department || 'Product Development'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-slate-200">{format(new Date(), 'EEEE')}</p>
          <p className="text-slate-500 font-bold">{format(new Date(), 'MMM do, yyyy')}</p>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
          <TrendingUp size={120} className="absolute -right-8 -bottom-8 opacity-10 group-hover:scale-125 transition-transform duration-700" />
          <div className="relative z-10">
            <p className="text-indigo-200 font-bold text-sm uppercase tracking-widest mb-1">Weekly completion</p>
            <h3 className="text-5xl font-black">{stats.completed}</h3>
            <p className="mt-4 text-indigo-100/80 text-sm flex items-center gap-1 font-medium">
              <Zap size={14} className="text-yellow-400 fill-yellow-400" /> {stats.inProgress} units building in queue
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl hover:border-slate-700 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 text-slate-400 mb-6">
              <Clock size={20} className="text-cyan-400" />
              <span className="font-bold text-xs uppercase tracking-widest">Shift Status</span>
            </div>
            {attendance?.today?.checkIn ? (
              <div>
                <p className="text-slate-500 text-sm font-medium">Logged in at</p>
                <h4 className="text-2xl font-bold text-slate-100 mt-1">{format(new Date(attendance.today.checkIn), 'hh:mm a')}</h4>
              </div>
            ) : (
              <div className="py-2">
                <p className="text-slate-400 font-medium">You haven't checked in yet.</p>
                <button className="mt-4 bg-cyan-600/10 text-cyan-400 px-4 py-2 rounded-xl text-xs font-black uppercase hover:bg-cyan-600/20 transition-all">
                  Check In Now
                </button>
              </div>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 flex justify-between items-center">
            <span className="text-xs text-slate-500 font-medium italic">Shift Ends in ~3h 24m</span>
            <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 w-2/3" />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl hover:border-slate-700 transition-all">
          <div className="flex items-center gap-3 text-slate-400 mb-6">
            <Calendar size={20} className="text-emerald-400" />
            <span className="font-bold text-xs uppercase tracking-widest">Velocity insights</span>
          </div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={productivityData}>
                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-xs font-black text-emerald-400 mt-2 uppercase tracking-tighter">Your production is 14% higher than last week</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Tasks List */}
        <section className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <CheckCircle2 size={24} className="text-indigo-400" /> Priority Pipeline
            </h3>
            <button className="text-indigo-400 text-xs font-bold uppercase hover:underline">View Kanban</button>
          </div>
          <div className="space-y-4">
            {recentTasks.filter(t => t.status !== 'completed').map((task) => (
              <div 
                key={task._id} 
                className="group flex items-center justify-between p-5 bg-slate-900 rounded-2xl border border-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-1.5 rounded-full ${
                    task.priority === 'urgent' ? 'bg-red-500' : 
                    task.priority === 'high' ? 'bg-amber-500' : 
                    'bg-indigo-500'
                  }`} />
                  <div>
                    <h4 className="text-sm font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{task.title}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-1">Due {format(new Date(task.deadline), 'MMM d')}</p>
                  </div>
                </div>
                <ArrowRight size={18} className="text-slate-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        </section>

        {/* Productivity Analytics */}
        <section className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-100">Performance Metrics</h3>
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500" />
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={productivityData}>
                <CartesianGrid strokeDasharray="10 10" stroke="rgb(var(--slate-800))" vertical={false} />
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgb(var(--slate-900))', border: '1px solid rgb(var(--slate-800))', borderRadius: '12px', color: 'rgb(var(--slate-200))' }}
                />
                <Line type="stepAfter" dataKey="tasks" stroke="#6366f1" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} />
                <Line type="stepAfter" dataKey="completed" stroke="#10b981" strokeWidth={4} dot={{ r: 4, strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Efficiency</p>
              <p className="text-2xl font-black text-indigo-400">92%</p>
            </div>
            <div className="text-center p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Accuracy</p>
              <p className="text-2xl font-black text-emerald-400">98.4</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default EmployeeDashboard
