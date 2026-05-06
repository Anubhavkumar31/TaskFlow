const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../lib/prisma');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'MEMBER']).optional().default('MEMBER'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const register = async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered.' });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
      },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    const token = generateToken(user);

    res.status(201).json({ token, user });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const login = async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = generateToken(user);

    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: err.errors[0].message });
    }
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { register, login, getMe };
