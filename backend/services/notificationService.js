const Notification = require('../models/Notification');
const { getIO } = require('../config/socket');
const logger = require('../utils/logger');

/**
 * Create a notification and emit it via Socket.IO
 */
const createNotification = async ({
  recipientId,
  senderId,
  type,
  message,
  taskId = null,
  teamId = null,
  priority = 'normal',
  actionUrl = '',
}) => {
  // Don't notify yourself
  if (recipientId && senderId && recipientId.toString() === senderId.toString()) return null;

  try {
    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      message,
      task: taskId,
      team: teamId,
      priority,
      actionUrl,
    });

    // Populate sender info for real-time display
    await notification.populate('sender', 'username avatar');

    // Emit via Socket.IO
    try {
      const io = getIO();
      io.to(`user:${recipientId.toString()}`).emit('notification:new', notification);
    } catch (socketError) {
      // Socket.IO may not be initialized in tests
      logger.debug('Socket emit skipped:', socketError.message);
    }

    return notification;
  } catch (error) {
    logger.error('Failed to create notification:', error.message);
    return null;
  }
};

/**
 * Create notifications for multiple recipients
 */
const notifyMultiple = async (recipientIds, data) => {
  const promises = recipientIds.map((id) =>
    createNotification({ ...data, recipientId: id })
  );
  return Promise.allSettled(promises);
};

module.exports = { createNotification, notifyMultiple };
