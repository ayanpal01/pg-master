import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { connectDB } from '../lib/db';
import { PGService } from '../services/pg.service';
import User from '../models/user.model';
import PG from '../models/pg.model';
import { AddMemberBody, ResetMemberKeyBody, UpdatePGBody } from '../types';

const router = Router();
router.use(authMiddleware);

// GET /api/pg — get current PG details and members
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.pgId) { res.status(401).json({ error: 'No PG assigned' }); return; }
    await connectDB();
    const [pg, members] = await Promise.all([
      PG.findById(req.user.pgId),
      User.find({ pgId: req.user.pgId }),
    ]);
    res.json({ pg, members });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

// PATCH /api/pg — update PG settings
router.patch('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'MANAGER') {
      res.status(403).json({ error: 'Forbidden' }); return;
    }
    const pg = await PGService.updatePGSettings(
      req.user.pgId!.toString(),
      req.uid!,
      req.body as UpdatePGBody
    );
    res.json(pg);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

// GET /api/pg/members — list members
router.get('/members', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.pgId) { res.status(401).json({ error: 'No PG' }); return; }
    await connectDB();
    const members = await User.find({ pgId: req.user.pgId });
    res.json(members);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

// POST /api/pg/members — add a member
router.post('/members', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'MANAGER') {
      res.status(403).json({ error: 'Forbidden' }); return;
    }
    const { name, phoneNumber } = req.body as AddMemberBody;
    if (!name || !phoneNumber) { res.status(400).json({ error: 'name and phoneNumber are required' }); return; }

    const member = await PGService.addMember(req.user.pgId!.toString(), name, phoneNumber);
    res.status(201).json(member);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

// PATCH /api/pg/members - reset member key
router.patch('/members', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'MANAGER') {
      res.status(403).json({ error: 'Forbidden' }); return;
    }
    const { userId } = req.body as ResetMemberKeyBody;
    const newKey = await PGService.resetMemberKey(req.user.pgId!.toString(), req.uid!, userId);
    res.json({ newKey });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

export default router;
