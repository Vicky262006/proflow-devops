const router = require('express').Router();
const { getAdminAnalytics, getEmployeeProductivity, getWeeklyTrends, getTeamPerformance } = require('../controllers/analyticsController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.get('/overview', adminOnly, getAdminAnalytics);
router.get('/employee-productivity', adminOnly, getEmployeeProductivity);
router.get('/weekly-trends', getWeeklyTrends);
router.get('/team-performance', adminOnly, getTeamPerformance);

module.exports = router;
