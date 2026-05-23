const ActivityLog = require('../models/ActivityLog');

/**
 * Creates an audit log entry for sensitive actions
 */
const auditLog = (action) => {
  return async (req, res, next) => {
    // Store original json method to intercept response
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      // Only log successful operations
      if (res.statusCode < 400) {
        ActivityLog.create({
          action,
          user: req.user?._id,
          task: req.params?.id || data?.data?._id,
          team: req.body?.team || req.params?.teamId,
          description: `${req.user?.username || 'System'} performed: ${action}`,
          changes: req.body,
          ipAddress: req.ip || req.connection?.remoteAddress,
        }).catch((err) => {
          console.error('Audit log error:', err.message);
        });
      }

      return originalJson(data);
    };

    next();
  };
};

module.exports = { auditLog };
