const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const { createNotification } = require('../services/notificationService');
const { sendTaskAssignment } = require('../services/emailService');
const User = require('../models/User');
const logger = require('../utils/logger');

// @route GET /api/tasks
const getTasks = async (req, res) => {
  try {
    const { status, priority, assignee, team, search, label } = req.query;
    let filter = {};

    // Role-based filtering
    if (req.user.role === 'employee') {
      filter = { $or: [{ assignee: req.user._id }, { creator: req.user._id }] };
    }
    // Admin sees all tasks (can also filter by assignee)
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;
    if (team) filter.team = team;
    if (label) filter.labels = { $in: [label] };
    if (search) filter.title = { $regex: search, $options: 'i' };

    const tasks = await Task.find(filter)
      .populate('creator', 'username avatar')
      .populate('assignee', 'username avatar')
      .populate('team', 'name')
      .populate('watchers', 'username avatar')
      .sort({ order: 1, createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/tasks/analytics
const getAnalytics = async (req, res) => {
  try {
    let userFilter;

    if (req.user.role === 'admin') {
      userFilter = {};
    } else {
      const userId = req.user._id;
      userFilter = { $or: [{ creator: userId }, { assignee: userId }] };
    }

    const [total, completed, pending, inProgress, review] = await Promise.all([
      Task.countDocuments(userFilter),
      Task.countDocuments({ ...userFilter, status: 'completed' }),
      Task.countDocuments({ ...userFilter, status: 'todo' }),
      Task.countDocuments({ ...userFilter, status: 'in-progress' }),
      Task.countDocuments({ ...userFilter, status: 'review' }),
    ]);

    // Overdue tasks
    const overdue = await Task.countDocuments({
      ...userFilter,
      deadline: { $lt: new Date() },
      status: { $ne: 'completed' },
    });

    // Priority distribution
    const priorityAgg = await Task.aggregate([
      { $match: userFilter.$or ? { $or: userFilter.$or } : {} },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    // Tasks over last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const dailyAgg = await Task.aggregate([
      {
        $match: {
          ...(userFilter.$or ? { $or: userFilter.$or } : {}),
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ total, completed, pending, inProgress, review, overdue, priorityAgg, dailyAgg });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { title, description, priority, deadline, status, assignee, team, tags, labels, subtasks, isRecurring, recurringPattern, estimatedHours } = req.body;

    // Sanitize ObjectId fields — empty strings from the frontend must become null
    const sanitizedTeam = team && team.trim() !== '' ? team : null;
    const sanitizedAssignee = assignee && assignee.trim() !== '' ? assignee : null;

    const task = await Task.create({
      title, description, priority, deadline, status, tags, labels,
      team: sanitizedTeam,
      subtasks: subtasks || [],
      isRecurring: isRecurring || false,
      recurringPattern: recurringPattern || null,
      estimatedHours: estimatedHours || 0,
      creator: req.user._id,
      assignee: sanitizedAssignee,
      statusTimeline: [{ status: status || 'todo', changedBy: req.user._id }],
      watchers: [req.user._id],
    });

    await task.populate('creator', 'username avatar');
    await task.populate('assignee', 'username avatar email');

    // Notify assignee
    if (sanitizedAssignee && sanitizedAssignee !== req.user._id.toString()) {
      await createNotification({
        recipientId: sanitizedAssignee,
        senderId: req.user._id,
        type: 'task_assigned',
        message: `${req.user.username} assigned you: "${title}"`,
        taskId: task._id,
        teamId: sanitizedTeam,
      });

      // Email notification
      if (task.assignee?.email) {
        sendTaskAssignment(task.assignee.email, title, req.user.username);
      }
    }

    // Activity log
    await ActivityLog.create({
      action: 'task_created',
      user: req.user._id,
      task: task._id,
      team: sanitizedTeam,
      description: `Created task: "${title}"`,
    });

    // Emit real-time event
    try {
      const { getIO } = require('../config/socket');
      getIO().emit('task:created', task);
    } catch (e) { /* socket not init */ }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/tasks/:id
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('creator', 'username avatar email')
      .populate('assignee', 'username avatar email')
      .populate('team', 'name')
      .populate('watchers', 'username avatar')
      .populate('subtasks.assignee', 'username avatar')
      .populate({ path: 'comments', populate: { path: 'author', select: 'username avatar' } });

    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const prevStatus = task.status;
    const prevAssignee = task.assignee;

    // Track status changes
    if (req.body.status && req.body.status !== prevStatus) {
      task.statusTimeline.push({
        status: req.body.status,
        changedBy: req.user._id,
        changedAt: new Date(),
      });
    }

    // Sanitize ObjectId fields
    if (req.body.team !== undefined && (!req.body.team || req.body.team.trim() === '')) req.body.team = null;
    if (req.body.assignee !== undefined && (!req.body.assignee || req.body.assignee.trim() === '')) req.body.assignee = null;

    Object.assign(task, req.body);
    await task.save();
    await task.populate('creator', 'username avatar');
    await task.populate('assignee', 'username avatar');

    // Notify on status change to completed
    if (prevStatus !== 'completed' && task.status === 'completed' && task.creator.toString() !== req.user._id.toString()) {
      await createNotification({
        recipientId: task.creator._id || task.creator,
        senderId: req.user._id,
        type: 'task_completed',
        message: `Task "${task.title}" has been completed ✅`,
        taskId: task._id,
      });
    }

    // Notify new assignee
    if (req.body.assignee && req.body.assignee !== (prevAssignee ? prevAssignee.toString() : null)) {
      await createNotification({
        recipientId: req.body.assignee,
        senderId: req.user._id,
        type: 'task_assigned',
        message: `${req.user.username} assigned you: "${task.title}"`,
        taskId: task._id,
      });
    }

    // Activity log
    await ActivityLog.create({
      action: 'task_updated',
      user: req.user._id,
      task: task._id,
      description: `Updated task: "${task.title}"`,
      changes: req.body,
    });

    // Emit real-time
    try {
      const { getIO } = require('../config/socket');
      getIO().emit('task:updated', task);
    } catch (e) { /* socket not init */ }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/tasks/:id/subtask/:subtaskId
const updateSubtask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ message: 'Subtask not found' });

    if (req.body.title !== undefined) subtask.title = req.body.title;
    if (req.body.done !== undefined) subtask.done = req.body.done;

    await task.save();
    await task.populate('creator', 'username avatar');
    await task.populate('assignee', 'username avatar');

    try {
      const { getIO } = require('../config/socket');
      getIO().emit('task:updated', task);
    } catch (e) { /* */ }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/tasks/:id/activity
const getTaskActivity = async (req, res) => {
  try {
    const logs = await ActivityLog.find({ task: req.params.id })
      .populate('user', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Only admin or creator can delete
    if (req.user.role !== 'admin' && task.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    const taskTitle = task.title;
    await task.deleteOne();

    await ActivityLog.create({
      action: 'task_deleted',
      user: req.user._id,
      description: `Deleted task: "${taskTitle}"`,
    });

    try {
      const { getIO } = require('../config/socket');
      getIO().emit('task:deleted', { _id: req.params.id });
    } catch (e) { /* */ }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/tasks/reorder
const reorderTasks = async (req, res) => {
  try {
    const { tasks } = req.body; // [{ id, status, order }]
    const ops = tasks.map((t) => ({
      updateOne: {
        filter: { _id: t.id },
        update: { status: t.status, order: t.order },
      },
    }));
    await Task.bulkWrite(ops);
    res.json({ message: 'Tasks reordered' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, updateSubtask, getTaskActivity, deleteTask, reorderTasks, getAnalytics };
