import { Router, Request, Response } from 'express';
import { PGService } from '../services/pg.service';
import { signToken } from '../lib/jwt';
import { CreatePGBody } from '../types';

const router = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: (process.env.NODE_ENV === 'production' ? 'strict' : 'lax') as 'strict' | 'lax',
  path: '/',
  maxAge: 24 * 60 * 60 * 1000,
};

// POST /api/setup — create a new PG + manager (public route)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, mealTypes, managerName, phoneNumber } = req.body as CreatePGBody;
    if (!name || !mealTypes || !Array.isArray(mealTypes) || !managerName || !phoneNumber) {
      res.status(400).json({ error: 'Missing required fields: name, mealTypes, managerName, phoneNumber' });
      return;
    }

    const { pg, managerKey } = await PGService.createPG(managerName, phoneNumber, name, mealTypes);

    // Auto-login the new manager
    const token = await signToken(managerKey);
    res.cookie('session', token, COOKIE_OPTS);

    res.status(201).json({ success: true, pgId: pg._id, managerKey });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    console.error('PG creation error:', error);
    res.status(500).json({ error });
  }
});

export default router;
