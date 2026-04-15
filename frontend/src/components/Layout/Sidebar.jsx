import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, CheckSquare, Users, User, LogOut,
  Zap, ChevronRight, Settings
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/teams', icon: Users, label: 'Teams' },
  { to: '/profile', icon: User, label: 'Profile' },
]

const Sidebar = ({ collapsed, onClose }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full z-30 flex flex-col
        w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800
        transition-transform duration-300 ease-in-out
        ${collapsed ? '-translate-x-full lg:translate-x-0 lg:w-20' : 'translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-gray-100 dark:border-gray-800">
          <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-glow">
            <Zap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="font-bold text-lg text-gradient leading-none">ProFlow</h1>
              <p className="text-xs text-gray-400 mt-0.5">Productivity Platform</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''} ${collapsed ? 'justify-center px-0' : ''}`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="animate-fade-in">{label}</span>}
              {!collapsed && <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100" />}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-gray-100 dark:border-gray-800 space-y-1">
          <NavLink
            to="/profile"
            onClick={onClose}
            className={`flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 ${collapsed ? 'justify-center' : ''}`}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
              {user?.avatar
                ? <img src={user.avatar} alt={user.username} className="w-9 h-9 rounded-xl object-cover" />
                : user?.username?.[0]?.toUpperCase() || 'U'
              }
            </div>
            {!collapsed && (
              <div className="min-w-0 animate-fade-in">
                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{user?.username}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            )}
          </NavLink>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 font-medium ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="animate-fade-in">Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
