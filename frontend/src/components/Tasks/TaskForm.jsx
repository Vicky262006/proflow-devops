import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'
import { Plus, X, Calendar, Tag } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUSES = ['todo', 'in-progress', 'review', 'completed']
const PRIORITIES = ['low', 'medium', 'high', 'urgent']

const TaskForm = ({ initial, onSuccess, onCancel }) => {
  const { user } = useAuth()

  // ✅ FIXED STATE (NO DUPLICATE KEYS)
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    tags: [],
    ...initial,
    deadline: initial?.deadline ? initial.deadline.split('T')[0] : '',
    assignee: initial?.assignee?._id || initial?.assignee || '',
    team: initial?.team?._id || initial?.team || ''
  })

  const [tagInput, setTagInput] = useState('')
  const [teams, setTeams] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/teams')
      .then(res => setTeams(res.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (form.team) {
      const team = teams.find(t => t._id === form.team)
      if (team) setMembers(team.members || [])
    } else {
      setMembers([])
      setForm(f => ({ ...f, assignee: '' }))
    }
  }, [form.team, teams])

  const set = (field) => (e) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !form.tags.includes(tag) && form.tags.length < 5) {
      setForm(f => ({ ...f, tags: [...f.tags, tag] }))
      setTagInput('')
    }
  }

  const removeTag = (tag) =>
    setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.title.trim()) {
      return toast.error('Title is required')
    }

    setLoading(true)

    try {
      const payload = {
        ...form,
        assignee: form.assignee || null,
        team: form.team || null,
        deadline: form.deadline || null
      }

      if (initial?._id) {
        const { data } = await api.put(`/tasks/${initial._id}`, payload)
        toast.success('Task updated!')
        onSuccess?.(data)
      } else {
        const { data } = await api.post('/tasks', payload)
        toast.success('Task created!')
        onSuccess?.(data)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Title */}
      <div>
        <label className="label">Title *</label>
        <input
          className="input"
          value={form.title}
          onChange={set('title')}
          placeholder="What needs to be done?"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="label">Description</label>
        <textarea
          className="input resize-none"
          rows={3}
          value={form.description}
          onChange={set('description')}
          placeholder="Add details..."
        />
      </div>

      {/* Priority + Status */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Priority</label>
          <select className="input" value={form.priority} onChange={set('priority')}>
            {PRIORITIES.map(p => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={set('status')}>
            {STATUSES.map(s => (
              <option key={s} value={s}>
                {s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Deadline */}
      <div>
        <label className="label">
          <Calendar className="inline w-3.5 h-3.5 mr-1" />
          Deadline
        </label>
        <input
          type="date"
          className="input"
          value={form.deadline}
          onChange={set('deadline')}
          min={new Date().toISOString().split('T')[0]}
        />
      </div>

      {/* Team */}
      <div>
        <label className="label">Team</label>
        <select className="input" value={form.team} onChange={set('team')}>
          <option value="">Personal (No team)</option>
          {teams.map(t => (
            <option key={t._id} value={t._id}>{t.name}</option>
          ))}
        </select>
      </div>

      {/* Assignee */}
      {members.length > 0 && (
        <div>
          <label className="label">Assign To</label>
          <select className="input" value={form.assignee} onChange={set('assignee')}>
            <option value="">Unassigned</option>
            {members.map(m => (
              <option key={m.user._id} value={m.user._id}>
                {m.user.username}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tags */}
      <div>
        <label className="label">
          <Tag className="inline w-3.5 h-3.5 mr-1" />
          Tags
        </label>

        <div className="flex gap-2">
          <input
            className="input flex-1"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTag()
              }
            }}
            placeholder="Add tag & press Enter"
          />

          <button type="button" onClick={addTag} className="btn-secondary px-3">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {form.tags.map(tag => (
              <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg text-xs font-medium">
                {tag}
                <button type="button" onClick={() => removeTag(tag)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? 'Saving...' : initial?._id ? 'Update Task' : 'Create Task'}
        </button>

        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
      </div>

    </form>
  )
}

export default TaskForm