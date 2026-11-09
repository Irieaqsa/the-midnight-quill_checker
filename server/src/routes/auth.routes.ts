import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database';
import { config } from '../config';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Register
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password, name, whatsappNumber } = req.body;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        res.status(400).json({ error: 'Email already registered' });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: 'USER',
          whatsappNumber: whatsappNumber || null,
          quotaRemaining: 50,
          emailVerified: true, // Auto-verified for frictionless local dev
        },
      });

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        config.jwt.secret,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'Registration successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          quotaRemaining: user.quotaRemaining,
          whatsappNumber: user.whatsappNumber,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Login
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password } = req.body;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      if (user.status === 'SUSPENDED') {
        res.status(403).json({ error: 'Account has been suspended by TMQ administrators' });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        config.jwt.secret,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          quotaRemaining: user.quotaRemaining,
          whatsappNumber: user.whatsappNumber,
          whatsappVerifiedAt: user.whatsappVerifiedAt,
        },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Get current profile
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id || req.user?.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        whatsappNumber: true,
        whatsappVerifiedAt: true,
        quotaRemaining: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Change Password (for logged in user)
router.post(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
  ],
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: errors.array()[0].msg });
        return;
      }

      const userId = req.user?.id || req.user?.userId;
      const { currentPassword, newPassword } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, passwordHash: true },
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        res.status(400).json({ error: 'Incorrect current password' });
        return;
      }

      if (currentPassword === newPassword) {
        res.status(400).json({ error: 'New password must be different from current password' });
        return;
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      res.json({ message: 'Password changed successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
);

// Mock WhatsApp verify
router.post('/whatsapp/send-code', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { whatsappNumber } = req.body;
  if (!whatsappNumber) {
    res.status(400).json({ error: 'Phone number required' });
    return;
  }

  await prisma.user.update({
    where: { id: req.user!.userId },
    data: {
      whatsappNumber,
      whatsappCode: '123456',
      whatsappCodeExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });

  res.json({ message: 'Verification code sent (use 123456 for demo)' });
});

router.post('/whatsapp/confirm', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { code } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });

  if (!user || user.whatsappCode !== code) {
    res.status(400).json({ error: 'Invalid verification code' });
    return;
  }

  await prisma.user.update({
    where: { id: req.user!.userId },
    data: {
      whatsappVerifiedAt: new Date(),
      whatsappCode: null,
    },
  });

  res.json({ message: 'WhatsApp number verified successfully' });
});

export default router;
