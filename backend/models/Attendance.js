const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  checkIn: {
    type: Date,
    default: null,
  },
  checkOut: {
    type: Date,
    default: null,
  },
  totalHours: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'leave', 'holiday'],
    default: 'present',
  },
  leaveType: {
    type: String,
    enum: ['sick', 'casual', 'annual', 'emergency', null],
    default: null,
  },
  leaveReason: {
    type: String,
    default: '',
  },
  leaveStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', null],
    default: null,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  notes: {
    type: String,
    default: '',
  },
}, { timestamps: true });

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

// Calculate total hours on save
attendanceSchema.pre('save', function (next) {
  if (this.checkIn && this.checkOut) {
    this.totalHours = Math.round(((this.checkOut - this.checkIn) / (1000 * 60 * 60)) * 100) / 100;
  }
  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);
