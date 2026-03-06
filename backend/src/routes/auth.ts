import { Router, Request, Response } from 'express';
import { connectDB } from '../lib/db';
import { signToken, verifyToken } from '../lib/jwt';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import User from '../models/user.model';
import { LoginBody } from '../types';

const router = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  path: '/',
  maxAge: 24 * 60 * 60 * 1000, // 24h
};

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { uniqueKey } = req.body as LoginBody;
    if (!uniqueKey) {
      res.status(400).json({ error: 'uniqueKey is required' });
      return;
    }

    await connectDB();
    const user = await User.findOne({ uniqueKey, active: true }).populate('pgId');
    if (!user) {
      res.status(401).json({ error: 'Invalid unique key' });
      return;
    }

    const token = await signToken(user.uniqueKey);
    res.cookie('session', token, COOKIE_OPTS);
    res.json(user);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('session', { path: '/' });
  res.json({ success: true });
});

// GET /api/auth/profile
router.get('/profile', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    await connectDB();
    const user = await User.findOne({ uniqueKey: req.uid, active: true }).populate('pgId');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

// POST /api/auth/reset-key  (manager resets their own key — auto-logout)
router.post('/reset-key', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
    const { generateUniqueKey } = await import('../lib/keygen');
    const newKey = generateUniqueKey();
    req.user.uniqueKey = newKey;
    await req.user.save();

    // Issue a new token
    const token = await signToken(newKey);
    res.cookie('session', token, COOKIE_OPTS);
    res.json({ newKey });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

export default router;
