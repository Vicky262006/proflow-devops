const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'task_created', 'task_updated', 'task_deleted', 'task_status_changed',
      'task_assigned', 'task_comment_added', 'task_attachment_added',
      'subtask_added', 'subtask_completed', 'subtask_deleted',
      'user_login', 'user_registered', 'user_deactivated',
      'team_created', 'team_member_added', 'team_member_removed',
      'file_uploaded', 'file_deleted',
      'attendance_checkin', 'attendance_checkout', 'leave_requested', 'leave_approved',
    ],
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  description: {
    type: String,
    default: '',
  },
  changes: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
  ipAddress: {
    type: String,
    default: '',
  },
}, { timestamps: true });

activityLogSchema.index({ task: 1, createdAt: -1 });
activityLogSchema.index({ user: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
