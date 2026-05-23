const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Auth middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.username = user.username;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.username} (${socket.userId})`);

    // Join personal room
    socket.join(`user:${socket.userId}`);

    // Join team rooms
    socket.on('join:team', (teamId) => {
      socket.join(`team:${teamId}`);
      logger.debug(`${socket.username} joined team room: ${teamId}`);
    });

    socket.on('leave:team', (teamId) => {
      socket.leave(`team:${teamId}`);
    });

    // Broadcast online status
    io.emit('user:online', { userId: socket.userId, username: socket.username });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.username}`);
      io.emit('user:offline', { userId: socket.userId, username: socket.username });
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

module.exports = { initSocket, getIO };
