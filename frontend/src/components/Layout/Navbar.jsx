import { Bell, Search, Menu, User, Sun, Moon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import NotificationBell from '../Notifications/NotificationBell'

const Navbar = () => {
  const { user } = useAuth()
  const { dark, toggle } = useTheme()

  return (
    <header className="h-16 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-8 sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Search tasks, teams, or employees..." 
            className="w-full bg-slate-800/50 border border-slate-700 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-200 placeholder-slate-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button 
          onClick={toggle}
          className="p-2 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-800/50 transition-all"
          title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {dark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <NotificationBell />
        
        <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-slate-200">{user?.username}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-cyan-500 p-0.5">
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" className="h-full w-full rounded-full object-cover border-2 border-slate-900" />
            ) : (
              <div className="h-full w-full rounded-full bg-slate-800 flex items-center justify-center border-2 border-slate-900">
                <User size={20} className="text-slate-400" />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
