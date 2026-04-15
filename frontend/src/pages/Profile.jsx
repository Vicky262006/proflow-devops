import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import { PageLoader } from '../components/UI/LoadingSpinner'
import toast from 'react-hot-toast'
import { Camera, Edit3, Save, X, CheckSquare, Clock, TrendingUp, Key } from 'lucide-react'
import { format } from 'date-fns'

const StatBadge = ({ icon: Icon, label, value, color }) => (
  <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
    <div className={`p-2 rounded-xl mb-2 ${color}`}>
      <Icon className="w-4 h-4 text-white" />
    </div>
    <div className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{value}</div>
    <div className="text-xs text-gray-500 dark:text-gray-400 text-center">{label}</div>
  </div>
)

const Profile = () => {
  const { user, updateUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [form, setForm] = useState({ username: '', bio: '', avatar: '' })
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setForm({ username: user.username || '', bio: user.bio || '', avatar: user.avatar || '' })
      fetchTasks()
    }
  }, [user])

  const fetchTasks = async () => {
    try {
      const { data } = await api.get('/tasks')
      setTasks(data)
    } catch {}
    setLoading(false)
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await api.put('/auth/profile', form)
      updateUser(data)
      setEditing(false)
      toast.success('Profile updated!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 1024 * 1024 * 2) {
      return toast.error('Image must be less than 2MB')
    }
    const reader = new FileReader()
    reader.onload = (ev) => setForm(f => ({ ...f, avatar: ev.target.result }))
    reader.readAsDataURL(file)
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (pwForm.newPassword !== pwForm.confirm) return toast.error('Passwords do not match')
    if (pwForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters')
    setSaving(true)
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      })
      toast.success('Password changed successfully')
      setChangingPassword(false)
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  const completedTasks = tasks.filter(t => t.status === 'completed')
  const myTasks = tasks.filter(t => t.creator?._id === user?._id || t.creator === user?._id)
  const assignedToMe = tasks.filter(t => t.assignee?._id === user?._id || t.assignee === user?._id)

  if (loading) return <PageLoader />

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Profile Card */}
      <div className="card p-8">
        <div className="flex items-start gap-6 flex-col sm:flex-row">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-4xl font-extrabold shadow-glow-lg overflow-hidden">
              {(editing ? form.avatar : user?.avatar)
                ? <img src={editing ? form.avatar : user?.avatar} className="w-full h-full object-cover" alt={user?.username} />
                : user?.username?.[0]?.toUpperCase()
              }
            </div>
            {editing && (
              <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors shadow-md">
                <Camera className="w-4 h-4 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {editing ? (
              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div>
                  <label className="label">Username</label>
                  <input className="input" value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required minLength={3} />
                </div>
                <div>
                  <label className="label">Bio</label>
                  <textarea className="input resize-none" rows={2} value={form.bio}
                    onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                    placeholder="Tell your team a bit about yourself..." maxLength={200} />
                  <p className="text-xs text-gray-400 mt-1">{form.bio.length}/200</p>
                </div>
                <div>
                  <label className="label">Avatar URL (or upload above)</label>
                  <input className="input" value={form.avatar}
                    onChange={e => setForm(f => ({ ...f, avatar: e.target.value }))}
                    placeholder="https://..." />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={saving} className="btn-primary">
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button type="button" onClick={() => { setEditing(false); setForm({ username: user.username, bio: user.bio || '', avatar: user.avatar || '' }) }} className="btn-secondary">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{user?.username}</h2>
                  <button id="edit-profile-btn" onClick={() => setEditing(true)} className="btn-secondary">
                    <Edit3 className="w-4 h-4" /> Edit Profile
                  </button>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">{user?.email}</p>
                {user?.bio && <p className="text-gray-600 dark:text-gray-300 text-sm">{user.bio}</p>}
                <div className="flex items-center gap-3 mt-3">
                  <span className="badge bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                  </span>
                  <span className="text-xs text-gray-400">
                    Member since {user?.createdAt ? format(new Date(user.createdAt), 'MMM yyyy') : '–'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatBadge icon={CheckSquare} label="Tasks Created" value={myTasks.length}
          color="bg-gradient-to-br from-primary-500 to-primary-700" />
        <StatBadge icon={TrendingUp} label="Completed" value={completedTasks.length}
          color="bg-gradient-to-br from-green-500 to-emerald-600" />
        <StatBadge icon={Clock} label="Assigned to Me" value={assignedToMe.length}
          color="bg-gradient-to-br from-purple-500 to-purple-700" />
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary-500" />
            <h3 className="font-bold text-gray-900 dark:text-gray-100">Security</h3>
          </div>
          {!changingPassword && (
            <button id="change-password-btn" onClick={() => setChangingPassword(true)} className="btn-secondary text-sm">
              Change Password
            </button>
          )}
        </div>

        {changingPassword ? (
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="label">Current Password</label>
              <input type="password" className="input" value={pwForm.currentPassword}
                onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} required />
            </div>
            <div>
              <label className="label">New Password</label>
              <input type="password" className="input" value={pwForm.newPassword}
                onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} required minLength={6} />
            </div>
            <div>
              <label className="label">Confirm New Password</label>
              <input type="password" className="input" value={pwForm.confirm}
                onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Updating...' : 'Update Password'}
              </button>
              <button type="button" onClick={() => setChangingPassword(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Keep your account safe with a strong, unique password.
          </p>
        )}
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h3>
        {tasks.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {tasks.slice(0, 5).map(task => (
              <div key={task._id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  task.status === 'completed' ? 'bg-green-500' :
                  task.status === 'in-progress' ? 'bg-blue-500' :
                  task.status === 'review' ? 'bg-purple-500' : 'bg-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{task.title}</p>
                  <p className="text-xs text-gray-400">
                    {task.creator?._id === user?._id ? 'Created' : 'Assigned'} · {format(new Date(task.createdAt), 'MMM d, yyyy')}
                  </p>
                </div>
                <span className={`badge text-xs ${
                  task.priority === 'urgent' ? 'priority-urgent' :
                  task.priority === 'high' ? 'priority-high' :
                  task.priority === 'medium' ? 'priority-medium' : 'priority-low'
                }`}>
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
