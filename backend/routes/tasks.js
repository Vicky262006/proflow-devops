const express = require('express');
const router = express.Router();
const { getTasks, getTask, createTask, updateTask, deleteTask, getAnalytics } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/analytics', getAnalytics);
router.route('/').get(getTasks).post(createTask);
router.route('/:id').get(getTask).put(updateTask).delete(deleteTask);

module.exports = router;
