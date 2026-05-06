const { z } = require('zod');
const prisma = require('../lib/prisma');

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'PENDING_CONFIRMATION', 'DONE']).optional(),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

const isProjectMemberOrAdmin = async (projectId, userId, userRole) => {
  if (userRole === 'ADMIN') {
    const project = await prisma.project.findFirst({ where: { id: projectId, adminId: userId } });
    return !!project;
  }
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  });
  return !!member;
};

const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const hasAccess = await isProjectMemberOrAdmin(projectId, req.user.id, req.user.role);
    if (!hasAccess) return res.status(403).json({ message: 'Access denied.' });

    const tasks = await prisma.task.findMany({
      where: { projectId },
      include: { assignee: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    if (project.adminId !== req.user.id) {
      return res.status(403).json({ message: 'Only the project admin can create tasks.' });
    }

    const data = createTaskSchema.parse(req.body);

    const task = await prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        assigneeId: data.assigneeId || null,
        projectId,
      },
      include: { assignee: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json(task);
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    });

    if (!task) return res.status(404).json({ message: 'Task not found.' });

    const isAdmin = task.project.adminId === req.user.id;
    const isAssignee = task.assigneeId === req.user.id;

    // Only the project admin or the assigned member can update a task
    if (!isAdmin && !isAssignee) {
      return res.status(403).json({ message: 'Access denied. You can only update tasks assigned to you.' });
    }

    // Only the admin can change assigneeId (assign, reassign, or unassign)
    if (!isAdmin && req.body.assigneeId !== undefined) {
      return res.status(403).json({ message: 'Only the project admin can assign or reassign tasks.' });
    }

    // Non-admins can only update status — nothing else
    if (!isAdmin) {
      const allowedKeys = ['status'];
      const sentKeys = Object.keys(req.body);
      const hasDisallowedKeys = sentKeys.some(k => !allowedKeys.includes(k));
      if (hasDisallowedKeys) {
        return res.status(403).json({ message: 'Members can only update the task status.' });
      }
      // Members can only move to IN_PROGRESS or PENDING_CONFIRMATION — not directly to DONE
      const memberAllowedStatuses = ['TODO', 'IN_PROGRESS', 'PENDING_CONFIRMATION'];
      if (req.body.status && !memberAllowedStatuses.includes(req.body.status)) {
        return res.status(403).json({ message: 'Only the project admin can mark a task as Done.' });
      }
    }

    // Only admin can confirm (set DONE) or reject (set back from PENDING_CONFIRMATION)
    if (!isAdmin && task.status === 'PENDING_CONFIRMATION' && req.body.status === 'DONE') {
      return res.status(403).json({ message: 'Only the project admin can confirm task completion.' });
    }

    const data = updateTaskSchema.parse(req.body);

    const updated = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : data.dueDate === null ? null : undefined,
        completedAt: data.status === 'DONE' ? new Date() : data.status !== undefined ? null : undefined,
      },
      include: { assignee: { select: { id: true, name: true, email: true } } },
    });

    res.json(updated);
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: { project: true },
    });

    if (!task) return res.status(404).json({ message: 'Task not found.' });
    if (task.project.adminId !== req.user.id) {
      return res.status(403).json({ message: 'Only the project admin can delete tasks.' });
    }

    await prisma.task.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();

if (req.user.role === 'ADMIN') {
      const [tasks, projects] = await Promise.all([
        prisma.task.findMany({
          where: { project: { adminId: req.user.id } },
          include: {
            project: { select: { id: true, name: true } },
            assignee: { select: { name: true } },
          },
        }),
        prisma.project.findMany({
          where: { adminId: req.user.id },
          include: {
            members: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const total = tasks.length;
      const done = tasks.filter((t) => t.status === 'DONE').length;
      const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
      const todo = tasks.filter((t) => t.status === 'TODO').length;
      const overdue = tasks.filter(
        (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE' && t.status !== 'PENDING_CONFIRMATION'
      ).length;
      const pendingConfirmationTasks = tasks
        .filter((t) => t.status === 'PENDING_CONFIRMATION')
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      const recentTasks = tasks
        .filter((t) => t.status !== 'PENDING_CONFIRMATION')
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      // Build per-project stats
      const projectStats = projects.map((proj) => {
        const projTasks = tasks.filter((t) => t.project?.id === proj.id);
        const memberTaskCounts = {};
        projTasks.forEach((t) => {
          if (t.assigneeId) memberTaskCounts[t.assigneeId] = (memberTaskCounts[t.assigneeId] || 0) + 1;
        });
        return {
          id: proj.id,
          name: proj.name,
          completionStatus: proj.completionStatus || 'ACTIVE',
          members: proj.members.map((m) => ({
            id: m.user.id,
            name: m.user.name,
            email: m.user.email,
            taskCount: memberTaskCounts[m.user.id] || 0,
          })),
          total: projTasks.length,
          todo: projTasks.filter((t) => t.status === 'TODO').length,
          inProgress: projTasks.filter((t) => t.status === 'IN_PROGRESS').length,
          pending: projTasks.filter((t) => t.status === 'PENDING_CONFIRMATION').length,
          done: projTasks.filter((t) => t.status === 'DONE').length,
        };
      });

      return res.json({ total, done, inProgress, todo, overdue, recentTasks, pendingConfirmationTasks, projectStats });
    }

    // Member dashboard — only tasks assigned to this user
    const myTasks = await prisma.task.findMany({
      where: { assigneeId: req.user.id },
      include: {
        project: { select: { id: true, name: true, completionStatus: true } },
        assignee: { select: { name: true } },
      },
      orderBy: { dueDate: 'asc' },
    });

    const myOverdue = myTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE' && t.status !== 'PENDING_CONFIRMATION'
    );
    const myInProgress = myTasks.filter((t) => t.status === 'IN_PROGRESS');
    const myTodo = myTasks.filter((t) => t.status === 'TODO');
    const myDone = myTasks.filter((t) => t.status === 'DONE');
    const myPending = myTasks.filter((t) => t.status === 'PENDING_CONFIRMATION');

    // Urgent = overdue or due within 3 days, not done/pending
    const soon = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const urgentTasks = myTasks
      .filter((t) => t.status !== 'DONE' && t.status !== 'PENDING_CONFIRMATION' && t.dueDate && new Date(t.dueDate) <= soon)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);

    const activeTasks = myInProgress
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5);

    const upcomingTasks = myTodo
      .sort((a, b) => {
        if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      })
      .slice(0, 5);

    const pendingTasks = myPending
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5);

    return res.json({
      isMember: true,
      stats: {
        total: myTasks.length,
        done: myDone.length,
        inProgress: myInProgress.length,
        todo: myTodo.length,
        overdue: myOverdue.length,
        pending: myPending.length,
      },
      urgentTasks,
      activeTasks,
      upcomingTasks,
      pendingTasks,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getProjectTasks, createTask, updateTask, deleteTask, getDashboardStats };
