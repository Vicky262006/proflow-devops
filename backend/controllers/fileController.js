const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const logger = require('../utils/logger');

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/zip', 'application/x-zip-compressed',
    'text/plain', 'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// @route POST /api/files/upload
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileData = {
      url: `/uploads/${req.file.filename}`,
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
    };

    logger.info(`File uploaded: ${req.file.originalname} by ${req.user.username}`);

    res.status(201).json(fileData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/files/task/:taskId
const uploadTaskAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const attachment = {
      url: `/uploads/${req.file.filename}`,
      name: req.file.originalname,
      type: req.file.mimetype,
      size: req.file.size,
      uploadedBy: req.user._id,
    };

    task.attachments.push(attachment);
    await task.save();

    await ActivityLog.create({
      action: 'task_attachment_added',
      user: req.user._id,
      task: task._id,
      description: `Added attachment "${req.file.originalname}" to "${task.title}"`,
    });

    // Emit real-time
    try {
      const { getIO } = require('../config/socket');
      getIO().emit('task:updated', task);
    } catch (e) { /* */ }

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/files/:filename
const deleteFile = async (req, res) => {
  try {
    const filePath = path.join(__dirname, '..', 'uploads', req.params.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: 'File deleted' });
    } else {
      res.status(404).json({ message: 'File not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { upload, uploadFile, uploadTaskAttachment, deleteFile };
