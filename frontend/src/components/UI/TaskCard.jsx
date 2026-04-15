import { format, isAfter, parseISO } from 'date-fns'
import { Calendar, User, Tag, MoreVertical, Pencil, Trash2, Eye } from 'lucide-react'
import { useState } from 'react'

const priorityStyles = {
  urgent: 'priority-urgent',
  high: 'priority-high',
  medium: 'priority-medium',
  low: 'priority-low',
}

const statusStyles = {
  'todo': 'status-todo',
  'in-progress': 'status-in-progress',
  'review': 'status-review',
  'completed': 'status-completed',
}

const priorityDots = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500',
}

const TaskCard = ({ task, onEdit, onDelete, onView, dragging }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const isOverdue = task.deadline && task.status !== 'completed' && isAfter(new Date(), new Date(task.deadline))

  return (
    <div className={`
      card p-4 cursor-pointer group relative select-none
      ${dragging ? 'shadow-xl ring-2 ring-primary-400 rotate-1 scale-105' : ''}
      ${isOverdue ? 'border-red-200 dark:border-red-800' : ''}
      hover:border-primary-200 dark:hover:border-primary-800
    `}>
      {/* Priority indicator */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`badge ${priorityStyles[task.priority] || 'priority-medium'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${priorityDots[task.priority] || 'bg-yellow-500'}`} />
            {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
          </span>
          <span className={`badge ${statusStyles[task.status] || 'status-todo'}`}>
            {task.status === 'in-progress' ? 'In Progress' : task.status?.charAt(0).toUpperCase() + task.status?.slice(1)}
          </span>
        </div>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v) }}
            className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
          >
            <MoreVertical className="w-4 h-4 text-gray-400" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-6 w-40 card shadow-lg z-10 py-1 animate-slide-up">
              <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onView?.(task) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                <Eye className="w-4 h-4" /> View Details
              </button>
              <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onEdit?.(task) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300">
                <Pencil className="w-4 h-4" /> Edit
              </button>
              <button onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete?.(task._id) }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h3
        onClick={() => onView?.(task)}
        className={`font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1 line-clamp-2 hover:text-primary-600 transition-colors ${task.status === 'completed' ? 'line-through opacity-60' : ''}`}
      >
        {task.title}
      </h3>

      {task.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Tags */}
      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map(tag => (
            <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-md text-xs">
              <Tag className="w-2.5 h-2.5" /> {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        {task.deadline ? (
          <div className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
            <Calendar className="w-3.5 h-3.5" />
            {isOverdue ? 'Overdue · ' : ''}{format(new Date(task.deadline), 'MMM d')}
          </div>
        ) : <div />}

        {task.assignee && (
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
              {task.assignee?.avatar
                ? <img src={task.assignee.avatar} alt={task.assignee.username} className="w-full h-full object-cover" />
                : task.assignee?.username?.[0]?.toUpperCase()
              }
            </div>
            <span className="text-xs text-gray-400">{task.assignee?.username}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default TaskCard
