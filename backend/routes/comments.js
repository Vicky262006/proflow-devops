const express = require('express');
const router = express.Router();
const { getComments, addComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/:taskId').get(getComments).post(addComment);
router.delete('/:id', deleteComment);

module.exports = router;
