const mongoose = require('mongoose');
const crypto = require('crypto');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    maxlength: [50, 'Team name cannot exceed 50 characters'],
  },
  description: {
    type: String,
    default: '',
    maxlength: [300, 'Description cannot exceed 300 characters'],
  },
  avatar: {
    type: String,
    default: '',
  },
  inviteCode: {
    type: String,
    unique: true,
    default: () => crypto.randomBytes(4).toString('hex').toUpperCase(),
  },
  lead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    role: {
      type: String,
      enum: ['lead', 'member'],
      default: 'member',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  sprints: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sprint',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

teamSchema.index({ 'members.user': 1 });

module.exports = mongoose.model('Team', teamSchema);
