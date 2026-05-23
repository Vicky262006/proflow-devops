import { useNotifications } from '../../context/NotificationContext'
import { X, Check, BellOff, ExternalLink } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'

const NotificationCenter = ({ onClose }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  return (
    <motion.div 
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className="absolute right-0 mt-4 w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col max-h-[80vh] overflow-hidden"
    >
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 backdrop-blur-sm">
        <div>
          <h3 className="font-bold text-slate-200">Notifications</h3>
          <p className="text-xs text-slate-500">{unreadCount} unread messages</p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="p-2 text-indigo-400 hover:bg-slate-800 rounded-lg text-xs font-semibold"
              title="Mark all as read"
            >
              <Check size={16} />
            </button>
          )}
          <button onClick={onClose} className="p-2 text-slate-500 hover:bg-slate-800 rounded-lg">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {notifications.length === 0 ? (
          <div className="py-20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 text-slate-500 mb-4">
              <BellOff size={32} />
            </div>
            <p className="text-sm text-slate-400 font-medium">No notifications yet</p>
            <p className="text-xs text-slate-600 mt-1">We'll let you know when things happen</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div 
              key={n._id}
              className={`p-4 rounded-xl border transition-all duration-200 group ${
                n.read 
                  ? 'bg-transparent border-transparent opacity-60' 
                  : 'bg-indigo-500/5 border-indigo-500/10 hover:border-indigo-500/30'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  n.priority === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-400'
                }`}>
                  {n.type?.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-slate-600 font-medium">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-3">{n.message}</p>
              <div className="flex items-center justify-between">
                {n.actionUrl && (
                  <a 
                    href={n.actionUrl} 
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                  >
                    View Details <ExternalLink size={12} />
                  </a>
                )}
                {!n.read && (
                  <button 
                    onClick={() => markAsRead(n._id)}
                    className="text-[10px] font-bold text-slate-500 hover:text-indigo-400 uppercase tracking-tighter"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="p-4 border-t border-slate-800 text-center bg-slate-900/50">
        <button className="text-xs font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest">
          View all activity
        </button>
      </div>
    </motion.div>
  )
}

export default NotificationCenter
