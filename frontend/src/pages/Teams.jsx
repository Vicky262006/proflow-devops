import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { PageLoader } from '../components/UI/LoadingSpinner'
import Modal from '../components/UI/Modal'
import TaskCard from '../components/UI/TaskCard'
import toast from 'react-hot-toast'
import {
  Plus, Users, Crown, LogOut, Trash2, Copy, Check,
  UserPlus, Settings, ChevronRight, X
} from 'lucide-react'

const TeamCard = ({ team, currentUser, onSelect, onLeave, onDelete }) => {
  const isOwner = team.owner?._id === currentUser?._id
  const [copied, setCopied] = useState(false)

  const copyInvite = (e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(team.inviteCode)
    setCopied(true)
    toast.success('Invite code copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card p-6 cursor-pointer hover:border-primary-200 dark:hover:border-primary-800 group transition-all hover:scale-[1.01]"
      onClick={() => onSelect(team)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-glow">
            {team.name[0].toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 transition-colors">
              {team.name}
            </h3>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              {isOwner && <Crown className="w-3 h-3 text-yellow-500" />}
              {isOwner ? 'Owner' : 'Member'}
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary-400 transition-colors" />
      </div>

      {team.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">{team.description}</p>
      )}

      {/* Members avatars */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex -space-x-2">
          {team.members?.slice(0, 5).map((m, i) => (
            <div key={m.user?._id || i}
              className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-900 bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold overflow-hidden"
              title={m.user?.username}>
              {m.user?.avatar
                ? <img src={m.user.avatar} className="w-full h-full object-cover" alt="" />
                : m.user?.username?.[0]?.toUpperCase()
              }
            </div>
          ))}
          {team.members?.length > 5 && (
            <div className="w-7 h-7 rounded-full border-2 border-white dark:border-gray-900 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
              +{team.members.length - 5}
            </div>
          )}
        </div>
        <span className="text-xs text-gray-400">{team.members?.length} member{team.members?.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-lg">{team.inviteCode}</span>
          <button onClick={copyInvite} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-primary-600 transition-all">
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
          {isOwner ? (
            <button onClick={() => onDelete(team._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-300 hover:text-red-500 transition-all">
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={() => onLeave(team._id, currentUser._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-300 hover:text-red-500 transition-all">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const Teams = () => {
  const { user } = useAuth()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', description: '' })
  const [joinCode, setJoinCode] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchTeams() }, [])

  const fetchTeams = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/teams')
      setTeams(data)
    } catch {
      toast.error('Failed to load teams')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!createForm.name.trim()) return toast.error('Team name is required')
    setSaving(true)
    try {
      const { data } = await api.post('/teams', createForm)
      setTeams(prev => [data, ...prev])
      setShowCreate(false)
      setCreateForm({ name: '', description: '' })
      toast.success(`Team "${data.name}" created!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create team')
    } finally {
      setSaving(false)
    }
  }

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!joinCode.trim()) return
    setSaving(true)
    try {
      const { data } = await api.post('/teams/join', { inviteCode: joinCode.trim().toUpperCase() })
      setTeams(prev => [data, ...prev])
      setShowJoin(false)
      setJoinCode('')
      toast.success(`Joined "${data.name}"!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid invite code')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this team? This action cannot be undone.')) return
    try {
      await api.delete(`/teams/${id}`)
      setTeams(prev => prev.filter(t => t._id !== id))
      if (selectedTeam?._id === id) setSelectedTeam(null)
      toast.success('Team deleted')
    } catch {
      toast.error('Failed to delete team')
    }
  }

  const handleLeave = async (teamId, userId) => {
    if (!confirm('Leave this team?')) return
    try {
      await api.delete(`/teams/${teamId}/members/${userId}`)
      setTeams(prev => prev.filter(t => t._id !== teamId))
      if (selectedTeam?._id === teamId) setSelectedTeam(null)
      toast.success('Left the team')
    } catch {
      toast.error('Failed to leave team')
    }
  }

  const removeMember = async (teamId, memberId) => {
    if (!confirm('Remove this member?')) return
    try {
      await api.delete(`/teams/${teamId}/members/${memberId}`)
      setSelectedTeam(prev => prev ? {
        ...prev,
        members: prev.members.filter(m => m.user._id !== memberId)
      } : null)
      setTeams(prev => prev.map(t => t._id === teamId ? {
        ...t, members: t.members.filter(m => m.user._id !== memberId)
      } : t))
      toast.success('Member removed')
    } catch {
      toast.error('Failed to remove member')
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Teams</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{teams.length} team{teams.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button id="join-team-btn" onClick={() => setShowJoin(true)} className="btn-secondary">
            <UserPlus className="w-4 h-4" /> Join Team
          </button>
          <button id="create-team-btn" onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> New Team
          </button>
        </div>
      </div>

      {teams.length === 0 ? (
        <div className="card p-16 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-200 dark:text-gray-700" />
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">No teams yet</h3>
          <p className="text-gray-400 mb-6 text-sm">Create a team or join one with an invite code</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => setShowJoin(true)} className="btn-secondary">Join with Code</button>
            <button onClick={() => setShowCreate(true)} className="btn-primary">Create Team</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map(team => (
            <TeamCard key={team._id} team={team} currentUser={user}
              onSelect={setSelectedTeam} onLeave={handleLeave} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {/* Team Detail Modal */}
      <Modal isOpen={!!selectedTeam} onClose={() => setSelectedTeam(null)} title={selectedTeam?.name || ''} size="lg">
        {selectedTeam && (
          <div className="space-y-5">
            {selectedTeam.description && (
              <p className="text-gray-600 dark:text-gray-400 text-sm">{selectedTeam.description}</p>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Invite code:</span>
              <span className="font-mono font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-3 py-1 rounded-lg text-sm">
                {selectedTeam.inviteCode}
              </span>
              <button onClick={() => { navigator.clipboard.writeText(selectedTeam.inviteCode); toast.success('Copied!') }}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">Members ({selectedTeam.members?.length})</h3>
              <div className="space-y-2">
                {selectedTeam.members?.map(m => (
                  <div key={m.user?._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-purple-400 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                        {m.user?.avatar ? <img src={m.user.avatar} className="w-full h-full object-cover" alt="" /> : m.user?.username?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{m.user?.username}</p>
                        <p className="text-xs text-gray-400">{m.user?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${m.role === 'admin' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                        {m.role === 'admin' && <Crown className="w-3 h-3" />} {m.role}
                      </span>
                      {selectedTeam.owner?._id === user?._id && m.user?._id !== user?._id && (
                        <button onClick={() => removeMember(selectedTeam._id, m.user._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-300 hover:text-red-500 transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Team Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create New Team">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="label">Team Name *</label>
            <input className="input" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Design Squad" required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} value={createForm.description}
              onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} placeholder="What does this team work on?" />
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? 'Creating...' : 'Create Team'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Join Team Modal */}
      <Modal isOpen={showJoin} onClose={() => setShowJoin(false)} title="Join a Team">
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="label">Invite Code</label>
            <input className="input font-mono uppercase tracking-widest text-center text-lg" value={joinCode}
              onChange={e => setJoinCode(e.target.value)} placeholder="XXXXXXXX" maxLength={8} />
            <p className="text-xs text-gray-400 mt-1.5">Ask your team admin for the 8-character invite code</p>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving || !joinCode.trim()} className="btn-primary flex-1">
              {saving ? 'Joining...' : 'Join Team'}
            </button>
            <button type="button" onClick={() => setShowJoin(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Teams
