import { useEffect, useState } from 'react'
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  RefreshCcw,
  Target
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import api from '../api/axios'
import { motion, AnimatePresence } from 'framer-motion'
import TaskForm from '../components/Tasks/TaskForm'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/analytics/overview')
      setStats(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (loading) return <div className="animate-pulse space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-slate-900 rounded-2xl" />)}
    </div>
    <div className="h-96 bg-slate-900 rounded-2xl" />
  </div>

  const kpis = [
    { label: 'Total Tasks', value: stats.totalTasks, trend: '+12%', up: true, icon: CheckCircle2, color: 'indigo' },
    { label: 'Active Tasks', value: stats.activeTasks, trend: '-2%', up: false, icon: RefreshCcw, color: 'cyan' },
    { label: 'Overdue', value: stats.overdueTasks, trend: '+5%', up: false, icon: AlertTriangle, color: 'amber' },
    { label: 'Completion Rate', value: `${100 - stats.deadlineMissRate}%`, trend: '+8%', up: true, icon: Target, color: 'emerald' },
  ]

  const COLORS = ['#818cf8', '#22d3ee', '#f59e0b', '#10b981']

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 tracking-tight">Enterprise Overview</h1>
          <p className="text-slate-500 mt-1">Real-time collaboration and performance metrics</p>
        </div>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          <Plus size={20} /> Deploy New Task
        </button>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <motion.div 
            key={kpi.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-900 border border-slate-800 p-6 rounded-2xl group hover:border-indigo-500/30 transition-all cursor-default"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl bg-${kpi.color}-500/10 text-${kpi.color}-400 group-hover:scale-110 transition-transform`}>
                <kpi.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${kpi.up ? 'text-emerald-400' : 'text-amber-400'}`}>
                {kpi.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {kpi.trend}
              </div>
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">{kpi.label}</p>
              <h3 className="text-3xl font-black text-slate-100 mt-1">{kpi.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[450px]">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-lg text-slate-200">Velocity & Completion Trend</h3>
            <select className="bg-slate-800 border-none text-xs font-bold rounded-lg px-3 py-1.5 focus:ring-0">
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
            </select>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.weeklyCompleted}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--slate-800))" vertical={false} />
                <XAxis 
                  dataKey="_id" 
                  stroke="rgb(var(--slate-400))" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => `W${val.split('-')[1]}`}
                />
                <YAxis stroke="rgb(var(--slate-400))" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgb(var(--slate-900))', border: '1px solid rgb(var(--slate-800))', borderRadius: '12px', color: 'rgb(var(--slate-200))' }}
                  itemStyle={{ color: 'rgb(var(--primary-500))', fontWeight: 'bold' } }
                />
                <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Donut */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col">
          <h3 className="font-bold text-lg text-slate-200 mb-8 text-center">Workload Distribution</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.priorityBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="_id"
                >
                  {stats.priorityBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgb(var(--slate-900))', border: '1px solid rgb(var(--slate-800))', borderRadius: '12px', color: 'rgb(var(--slate-200))' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {stats.priorityBreakdown.map((item, i) => (
              <div key={item._id} className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] font-bold text-slate-500 uppercase">{item._id} ({item.count})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isFormOpen && (
          <TaskForm 
            onClose={() => {
              setIsFormOpen(false)
              fetchStats()
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdminDashboard
