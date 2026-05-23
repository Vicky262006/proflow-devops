const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Comment text is required'],
    maxlength: [1000, 'Comment cannot exceed 1000 characters'],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true,
  },
  attachments: [{
    url: String,
    name: String,
    type: String,
  }],
  reactions: {
    type: Map,
    of: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    default: {},
  },
  isEdited: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
