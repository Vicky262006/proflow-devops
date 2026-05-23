import { useState, useEffect } from 'react'
import { Calendar, Clock, LogIn, LogOut, CheckCircle2, AlertTriangle, ChevronLeft, ChevronRight, FilePlus, X, Check, XCircle } from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay } from 'date-fns'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

const Attendance = () => {
    const { user, isAdmin } = useAuth()
    const [attendance, setAttendance] = useState(null)
    const [currentDate, setCurrentDate] = useState(new Date())
    const [loading, setLoading] = useState(true)
    const [leaves, setLeaves] = useState([])
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
    const [leaveForm, setLeaveForm] = useState({
        date: '',
        leaveType: 'casual',
        leaveReason: ''
    })
    const [submittingLeave, setSubmittingLeave] = useState(false)
    const [pendingLeaves, setPendingLeaves] = useState([])

    const fetchPendingLeaves = async () => {
        if (!isAdmin) return
        try {
            const { data } = await api.get('/attendance/leaves/pending')
            setPendingLeaves(data)
        } catch (e) {
            console.error('Failed to fetch pending leaves', e)
        }
    }

    const handleRequestLeave = async (e) => {
        e.preventDefault()
        if (!leaveForm.date) return toast.error("Date is required")
        setSubmittingLeave(true)
        try {
            await api.post('/attendance/leave', leaveForm)
            toast.success("Leave request submitted successfully")
            setIsLeaveModalOpen(false)
            setLeaveForm({ date: '', leaveType: 'casual', leaveReason: '' })
            fetchAttendance()
            if (isAdmin) {
                fetchPendingLeaves()
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Leave request failed")
        } finally {
            setSubmittingLeave(false)
        }
    }

    const handleApproveLeave = async (id, status) => {
        try {
            await api.put(`/attendance/leave/${id}/approve`, { status })
            toast.success(`Leave request has been ${status}!`)
            fetchPendingLeaves()
            fetchAttendance()
        } catch (err) {
            toast.error(err.response?.data?.message || "Operation failed")
        }
    }

    const fetchAttendance = async () => {
        try {
            const { data } = await api.get('/attendance/my', {
                params: { 
                    month: format(currentDate, 'M'), 
                    year: format(currentDate, 'yyyy') 
                }
            })
            setAttendance(data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchAttendance()
        if (isAdmin) {
            fetchPendingLeaves()
        }
    }, [currentDate, isAdmin])

    const handleCheckIn = async () => {
        try {
            await api.post('/attendance/checkin')
            toast.success("Shift active. Good luck!")
            fetchAttendance()
        } catch (e) {
            toast.error(e.response?.data?.message || "Check-in failed")
        }
    }

    const handleCheckOut = async () => {
        try {
            await api.post('/attendance/checkout')
            toast.success("Shift terminated. Rest well!")
            fetchAttendance()
        } catch (e) {
            toast.error(e.response?.data?.message || "Check-out failed")
        }
    }

    // Calendar logic
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

    const findRecord = (day) => attendance?.records?.find(r => isSameDay(new Date(r.date), day))

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-100 tracking-tighter uppercase">Time Station</h1>
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Shift tracking and leave management</p>
                </div>
                <div className="flex gap-4">
                    {!attendance?.today?.checkIn ? (
                        <button 
                            onClick={handleCheckIn}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
                        >
                            <LogIn size={18} strokeWidth={3} /> Check In
                        </button>
                    ) : !attendance?.today?.checkOut ? (
                        <button 
                            onClick={handleCheckOut}
                            className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase flex items-center gap-2 transition-all shadow-xl shadow-amber-500/20 active:scale-95"
                        >
                            <LogOut size={18} strokeWidth={3} /> Check Out
                        </button>
                    ) : (
                        <div className="bg-slate-900 border border-slate-800 px-6 py-3 rounded-2xl text-[10px] font-black uppercase text-emerald-400 flex items-center gap-2">
                            <CheckCircle2 size={16} /> Day Shift Complete
                        </div>
                    )}
                    <button 
                        onClick={() => setIsLeaveModalOpen(true)}
                        className="bg-slate-900 border border-slate-800 text-slate-400 hover:text-white px-6 py-3 rounded-2xl text-xs font-black uppercase transition-all"
                    >
                        Request Leave
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Calendar View */}
                <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-3xl p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="font-bold text-slate-200 uppercase tracking-tighter flex items-center gap-3">
                            <Calendar size={20} className="text-indigo-400" /> Output Calendar
                        </h3>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))} className="p-2 text-slate-500 hover:text-white transition-all"><ChevronLeft size={20} /></button>
                            <span className="text-sm font-black text-slate-300 uppercase min-w-[120px] text-center">{format(currentDate, 'MMMM yyyy')}</span>
                            <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))} className="p-2 text-slate-500 hover:text-white transition-all"><ChevronRight size={20} /></button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="text-center text-[10px] font-black text-slate-600 uppercase tracking-widest py-2">
                                {d}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {days.map((day, i) => {
                            const record = findRecord(day)
                            const isSelected = isToday(day)
                            return (
                                <div 
                                    key={day.toString()}
                                    className={`aspect-square rounded-2xl border flex flex-col p-3 transition-all relative ${
                                        record?.status === 'present' ? 'bg-indigo-600/5 border-indigo-500/20' : 
                                        record?.status === 'leave' ? 'bg-amber-600/5 border-amber-500/20' : 
                                        'bg-slate-900 border-slate-800/50'
                                    } ${isSelected ? 'ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/10' : ''}`}
                                >
                                    <span className={`text-xs font-black ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`}>{format(day, 'd')}</span>
                                    {record?.status === 'present' && (
                                        <div className="mt-auto flex flex-col gap-1">
                                            <div className="h-1 w-full bg-indigo-500/30 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500 w-full" />
                                            </div>
                                            <span className="text-[8px] font-black text-indigo-400 uppercase tracking-tighter">{record.totalHours}H Logged</span>
                                        </div>
                                    )}
                                    {record?.status === 'leave' && (
                                        <div className="mt-auto">
                                            <span className="text-[8px] font-black text-amber-500 uppercase tracking-tighter">On Leave</span>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Legend & Summary */}
                <div className="space-y-8">
                    <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Execution Summary</h4>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-slate-400">Monthly Targets</span>
                                <span className="text-sm font-black text-slate-100">160h / 180h</span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 w-4/5 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-4">
                                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/50">
                                    <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Consistency</p>
                                    <p className="text-xl font-black text-indigo-400">96.8%</p>
                                </div>
                                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/50">
                                    <p className="text-[10px] font-bold text-slate-600 uppercase mb-1">Available OTP</p>
                                    <p className="text-xl font-black text-emerald-400">{user?.leaveBalance || 0}D</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
                         <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Legend</h4>
                         <div className="space-y-4">
                             <div className="flex items-center gap-3">
                                 <div className="w-3 h-3 rounded-full bg-indigo-500" />
                                 <span className="text-xs font-bold text-slate-400">Productive Shift</span>
                             </div>
                             <div className="flex items-center gap-3">
                                 <div className="w-3 h-3 rounded-full bg-amber-500" />
                                 <span className="text-xs font-bold text-slate-400">Approved Leave</span>
                             </div>
                             <div className="flex items-center gap-3">
                                 <div className="w-3 h-3 rounded-full bg-slate-800" />
                                 <span className="text-xs font-bold text-slate-400">Rest / Inactive</span>
                             </div>
                         </div>
                    </section>
                </div>
            </div>

            {isAdmin && pendingLeaves.length > 0 && (
                <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="font-bold text-slate-200 uppercase tracking-tighter flex items-center gap-3 mb-6">
                        <FilePlus className="text-amber-500" size={20} /> Pending Leave Approvals
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pendingLeaves.map((leave) => (
                            <motion.div 
                                key={leave._id}
                                layout
                                className="bg-slate-950 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="h-10 w-10 rounded-xl bg-slate-900 overflow-hidden border border-slate-800 p-0.5">
                                            {leave.user?.avatar ? (
                                                <img src={leave.user.avatar} className="h-full w-full object-cover rounded-lg" />
                                            ) : (
                                                <div className="h-full w-full bg-slate-900 flex items-center justify-center text-xs font-bold text-slate-500 uppercase">
                                                    {leave.user?.username ? leave.user.username[0] : '?'}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-200">{leave.user?.username}</h4>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase">{leave.user?.department || 'Operations'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2 mb-6">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">Leave Date:</span>
                                            <span className="font-bold text-slate-300">{format(new Date(leave.date), 'MMM d, yyyy')}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">Type:</span>
                                            <span className="font-bold text-amber-500 uppercase text-[10px] tracking-wider">{leave.leaveType}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-slate-500">Reason:</span>
                                            <span className="font-bold text-slate-400 max-w-[180px] truncate" title={leave.leaveReason}>{leave.leaveReason}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 border-t border-slate-900 pt-4">
                                    <button 
                                        onClick={() => handleApproveLeave(leave._id, 'approved')}
                                        className="flex-1 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <Check size={14} strokeWidth={3} /> Approve
                                    </button>
                                    <button 
                                        onClick={() => handleApproveLeave(leave._id, 'rejected')}
                                        className="flex-1 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                                    >
                                        <XCircle size={14} /> Reject
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            <AnimatePresence>
                {isLeaveModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsLeaveModalOpen(false)}
                            className="absolute inset-0 bg-slate-950/85 backdrop-blur-xl"
                        />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden flex flex-col"
                        >
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                                <div>
                                    <h3 className="text-xl font-black text-slate-100 uppercase tracking-tighter">Request Leave</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">Submit Time-Off Application</p>
                                </div>
                                <button onClick={() => setIsLeaveModalOpen(false)} className="p-2 text-slate-500 hover:bg-slate-800 rounded-full transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleRequestLeave} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Leave Date</label>
                                    <input 
                                        type="date"
                                        required
                                        value={leaveForm.date}
                                        onChange={e => setLeaveForm({ ...leaveForm, date: e.target.value })}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 text-slate-200 font-bold focus:outline-none focus:border-indigo-500/50 transition-all text-xs"
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Leave Type</label>
                                    <select 
                                        value={leaveForm.leaveType}
                                        onChange={e => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 text-slate-200 font-bold focus:outline-none focus:border-indigo-500/50 transition-all text-xs appearance-none"
                                    >
                                        <option value="casual">Casual Leave</option>
                                        <option value="sick">Sick Leave</option>
                                        <option value="annual">Annual Leave</option>
                                        <option value="unpaid">Unpaid Leave</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Reason for Request</label>
                                    <textarea 
                                        required
                                        placeholder="State reason for your time-off request..."
                                        value={leaveForm.leaveReason}
                                        onChange={e => setLeaveForm({ ...leaveForm, leaveReason: e.target.value })}
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-slate-400 font-medium focus:outline-none focus:border-indigo-500/50 transition-all min-h-[100px] text-xs leading-relaxed"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                    <button 
                                        type="button"
                                        onClick={() => setIsLeaveModalOpen(false)}
                                        className="px-5 py-2.5 rounded-xl text-xs font-black uppercase text-slate-500 hover:text-slate-200 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={submittingLeave}
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
                                    >
                                        {submittingLeave ? 'Submitting...' : 'Submit Request'}
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

export default Attendance
