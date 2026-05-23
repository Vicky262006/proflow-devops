const router = require('express').Router();
const { getTasks, getTask, createTask, updateTask, updateSubtask, getTaskActivity, deleteTask, reorderTasks, getAnalytics } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const { taskRules, validate } = require('../middleware/validate');

router.use(protect);

router.get('/', getTasks);
router.get('/analytics', getAnalytics);
router.post('/', taskRules, validate, createTask);
router.put('/reorder', reorderTasks);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);

// Subtask routes
router.put('/:id/subtask/:subtaskId', updateSubtask);

// Activity log for a task
router.get('/:id/activity', getTaskActivity);

module.exports = router;
