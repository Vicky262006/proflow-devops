const Attendance = require('../models/Attendance');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { createNotification } = require('../services/notificationService');

// @route POST /api/attendance/checkin
const checkIn = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({ user: req.user._id, date: today });
    if (attendance && attendance.checkIn) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    if (!attendance) {
      attendance = new Attendance({ user: req.user._id, date: today });
    }
    attendance.checkIn = new Date();
    attendance.status = 'present';
    await attendance.save();

    await ActivityLog.create({
      action: 'attendance_checkin',
      user: req.user._id,
      description: `${req.user.username} checked in`,
    });

    res.json({ message: 'Checked in successfully', attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/attendance/checkout
const checkOut = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({ user: req.user._id, date: today });
    if (!attendance || !attendance.checkIn) {
      return res.status(400).json({ message: 'You have not checked in today' });
    }
    if (attendance.checkOut) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    attendance.checkOut = new Date();
    await attendance.save();

    await ActivityLog.create({
      action: 'attendance_checkout',
      user: req.user._id,
      description: `${req.user.username} checked out (${attendance.totalHours}h)`,
    });

    res.json({ message: 'Checked out successfully', attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/attendance/my
const getMyAttendance = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = { user: req.user._id };

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59);
      filter.date = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(filter).sort({ date: -1 });

    // Today's status
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRecord = await Attendance.findOne({ user: req.user._id, date: today });

    res.json({ records, today: todayRecord });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/attendance/leave
const requestLeave = async (req, res) => {
  try {
    const { date, leaveType, leaveReason } = req.body;
    const leaveDate = new Date(date);
    leaveDate.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({ user: req.user._id, date: leaveDate });
    if (attendance && attendance.leaveStatus === 'pending') {
      return res.status(400).json({ message: 'Leave already requested for this date' });
    }

    if (!attendance) {
      attendance = new Attendance({ user: req.user._id, date: leaveDate });
    }
    attendance.status = 'leave';
    attendance.leaveType = leaveType;
    attendance.leaveReason = leaveReason;
    attendance.leaveStatus = 'pending';
    await attendance.save();

    // Notify admins
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    for (const admin of admins) {
      await createNotification({
        recipientId: admin._id,
        senderId: req.user._id,
        type: 'system',
        message: `${req.user.username} requested ${leaveType} leave for ${leaveDate.toLocaleDateString()}`,
      });
    }

    res.json({ message: 'Leave request submitted', attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/attendance/leave/:id/approve (Admin)
const approveLeave = async (req, res) => {
  try {
    const { status } = req.body; // 'approved' or 'rejected'
    const attendance = await Attendance.findById(req.params.id).populate('user', 'username leaveBalance');
    if (!attendance) return res.status(404).json({ message: 'Record not found' });

    attendance.leaveStatus = status;
    attendance.approvedBy = req.user._id;
    await attendance.save();

    // Deduct leave balance if approved
    if (status === 'approved') {
      await User.findByIdAndUpdate(attendance.user._id, { $inc: { leaveBalance: -1 } });
    }

    await createNotification({
      recipientId: attendance.user._id,
      senderId: req.user._id,
      type: status === 'approved' ? 'leave_approved' : 'leave_rejected',
      message: `Your leave request has been ${status}`,
    });

    res.json({ message: `Leave ${status}`, attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/attendance/all (Admin)
const getAllAttendance = async (req, res) => {
  try {
    const { date, userId } = req.query;
    const filter = {};
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      filter.date = { $gte: d, $lt: nextDay };
    }
    if (userId) filter.user = userId;

    const records = await Attendance.find(filter)
      .populate('user', 'username avatar department')
      .populate('approvedBy', 'username')
      .sort({ date: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/attendance/leaves/pending (Admin)
const getPendingLeaves = async (req, res) => {
  try {
    const records = await Attendance.find({ leaveStatus: 'pending' })
      .populate('user', 'username avatar department leaveBalance')
      .sort({ date: 1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { checkIn, checkOut, getMyAttendance, requestLeave, approveLeave, getAllAttendance, getPendingLeaves };
