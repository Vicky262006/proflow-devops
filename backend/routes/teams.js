const express = require('express');
const router = express.Router();
const { 
  getTeams, 
  createTeam, 
  getTeam, 
  updateTeam, 
  deleteTeam, 
  joinTeam, 
  removeMember,
  getTeamMessages,
  sendTeamMessage
} = require('../controllers/teamController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getTeams).post(createTeam);
router.post('/join', joinTeam);
router.route('/:id').get(getTeam).put(updateTeam).delete(deleteTeam);
router.delete('/:id/members/:userId', removeMember);

router.route('/:id/messages')
  .get(getTeamMessages)
  .post(sendTeamMessage);

module.exports = router;
