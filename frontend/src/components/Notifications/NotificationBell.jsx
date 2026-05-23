import { useState } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '../../context/NotificationContext'
import NotificationCenter from './NotificationCenter'
import { motion, AnimatePresence } from 'framer-motion'

const NotificationBell = () => {
  const { unreadCount } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-400 hover:bg-slate-800 rounded-full transition-all relative group"
      >
        <Bell size={22} className="group-hover:text-indigo-400 transition-colors" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 text-[10px] font-bold text-white flex items-center justify-center rounded-full border-2 border-slate-900"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/20"
            />
            <NotificationCenter onClose={() => setIsOpen(false)} />
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default NotificationBell
