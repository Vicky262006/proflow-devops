import { useEffect, useState } from 'react'
import { 
  BarChart, Bar, 
  AreaChart, Area, 
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import { Filter, Calendar, Download, RefreshCcw, TrendingUp, Users, Target, Activity } from 'lucide-react'
import api from '../api/axios'
import { motion } from 'framer-motion'

const Analytics = () => {
    const [overview, setOverview] = useState(null)
    const [productivity, setProductivity] = useState([])
    const [teamPerformance, setTeamPerformance] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [overRes, prodRes, teamRes] = await Promise.all([
                    api.get('/analytics/overview'),
                    api.get('/analytics/employee-productivity'),
                    api.get('/analytics/team-performance')
                ])
                setOverview(overRes.data)
                setProductivity(prodRes.data)
                setTeamPerformance(teamRes.data)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    if (loading) return <div className="p-8 text-center text-slate-500 font-black uppercase tracking-[0.3em] animate-pulse">Aggregating Enterprise Data...</div>

    const COLORS = ['#6366f1', '#22d3ee', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

    return (
        <div className="space-y-12 max-w-[1600px] mx-auto pb-12 animate-in fade-in duration-1000">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-100 tracking-tighter uppercase">Intelligence Core</h1>
                    <p className="text-slate-500 font-bold flex items-center gap-2 mt-2">
                        <Activity size={18} className="text-indigo-400" /> Strategic performance metrics and trajectory analytics
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white transition-all">
                        <Calendar size={18} /> Last Quarter
                    </button>
                    <button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                        <Download size={18} /> Export Intel
                    </button>
                </div>
            </header>

            {/* Top KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Completion Efficiency', value: `${100 - overview.deadlineMissRate}%`, icon: Target, color: 'indigo' },
                    { label: 'Fleet Velocity', value: overview.weeklyCompleted.reduce((acc, curr) => acc + curr.count, 0), icon: TrendingUp, color: 'emerald' },
                    { label: 'Resource Load', value: overview.activeTasks, icon: Users, color: 'cyan' },
                    { label: 'Risk Factor', value: overview.overdueTasks, icon: RefreshCcw, color: 'amber' }
                ].map((kpi, i) => (
                    <motion.div 
                        key={kpi.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-slate-900/50 backdrop-blur-md border border-slate-800 p-8 rounded-3xl group"
                    >
                        <div className={`p-3 rounded-2xl bg-${kpi.color}-500/10 text-${kpi.color}-400 inline-block mb-4 group-hover:scale-110 transition-transform`}>
                            <kpi.icon size={24} />
                        </div>
                        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">{kpi.label}</p>
                        <h3 className="text-4xl font-black text-slate-100 mt-2">{kpi.value}</h3>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Employee productivity bar chart */}
                <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 h-[450px] flex flex-col">
                    <h3 className="text-lg font-bold text-slate-200 mb-8 uppercase tracking-tighter">Personnel Production Rank</h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={productivity.slice(0, 10)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--slate-800))" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="user.username" 
                                    type="category" 
                                    stroke="rgb(var(--slate-400))" 
                                    fontSize={10} 
                                    width={100}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                                    contentStyle={{ backgroundColor: 'rgb(var(--slate-900))', border: '1px solid rgb(var(--slate-800))', borderRadius: '12px', color: 'rgb(var(--slate-200))' }}
                                />
                                <Bar dataKey="completionRate" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
                                <Bar dataKey="avgProgress" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                {/* Team performance radar chart */}
                <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 h-[450px] flex flex-col">
                    <h3 className="text-lg font-bold text-slate-200 mb-8 uppercase tracking-tighter">Strategic Team Performance</h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart outerRadius={120} data={teamPerformance}>
                                <PolarGrid stroke="rgb(var(--slate-700))" />
                                <PolarAngleAxis dataKey="team" stroke="rgb(var(--slate-400))" fontSize={10} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgb(var(--slate-700))" fontSize={8} />
                                <Radar 
                                    name="Completion %" 
                                    dataKey="completionRate" 
                                    stroke="#818cf8" 
                                    fill="#818cf8" 
                                    fillOpacity={0.6} 
                                />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'rgb(var(--slate-900))', border: '1px solid rgb(var(--slate-800))', borderRadius: '12px', color: 'rgb(var(--slate-200))' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </section>
            </div>

            {/* Trend chart */}
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 h-[500px] flex flex-col">
                <div className="flex items-center justify-between mb-10">
                    <h3 className="text-lg font-bold text-slate-200 uppercase tracking-tighter">Enterprise Velocity Stream</h3>
                    <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full bg-indigo-500" />
                           <span className="text-[10px] uppercase font-black text-slate-500">Output</span>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full bg-cyan-400" />
                           <span className="text-[10px] uppercase font-black text-slate-500">Intake</span>
                        </div>
                    </div>
                </div>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={overview.weeklyCompleted}>
                            <defs>
                                <linearGradient id="gradientIndigo" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="5 5" stroke="rgb(var(--slate-800))" vertical={false} />
                            <XAxis dataKey="_id" stroke="rgb(var(--slate-400))" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="rgb(var(--slate-400))" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'rgb(var(--slate-900))', border: '1px solid rgb(var(--slate-800))', borderRadius: '16px', color: 'rgb(var(--slate-200))' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="count" 
                                stroke="#6366f1" 
                                strokeWidth={4} 
                                fillOpacity={1} 
                                fill="url(#gradientIndigo)" 
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </section>
        </div>
    )
}

export default Analytics
