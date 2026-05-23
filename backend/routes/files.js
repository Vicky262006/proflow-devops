const router = require('express').Router();
const { upload, uploadFile, uploadTaskAttachment, deleteFile } = require('../controllers/fileController');
const { protect } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');

router.use(protect);

router.post('/upload', uploadLimiter, upload.single('file'), uploadFile);
router.post('/task/:taskId', uploadLimiter, upload.single('file'), uploadTaskAttachment);
router.delete('/:filename', deleteFile);

module.exports = router;
