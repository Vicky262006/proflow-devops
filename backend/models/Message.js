const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  text: {
    type: String,
    required: [true, 'Message text is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters'],
  },
}, { timestamps: true });

// Index for fast chronological fetches under a specific team
messageSchema.index({ team: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
