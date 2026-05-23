const { validationResult, body, param, query } = require('express-validator');

/**
 * Run validation and return errors if any
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// Common validation rules
const registerRules = [
  body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['admin', 'employee']).withMessage('Invalid role'),
];

const loginRules = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const taskRules = [
  body('title').trim().isLength({ min: 1, max: 100 }).withMessage('Title is required (max 100 chars)'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']),
  body('status').optional().isIn(['todo', 'in-progress', 'review', 'completed']),
];

const objectIdRule = (field = 'id') => [
  param(field).isMongoId().withMessage(`Invalid ${field}`),
];

module.exports = { validate, registerRules, loginRules, taskRules, objectIdRule, body, param, query };
