const Task = require('../models/Task');
const User = require('../models/User');
const Team = require('../models/Team');
const Attendance = require('../models/Attendance');

// @route GET /api/analytics/overview
const getAdminAnalytics = async (req, res) => {
  try {
    const [totalTasks, totalUsers, totalTeams, activeTasks] = await Promise.all([
      Task.countDocuments(),
      User.countDocuments({ isActive: true }),
      Team.countDocuments({ isActive: true }),
      Task.countDocuments({ status: { $ne: 'completed' } }),
    ]);

    const statusBreakdown = await Task.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const priorityBreakdown = await Task.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    // Tasks completed per week (last 8 weeks)
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

    const weeklyCompleted = await Task.aggregate([
      {
        $match: { completedAt: { $gte: eightWeeksAgo } },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%U', date: '$completedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Overdue tasks
    const overdueTasks = await Task.countDocuments({
      deadline: { $lt: new Date() },
      status: { $ne: 'completed' },
    });

    // Deadline miss rate
    const totalWithDeadline = await Task.countDocuments({ deadline: { $exists: true, $ne: null } });
    const deadlineMissRate = totalWithDeadline > 0
      ? Math.round((overdueTasks / totalWithDeadline) * 100)
      : 0;

    res.json({
      totalTasks,
      totalUsers,
      totalTeams,
      activeTasks,
      overdueTasks,
      deadlineMissRate,
      statusBreakdown,
      priorityBreakdown,
      weeklyCompleted,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/analytics/employee-productivity
const getEmployeeProductivity = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const productivity = await Task.aggregate([
      {
        $match: {
          assignee: { $ne: null },
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: '$assignee',
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
          avgProgress: { $avg: '$progress' },
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
      {
        $addFields: {
          completionRate: {
            $cond: [{ $gt: ['$total', 0] }, { $round: [{ $multiply: [{ $divide: ['$completed', '$total'] }, 100] }, 0] }, 0],
          },
        },
      },
      { $sort: { completionRate: -1 } },
    ]);

    res.json(productivity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/analytics/weekly-trends
const getWeeklyTrends = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [created, completed] = await Promise.all([
      Task.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Task.aggregate([
        { $match: { completedAt: { $gte: startDate } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({ created, completed });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/analytics/team-performance
const getTeamPerformance = async (req, res) => {
  try {
    const teams = await Team.find({ isActive: true }).select('name').lean();

    const performance = await Promise.all(
      teams.map(async (team) => {
        const [total, completed, overdue] = await Promise.all([
          Task.countDocuments({ team: team._id }),
          Task.countDocuments({ team: team._id, status: 'completed' }),
          Task.countDocuments({
            team: team._id,
            deadline: { $lt: new Date() },
            status: { $ne: 'completed' },
          }),
        ]);
        return {
          team: team.name,
          teamId: team._id,
          total,
          completed,
          overdue,
          completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
      })
    );

    res.json(performance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAdminAnalytics, getEmployeeProductivity, getWeeklyTrends, getTeamPerformance };
