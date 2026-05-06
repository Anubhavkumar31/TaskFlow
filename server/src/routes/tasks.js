const express = require('express');
const {
  getProjectTasks,
  createTask,
  updateTask,
  deleteTask,
  getDashboardStats,
} = require('../controllers/taskController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

router.get('/dashboard', getDashboardStats);
router.get('/project/:projectId', getProjectTasks);
router.post('/project/:projectId', requireAdmin, createTask);
router.patch('/:id', updateTask);
router.delete('/:id', requireAdmin, deleteTask);

module.exports = router;
