const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  done: { type: Boolean, default: false },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { _id: true, timestamps: false });

const attachmentSchema = new mongoose.Schema({
  url: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, default: 'file' },
  size: { type: Number, default: 0 },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: true });

const statusTimelineSchema = new mongoose.Schema({
  status: { type: String, required: true },
  changedAt: { type: Date, default: Date.now },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { _id: false });

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    default: '',
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['todo', 'in-progress', 'review', 'completed'],
    default: 'todo',
  },
  deadline: {
    type: Date,
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    default: null,
  },
  comments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
  }],
  tags: [{ type: String, trim: true }],
  labels: [{ type: String, trim: true }],
  subtasks: [subtaskSchema],
  attachments: [attachmentSchema],
  statusTimeline: [statusTimelineSchema],
  watchers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  isRecurring: {
    type: Boolean,
    default: false,
  },
  recurringPattern: {
    type: String,
    enum: ['daily', 'weekly', 'biweekly', 'monthly', null],
    default: null,
  },
  estimatedHours: {
    type: Number,
    default: 0,
  },
  actualHours: {
    type: Number,
    default: 0,
  },
  completedAt: {
    type: Date,
    default: null,
  },
  order: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Auto-set completedAt and progress when status changes
taskSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    if (this.status === 'completed' && !this.completedAt) {
      this.completedAt = new Date();
      this.progress = 100;
    }
    if (this.status !== 'completed') {
      this.completedAt = null;
    }
  }

  // Auto-calculate progress from subtasks if subtasks exist
  if (this.isModified('subtasks') && this.subtasks.length > 0) {
    const done = this.subtasks.filter(s => s.done).length;
    this.progress = Math.round((done / this.subtasks.length) * 100);
  }

  next();
});

// Index for performance
taskSchema.index({ creator: 1, status: 1 });
taskSchema.index({ assignee: 1, status: 1 });
taskSchema.index({ team: 1, status: 1 });
taskSchema.index({ deadline: 1 });

module.exports = mongoose.model('Task', taskSchema);
