const express = require('express');
const {
  getAllProjects,
  getProject,
  createProject,
  deleteProject,
  addMember,
  removeMember,
  getAllUsers,
  updateProjectCompletion,
} = require('../controllers/projectController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

router.get('/', getAllProjects);
router.post('/', requireAdmin, createProject);
router.get('/users', getAllUsers);
router.get('/:id', getProject);
router.delete('/:id', requireAdmin, deleteProject);
router.patch('/:id/completion', requireAdmin, updateProjectCompletion);
router.post('/:id/members', requireAdmin, addMember);
router.delete('/:id/members/:userId', requireAdmin, removeMember);

module.exports = router;
