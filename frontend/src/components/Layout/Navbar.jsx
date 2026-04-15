import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Moon, Sun, Menu, X, Search, Check, CheckCheck } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import { formatDistanceToNow } from 'date-fns'

const Navbar = ({ onMenuToggle, sidebarCollapsed }) => {
  const { dark, toggle } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [unread, setUnread] = useState(0)
  const notifRef = useRef(null)

  useEffect(() => {
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchUnread = async () => {
    try {
      const { data } = await api.get('/notifications/unread-count')
      setUnread(data.count)
    } catch {}
  }

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications')
      setNotifications(data)
    } catch {}
  }

  const handleBellClick = () => {
    if (!showNotifs) fetchNotifications()
    setShowNotifs(v => !v)
  }

  const markAll = async () => {
    try {
      await api.put('/notifications/mark-all-read')
      setNotifications(ns => ns.map(n => ({ ...n, isRead: true })))
      setUnread(0)
    } catch {}
  }

  const markOne = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`)
      setNotifications(ns => ns.map(n => n._id === id ? { ...n, isRead: true } : n))
      setUnread(u => Math.max(0, u - 1))
    } catch {}
  }

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const notifIcons = {
    task_assigned: '📋',
    task_updated: '✏️',
    task_completed: '✅',
    comment_added: '💬',
    team_invite: '👥',
    team_joined: '🎉',
  }

  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 z-10 h-16 glass border-b border-white/20 dark:border-gray-700/30 flex items-center px-4 gap-3 transition-all duration-300">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors lg:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search bar */}
      <div className="flex-1 max-w-md hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100/80 dark:bg-gray-800/80 rounded-xl">
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          className="flex-1 bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none"
          placeholder="Search tasks, teams..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.target.value.trim()) {
              navigate(`/tasks?search=${e.target.value.trim()}`)
              e.target.value = ''
            }
          }}
        />
      </div>

      <div className="flex-1" />

      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 text-gray-600 dark:text-gray-400"
        title="Toggle theme"
      >
        {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Notifications */}
      <div className="relative" ref={notifRef}>
        <button
          onClick={handleBellClick}
          className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 text-gray-600 dark:text-gray-400"
        >
          <Bell className="w-5 h-5" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white animate-pulse">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>

        {/* Notifications dropdown */}
        {showNotifs && (
          <div className="absolute right-0 top-12 w-80 card shadow-xl animate-slide-up overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-semibold text-sm">Notifications</h3>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={markAll} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                    <CheckCheck className="w-3 h-3" /> Mark all read
                  </button>
                )}
                <button onClick={() => setShowNotifs(false)}>
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n._id}
                    onClick={() => markOne(n._id)}
                    className={`flex gap-3 p-4 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50 ${!n.isRead ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}
                  >
                    <span className="text-lg flex-shrink-0">{notifIcons[n.type] || '🔔'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    {!n.isRead && <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* User avatar */}
      <button
        onClick={() => navigate('/profile')}
        className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
          {user?.avatar
            ? <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
            : user?.username?.[0]?.toUpperCase() || 'U'
          }
        </div>
      </button>
    </header>
  )
}

export default Navbar
