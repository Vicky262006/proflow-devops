const router = require('express').Router();
const { checkIn, checkOut, getMyAttendance, requestLeave, approveLeave, getAllAttendance, getPendingLeaves } = require('../controllers/attendanceController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

// Employee routes
router.post('/checkin', checkIn);
router.post('/checkout', checkOut);
router.get('/my', getMyAttendance);
router.post('/leave', requestLeave);

// Admin routes
router.get('/all', adminOnly, getAllAttendance);
router.get('/leaves/pending', adminOnly, getPendingLeaves);
router.put('/leave/:id/approve', adminOnly, approveLeave);

module.exports = router;
