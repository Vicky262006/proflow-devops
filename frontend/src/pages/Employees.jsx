import { useEffect, useState } from 'react'
import { Users, Mail, Map, Phone, MoreVertical, Edit, Shield, ShieldOff, Search, UserPlus, X } from 'lucide-react'
import api from '../api/axios'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const Employees = () => {
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
    const [inviteForm, setInviteForm] = useState({
        username: '',
        email: '',
        password: '',
        role: 'employee',
        department: '',
        position: '',
        leaveBalance: 20
    })
    const [submittingInvite, setSubmittingInvite] = useState(false)

    const handleInviteSubmit = async (e) => {
        e.preventDefault()
        if (!inviteForm.username.trim() || !inviteForm.email.trim() || !inviteForm.password.trim()) {
            return toast.error("Required fields cannot be empty")
        }
        setSubmittingInvite(true)
        try {
            await api.post('/admin/users', inviteForm)
            toast.success("Participant onboarded successfully!")
            setIsInviteModalOpen(false)
            setInviteForm({
                username: '',
                email: '',
                password: '',
                role: 'employee',
                department: '',
                position: '',
                leaveBalance: 20
            })
            const { data } = await api.get('/admin/users', { params: { search } })
            setEmployees(data)
        } catch (err) {
            toast.error(err.response?.data?.message || "Invitation failed")
        } finally {
            setSubmittingInvite(false)
        }
    }

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const { data } = await api.get('/admin/users', { params: { search } })
                setEmployees(data)
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchEmployees()
    }, [search])

    const toggleStatus = async (id, currentStatus) => {
        try {
            await api.put(`/admin/users/${id}`, { isActive: !currentStatus })
            setEmployees(prev => prev.map(emp => emp._id === id ? { ...emp, isActive: !currentStatus } : emp))
            toast.success(`User ${!currentStatus ? 'activated' : 'deactivated'}`)
        } catch (e) {
            toast.error("Status update failed")
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-100 tracking-tighter uppercase">Personnel Registry</h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Manage network participants</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                        <input 
                            type="text" 
                            placeholder="Search by ID, name, email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-slate-900 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:border-indigo-500/50 w-64 transition-all"
                        />
                    </div>
                    <button 
                        onClick={() => setIsInviteModalOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                    >
                        <UserPlus size={18} strokeWidth={3} /> Invite Participant
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {employees.map((emp, i) => (
                    <motion.div 
                        key={emp._id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] hover:border-indigo-500/30 transition-all group overflow-hidden relative"
                    >
                        {/* Status Glow */}
                        <div className={`absolute top-0 right-0 h-24 w-24 -mr-12 -mt-12 rounded-full blur-3xl opacity-20 transition-all group-hover:opacity-40 ${emp.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />

                        <div className="flex items-center justify-between mb-6">
                            <div className="h-16 w-16 rounded-2xl bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
                                {emp.avatar ? (
                                    <img src={emp.avatar} alt={emp.username} className="h-full w-full object-cover rounded-xl" />
                                ) : (
                                    <div className="h-full w-full bg-slate-900 flex items-center justify-center text-xl font-bold text-slate-700 uppercase">
                                        {emp.username[0]}
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white transition-all">
                                    <Edit size={16} />
                                </button>
                                <button 
                                    onClick={() => toggleStatus(emp._id, emp.isActive)}
                                    className={`p-2 rounded-lg transition-all ${emp.isActive ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white' : 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white'}`}
                                >
                                    {emp.isActive ? <Shield size={16} /> : <ShieldOff size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                                {emp.username}
                                {emp.role === 'admin' && <span className="bg-indigo-500/10 text-indigo-400 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-indigo-500/20">Admin</span>}
                            </h3>
                            <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter mt-1">{emp.position || 'Specialist'} • {emp.department || 'Operations'}</p>
                        </div>

                        <div className="space-y-3 pt-6 border-t border-slate-800">
                            <div className="flex items-center gap-3 text-slate-400">
                                <Mail size={14} className="text-slate-600" />
                                <span className="text-xs font-semibold truncate">{emp.email}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-400">
                                <Users size={14} className="text-slate-600" />
                                <span className="text-xs font-semibold">{emp.teams?.length || 0} Teams Assigned</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {isInviteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsInviteModalOpen(false)}
                            className="absolute inset-0 bg-slate-950/85 backdrop-blur-xl"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                                <div>
                                    <h3 className="text-xl font-black text-slate-100 uppercase tracking-tighter">Onboard Participant</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Register New User Credentials</p>
                                </div>
                                <button onClick={() => setIsInviteModalOpen(false)} className="p-2 text-slate-500 hover:bg-slate-800 rounded-full transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleInviteSubmit} className="space-y-4 overflow-y-auto pr-2 pb-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Username</label>
                                        <input 
                                            type="text"
                                            required
                                            placeholder="johndoe"
                                            value={inviteForm.username}
                                            onChange={e => setInviteForm({ ...inviteForm, username: e.target.value })}
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-slate-200 font-bold focus:outline-none focus:border-indigo-500/50 transition-all text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Email Address</label>
                                        <input 
                                            type="email"
                                            required
                                            placeholder="john@proflow.com"
                                            value={inviteForm.email}
                                            onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-slate-200 font-bold focus:outline-none focus:border-indigo-500/50 transition-all text-xs"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Initial Password</label>
                                    <input 
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        value={inviteForm.password}
                                        onChange={e => setInviteForm({ ...inviteForm, password: e.target.value })}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-slate-200 font-bold focus:outline-none focus:border-indigo-500/50 transition-all text-xs"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">System Role</label>
                                        <select 
                                            value={inviteForm.role}
                                            onChange={e => setInviteForm({ ...inviteForm, role: e.target.value })}
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-slate-200 font-bold focus:outline-none focus:border-indigo-500/50 transition-all text-xs appearance-none"
                                        >
                                            <option value="employee">Employee</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Leave Balance (Days)</label>
                                        <input 
                                            type="number"
                                            value={inviteForm.leaveBalance}
                                            onChange={e => setInviteForm({ ...inviteForm, leaveBalance: parseInt(e.target.value) || 0 })}
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-slate-200 font-bold focus:outline-none focus:border-indigo-500/50 transition-all text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Department</label>
                                        <input 
                                            type="text"
                                            placeholder="Engineering"
                                            value={inviteForm.department}
                                            onChange={e => setInviteForm({ ...inviteForm, department: e.target.value })}
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-slate-200 font-bold focus:outline-none focus:border-indigo-500/50 transition-all text-xs"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Position</label>
                                        <input 
                                            type="text"
                                            placeholder="Senior Developer"
                                            value={inviteForm.position}
                                            onChange={e => setInviteForm({ ...inviteForm, position: e.target.value })}
                                            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3 text-slate-200 font-bold focus:outline-none focus:border-indigo-500/50 transition-all text-xs"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-6 border-t border-slate-800">
                                    <button 
                                        type="button"
                                        onClick={() => setIsInviteModalOpen(false)}
                                        className="px-5 py-2.5 rounded-xl text-xs font-black uppercase text-slate-500 hover:text-slate-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={submittingInvite}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
                                    >
                                        {submittingInvite ? 'Onboarding...' : 'Onboard User'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default Employees
