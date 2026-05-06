const { z } = require('zod');
const prisma = require('../lib/prisma');

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
});

const updateCompletionSchema = z.object({
  completionStatus: z.enum(['ACTIVE', 'COMPLETED', 'ON_HOLD']),
  completedAt: z.string().datetime().optional().nullable(),
});

const getAllProjects = async (req, res) => {
  try {
    let projects;

    if (req.user.role === 'ADMIN') {
      projects = await prisma.project.findMany({
        where: { adminId: req.user.id },
        include: {
          admin: { select: { id: true, name: true, email: true } },
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      projects = await prisma.project.findMany({
        where: {
          members: { some: { userId: req.user.id } },
        },
        include: {
          admin: { select: { id: true, name: true, email: true } },
          members: { include: { user: { select: { id: true, name: true, email: true } } } },
          _count: { select: { tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    res.json(projects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getProject = async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        admin: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
        tasks: {
          include: { assignee: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!project) return res.status(404).json({ message: 'Project not found.' });

    const isMember = project.members.some((m) => m.userId === req.user.id);
    const isAdmin = project.adminId === req.user.id;

    if (!isMember && !isAdmin) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const createProject = async (req, res) => {
  try {
    const data = createProjectSchema.parse(req.body);

    const project = await prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        adminId: req.user.id,
      },
      include: {
        admin: { select: { id: true, name: true, email: true } },
        _count: { select: { tasks: true } },
      },
    });

    res.status(201).json(project);
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });

    if (!project) return res.status(404).json({ message: 'Project not found.' });
    if (project.adminId !== req.user.id) {
      return res.status(403).json({ message: 'Only the project admin can delete this project.' });
    }

    await prisma.project.delete({ where: { id: req.params.id } });
    res.json({ message: 'Project deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const addMember = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    if (project.adminId !== req.user.id) {
      return res.status(403).json({ message: 'Only the project admin can add members.' });
    }

    const userToAdd = await prisma.user.findUnique({ where: { email } });
    if (!userToAdd) return res.status(404).json({ message: 'User not found.' });

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: project.id, userId: userToAdd.id } },
    });
    if (existing) return res.status(400).json({ message: 'User is already a member.' });

    const member = await prisma.projectMember.create({
      data: { projectId: project.id, userId: userToAdd.id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    res.status(201).json(member);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const removeMember = async (req, res) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    if (project.adminId !== req.user.id) {
      return res.status(403).json({ message: 'Only the project admin can remove members.' });
    }

    await prisma.projectMember.deleteMany({
      where: { projectId: req.params.id, userId: req.params.userId },
    });

    res.json({ message: 'Member removed.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

const updateProjectCompletion = async (req, res) => {
  try {
    const project = await prisma.project.findUnique({ where: { id: req.params.id } });
    if (!project) return res.status(404).json({ message: 'Project not found.' });
    if (project.adminId !== req.user.id) {
      return res.status(403).json({ message: 'Only the project admin can update completion status.' });
    }

    const data = updateCompletionSchema.parse(req.body);

    let completedAt = project.completedAt;
    if (data.completionStatus === 'COMPLETED') {
      completedAt = data.completedAt ? new Date(data.completedAt) : new Date();
    } else {
      completedAt = null;
    }

    const updated = await prisma.project.update({
      where: { id: req.params.id },
      data: { completionStatus: data.completionStatus, completedAt },
      include: {
        admin: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true, email: true } } } },
        _count: { select: { tasks: true } },
      },
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

module.exports = { getAllProjects, getProject, createProject, deleteProject, addMember, removeMember, getAllUsers, updateProjectCompletion };
