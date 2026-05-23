const User = require('../models/User');
const Task = require('../models/Task');
const Team = require('../models/Team');
const ActivityLog = require('../models/ActivityLog');
const Attendance = require('../models/Attendance');
const { createNotification } = require('../services/notificationService');

// @route GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const { role, search, active } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (active !== undefined) filter.isActive = active === 'true';
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-refreshToken -passwordResetToken -passwordResetExpires')
      .populate('teams', 'name')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/admin/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-refreshToken -passwordResetToken -passwordResetExpires')
      .populate('teams', 'name');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/admin/users/:id
const updateUser = async (req, res) => {
  try {
    const { role, department, position, isActive, leaveBalance } = req.body;
    const updates = {};
    if (role) updates.role = role;
    if (department !== undefined) updates.department = department;
    if (position !== undefined) updates.position = position;
    if (isActive !== undefined) updates.isActive = isActive;
    if (leaveBalance !== undefined) updates.leaveBalance = leaveBalance;

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/admin/users/:id/deactivate
const deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });

    await ActivityLog.create({
      action: 'user_deactivated',
      user: req.user._id,
      description: `Admin deactivated user: ${user.username}`,
    });

    res.json({ message: `User ${user.username} deactivated`, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/admin/users/:id/stats
const getEmployeeStats = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select('username avatar department position');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const [total, completed, inProgress, overdue] = await Promise.all([
      Task.countDocuments({ assignee: userId }),
      Task.countDocuments({ assignee: userId, status: 'completed' }),
      Task.countDocuments({ assignee: userId, status: 'in-progress' }),
      Task.countDocuments({
        assignee: userId,
        deadline: { $lt: new Date() },
        status: { $ne: 'completed' },
      }),
    ]);

    // Completion rate
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Average time to complete (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCompleted = await Task.find({
      assignee: userId,
      status: 'completed',
      completedAt: { $gte: thirtyDaysAgo },
    }).select('createdAt completedAt');

    let avgCompletionHours = 0;
    if (recentCompleted.length > 0) {
      const totalHours = recentCompleted.reduce((sum, t) => {
        return sum + ((t.completedAt - t.createdAt) / (1000 * 60 * 60));
      }, 0);
      avgCompletionHours = Math.round(totalHours / recentCompleted.length);
    }

    // Weekly completion trend
    const weeklyAgg = await Task.aggregate([
      {
        $match: {
          assignee: user._id,
          completedAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Attendance summary
    const attendanceCount = await Attendance.countDocuments({
      user: userId,
      date: { $gte: thirtyDaysAgo },
      status: 'present',
    });

    res.json({
      user,
      stats: {
        total,
        completed,
        inProgress,
        overdue,
        completionRate,
        avgCompletionHours,
        weeklyTrend: weeklyAgg,
        attendanceDays: attendanceCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/admin/workload
const getWorkloadDistribution = async (req, res) => {
  try {
    const workload = await Task.aggregate([
      { $match: { assignee: { $ne: null }, status: { $ne: 'completed' } } },
      {
        $group: {
          _id: '$assignee',
          totalTasks: { $sum: 1 },
          urgent: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
          pipeline: [{ $project: { username: 1, avatar: 1, department: 1 } }],
        },
      },
      { $unwind: '$user' },
      { $sort: { totalTasks: -1 } },
    ]);

    res.json(workload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/admin/reports
const generateReport = async (req, res) => {
  try {
    const { type, startDate, endDate } = req.body;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    let report = {};

    if (type === 'tasks') {
      const tasks = await Task.find(dateFilter.hasOwnProperty('$gte') ? { createdAt: dateFilter } : {})
        .populate('creator', 'username')
        .populate('assignee', 'username')
        .populate('team', 'name')
        .lean();

      const summary = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        overdue: tasks.filter(t => t.deadline && new Date(t.deadline) < new Date() && t.status !== 'completed').length,
        byPriority: { low: 0, medium: 0, high: 0, urgent: 0 },
        byStatus: { todo: 0, 'in-progress': 0, review: 0, completed: 0 },
      };
      tasks.forEach(t => {
        summary.byPriority[t.priority]++;
        summary.byStatus[t.status]++;
      });

      report = { type: 'tasks', summary, data: tasks };
    }

    if (type === 'attendance') {
      const records = await Attendance.find(dateFilter.$gte ? { date: dateFilter } : {})
        .populate('user', 'username department')
        .lean();
      report = { type: 'attendance', total: records.length, data: records };
    }

    if (type === 'activity') {
      const logs = await ActivityLog.find(dateFilter.$gte ? { createdAt: dateFilter } : {})
        .populate('user', 'username')
        .sort({ createdAt: -1 })
        .limit(500)
        .lean();
      report = { type: 'activity', total: logs.length, data: logs };
    }

    report.generatedAt = new Date();
    report.generatedBy = req.user.username;

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/admin/users
const createUser = async (req, res) => {
  try {
    const { username, email, password, role, department, position, leaveBalance } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required' });
    }
    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }
    const user = await User.create({
      username,
      email,
      password,
      role: role || 'employee',
      department: department || '',
      position: position || '',
      leaveBalance: leaveBalance !== undefined ? leaveBalance : 20,
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers, getUserById, updateUser, deactivateUser,
  getEmployeeStats, getWorkloadDistribution, generateReport,
  createUser,
};
