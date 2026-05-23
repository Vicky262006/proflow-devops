import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  CheckSquare, 
  Users, 
  BarChart3, 
  UserCircle, 
  Settings, 
  LogOut,
  Calendar,
  ClipboardList,
  AlertCircle,
  FileText
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const Sidebar = ({ role }) => {
  const location = useLocation()
  const { logout } = useAuth()

  const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Tasks', path: '/admin/tasks', icon: CheckSquare },
    { name: 'Teams', path: '/admin/teams', icon: Users },
    { name: 'Employees', path: '/admin/employees', icon: ClipboardList },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Attendance', path: '/admin/attendance', icon: Calendar },
    { name: 'Reports', path: '/admin/reports', icon: FileText },
  ]

  const employeeLinks = [
    { name: 'My Dashboard', path: '/employee/dashboard', icon: LayoutDashboard },
    { name: 'My Tasks', path: '/employee/tasks', icon: CheckSquare },
    { name: 'Teams', path: '/employee/teams', icon: Users },
    { name: 'Attendance', path: '/employee/attendance', icon: Calendar },
    { name: 'Profile', path: '/profile', icon: UserCircle },
  ]

  const links = role === 'admin' ? adminLinks : employeeLinks

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full transition-all duration-300">
      <div className="p-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          ProFlow <span className="text-xs font-normal text-slate-500 block uppercase tracking-widest">Enterprise</span>
        </h2>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = location.pathname === link.path
          return (
            <Link
              key={link.path}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive 
                  ? 'bg-indigo-600/20 text-indigo-400 border-l-4 border-indigo-500' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-indigo-400' : 'group-hover:text-slate-200'} />
              <span className="font-medium">{link.name}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-lg transition-all duration-200"
        >
          <LogOut size={20} />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
