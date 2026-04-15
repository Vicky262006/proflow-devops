const Task = require('../models/Task');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Helper to create notification
const createNotification = async (recipientId, senderId, type, message, taskId = null, teamId = null) => {
  if (recipientId.toString() === senderId.toString()) return;
  await Notification.create({ recipient: recipientId, sender: senderId, type, message, task: taskId, team: teamId });
};

// @route GET /api/tasks
const getTasks = async (req, res) => {
  try {
    const { status, priority, assignee, team, search } = req.query;
    const filter = { $or: [{ creator: req.user._id }, { assignee: req.user._id }] };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;
    if (team) filter.team = team;
    if (search) filter.title = { $regex: search, $options: 'i' };

    const tasks = await Task.find(filter)
      .populate('creator', 'username avatar')
      .populate('assignee', 'username avatar')
      .populate('team', 'name')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/tasks/analytics
const getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const userFilter = { $or: [{ creator: userId }, { assignee: userId }] };

    const [total, completed, pending, inProgress, review] = await Promise.all([
      Task.countDocuments(userFilter),
      Task.countDocuments({ ...userFilter, status: 'completed' }),
      Task.countDocuments({ ...userFilter, status: 'todo' }),
      Task.countDocuments({ ...userFilter, status: 'in-progress' }),
      Task.countDocuments({ ...userFilter, status: 'review' }),
    ]);

    // Priority distribution
    const priorityAgg = await Task.aggregate([
      { $match: { $or: [{ creator: userId }, { assignee: userId }] } },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    // Tasks over last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const dailyAgg = await Task.aggregate([
      {
        $match: {
          $or: [{ creator: userId }, { assignee: userId }],
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

    res.json({ total, completed, pending, inProgress, review, priorityAgg, dailyAgg });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { title, description, priority, deadline, status, assignee, team, tags } = req.body;
    const task = await Task.create({
      title, description, priority, deadline, status, team, tags,
      creator: req.user._id,
      assignee: assignee || null,
    });

    await task.populate('creator', 'username avatar');
    await task.populate('assignee', 'username avatar');

    // Notify assignee
    if (assignee && assignee !== req.user._id.toString()) {
      await createNotification(assignee, req.user._id, 'task_assigned',
        `${req.user.username} assigned you a task: "${title}"`, task._id, team);
    }

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

    Object.assign(task, req.body);
    await task.save();
    await task.populate('creator', 'username avatar');
    await task.populate('assignee', 'username avatar');

    // Notify on status change to completed
    if (prevStatus !== 'completed' && task.status === 'completed' && task.creator.toString() !== req.user._id.toString()) {
      await createNotification(task.creator._id, req.user._id, 'task_completed',
        `Task "${task.title}" has been completed`, task._id);
    }

    // Notify new assignee
    if (req.body.assignee && req.body.assignee !== (prevAssignee ? prevAssignee.toString() : null)) {
      await createNotification(req.body.assignee, req.user._id, 'task_assigned',
        `${req.user.username} assigned you a task: "${task.title}"`, task._id);
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }
    await task.deleteOne();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask, getAnalytics };
