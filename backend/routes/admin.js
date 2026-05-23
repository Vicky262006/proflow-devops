const router = require('express').Router();
const { getAllUsers, getUserById, updateUser, deactivateUser, getEmployeeStats, getWorkloadDistribution, generateReport, createUser } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);
router.use(adminOnly);

router.get('/users', getAllUsers);
router.post('/users', createUser);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.put('/users/:id/deactivate', deactivateUser);
router.get('/users/:id/stats', getEmployeeStats);
router.get('/workload', getWorkloadDistribution);
router.post('/reports', generateReport);

module.exports = router;
