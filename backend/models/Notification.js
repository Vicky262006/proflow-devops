const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  type: {
    type: String,
    enum: [
      'task_assigned', 'task_completed', 'task_updated', 'task_comment',
      'team_invite', 'team_joined', 'team_removed', 'deadline_reminder', 'mention',
      'leave_approved', 'leave_rejected', 'system', 'welcome', 'comment_added',
    ],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
  },
  read: {
    type: Boolean,
    default: false,
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal',
  },
  actionUrl: {
    type: String,
    default: '',
  },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
