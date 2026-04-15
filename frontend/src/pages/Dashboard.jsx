import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { PageLoader } from '../components/UI/LoadingSpinner'
import TaskPieChart from '../components/Charts/TaskPieChart'
import TaskLineChart from '../components/Charts/TaskLineChart'
import PriorityBarChart from '../components/Charts/PriorityBarChart'
import TaskCard from '../components/UI/TaskCard'
import Modal from '../components/UI/Modal'
import TaskForm from '../components/Tasks/TaskForm'
import toast from 'react-hot-toast'
import {
  CheckSquare, Clock, TrendingUp, Users, Plus, Zap,
  ArrowUpRight, Activity, Star
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const StatCard = ({ label, value, icon: Icon, color, sub, trend }) => (
  <div className="stat-card group hover:scale-[1.02] transition-transform">
    <div className="flex items-start justify-between">
      <div className={`p-3 rounded-xl ${color} mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {trend !== undefined && (
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
          {trend >= 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <div className="text-3xl font-extrabold text-gray-900 dark:text-gray-100">{value}</div>
    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</div>
    {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
  </div>
)

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [analytics, setAnalytics] = useState(null)
  const [recentTasks, setRecentTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [teams, setTeams] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [analyticsRes, tasksRes, teamsRes] = await Promise.all([
        api.get('/tasks/analytics'),
        api.get('/tasks?limit=6'),
        api.get('/teams'),
      ])
      setAnalytics(analyticsRes.data)
      setRecentTasks(tasksRes.data.slice(0, 6))
      setTeams(teamsRes.data)
    } catch (err) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleTaskCreated = (task) => {
    setShowCreate(false)
    setRecentTasks(prev => [task, ...prev.slice(0, 5)])
    fetchData()
  }

  const handleDeleteTask = async (id) => {
    if (!confirm('Delete this task?')) return
    try {
      await api.delete(`/tasks/${id}`)
      setRecentTasks(prev => prev.filter(t => t._id !== id))
      toast.success('Task deleted')
      fetchData()
    } catch {
      toast.error('Failed to delete task')
    }
  }

  const completionRate = analytics?.total > 0
    ? Math.round((analytics.completed / analytics.total) * 100) : 0

  if (loading) return <PageLoader />

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            <span className="text-gradient">{user?.username}</span> 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Here's what's happening with your tasks today.
          </p>
        </div>
        <button id="dashboard-create-task" onClick={() => setShowCreate(true)} className="btn-primary flex-shrink-0">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tasks" value={analytics?.total || 0} icon={CheckSquare}
          color="bg-gradient-to-br from-primary-500 to-primary-700" sub="All time" />
        <StatCard label="Completed" value={analytics?.completed || 0} icon={Star}
          color="bg-gradient-to-br from-green-500 to-emerald-600" sub={`${completionRate}% rate`} trend={completionRate} />
        <StatCard label="In Progress" value={analytics?.inProgress || 0} icon={TrendingUp}
          color="bg-gradient-to-br from-blue-500 to-blue-700" sub="Active tasks" />
        <StatCard label="Teams" value={teams.length} icon={Users}
          color="bg-gradient-to-br from-purple-500 to-purple-700" sub="Collaborating" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-gray-100">Task Status</h2>
            <Activity className="w-4 h-4 text-gray-400" />
          </div>
          <TaskPieChart
            completed={analytics?.completed || 0}
            pending={analytics?.pending || 0}
            inProgress={analytics?.inProgress || 0}
            review={analytics?.review || 0}
          />
        </div>

        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-gray-100">Progress (Last 7 Days)</h2>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <TaskLineChart dailyAgg={analytics?.dailyAgg || []} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-gray-100">Priority Breakdown</h2>
            <Zap className="w-4 h-4 text-gray-400" />
          </div>
          <PriorityBarChart priorityAgg={analytics?.priorityAgg || []} />
        </div>

        {/* Recent Tasks */}
        <div className="card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-gray-100">Recent Tasks</h2>
            <button onClick={() => navigate('/tasks')} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              View all <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          {recentTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <CheckSquare className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No tasks yet</p>
              <button onClick={() => setShowCreate(true)} className="mt-3 text-primary-600 text-sm hover:underline">
                Create your first task →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentTasks.map(task => (
                <TaskCard key={task._id} task={task}
                  onDelete={handleDeleteTask}
                  onView={(t) => navigate(`/tasks?view=${t._id}`)}
                  onEdit={(t) => navigate(`/tasks?edit=${t._id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Teams quick view */}
      {teams.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900 dark:text-gray-100">Your Teams</h2>
            <button onClick={() => navigate('/teams')} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              Manage <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
          <div className="flex flex-wrap gap-3">
            {teams.slice(0, 5).map(team => (
              <div key={team._id}
                onClick={() => navigate('/teams')}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl cursor-pointer transition-colors group"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                  {team.name[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-primary-600 transition-colors">{team.name}</p>
                  <p className="text-xs text-gray-400">{team.members?.length} member{team.members?.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Task">
        <TaskForm onSuccess={handleTaskCreated} onCancel={() => setShowCreate(false)} />
      </Modal>
    </div>
  )
}

export default Dashboard
