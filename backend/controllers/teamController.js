const Team = require('../models/Team');
const User = require('../models/User');
const Notification = require('../models/Notification');

const createNotification = async (recipientId, senderId, type, message, teamId = null) => {
  if (!recipientId || recipientId.toString() === senderId.toString()) return;
  await Notification.create({ recipient: recipientId, sender: senderId, type, message, team: teamId });
};

// @route GET /api/teams
const getTeams = async (req, res) => {
  try {
    const teams = await Team.find({ 'members.user': req.user._id })
      .populate('owner', 'username avatar')
      .populate('members.user', 'username avatar email')
      .sort({ createdAt: -1 });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/teams
const createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;
    const team = await Team.create({
      name, description,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    });
    await User.findByIdAndUpdate(req.user._id, { $push: { teams: team._id } });
    await team.populate('owner', 'username avatar');
    await team.populate('members.user', 'username avatar email');
    res.status(201).json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /api/teams/:id
const getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('owner', 'username avatar email')
      .populate('members.user', 'username avatar email')
      .populate({ path: 'tasks', populate: [{ path: 'creator', select: 'username avatar' }, { path: 'assignee', select: 'username avatar' }] });
    if (!team) return res.status(404).json({ message: 'Team not found' });
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route PUT /api/teams/:id
const updateTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only team owner can update the team' });
    }
    const { name, description, avatar } = req.body;
    if (name) team.name = name;
    if (description !== undefined) team.description = description;
    if (avatar !== undefined) team.avatar = avatar;
    await team.save();
    await team.populate('owner', 'username avatar');
    await team.populate('members.user', 'username avatar email');
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/teams/:id
const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only team owner can delete the team' });
    }
    await team.deleteOne();
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route POST /api/teams/join
const joinTeam = async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const team = await Team.findOne({ inviteCode });
    if (!team) return res.status(404).json({ message: 'Invalid invite code' });

    const alreadyMember = team.members.some(m => m.user.toString() === req.user._id.toString());
    if (alreadyMember) return res.status(400).json({ message: 'You are already a member of this team' });

    team.members.push({ user: req.user._id, role: 'member' });
    await team.save();
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { teams: team._id } });

    await createNotification(team.owner, req.user._id, 'team_joined',
      `${req.user.username} joined your team "${team.name}"`, team._id);

    await team.populate('owner', 'username avatar');
    await team.populate('members.user', 'username avatar email');
    res.json(team);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route DELETE /api/teams/:id/members/:userId
const removeMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    const isOwner = team.owner.toString() === req.user._id.toString();
    const isSelf = req.params.userId === req.user._id.toString();
    if (!isOwner && !isSelf) return res.status(403).json({ message: 'Not authorized' });

    team.members = team.members.filter(m => m.user.toString() !== req.params.userId);
    await team.save();
    await User.findByIdAndUpdate(req.params.userId, { $pull: { teams: team._id } });
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getTeams, createTeam, getTeam, updateTeam, deleteTeam, joinTeam, removeMember };
