import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { connectDB } from '../lib/db';
import Attendance from '../models/attendance.model';
import Expense from '../models/expense.model';
import Payment from '../models/payment.model';
import User from '../models/user.model';
import PG from '../models/pg.model';
import MonthlyStat from '../models/monthly-stat.model';
import { FinalizeMonthBody } from '../types';

const router = Router();
router.use(authMiddleware);

// GET /api/stats/monthly?month=YYYY-MM
router.get('/monthly', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.pgId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const monthStr = req.query['month'] as string | undefined;
    if (!monthStr) { res.status(400).json({ error: 'month is required (YYYY-MM)' }); return; }

    const [year, month] = monthStr.split('-').map(Number) as [number, number];
    const startOfMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    await connectDB();
    const pgId = req.user.pgId;

    const [attendance, expenses, payments, members, savedStat, pg] = await Promise.all([
      Attendance.find({ pgId, date: { $gte: startOfMonth, $lte: endOfMonth } }),
      Expense.find({ pgId, date: { $gte: startOfMonth, $lte: endOfMonth } }).populate('spentBy', 'name'),
      Payment.find({ pgId, date: { $gte: startOfMonth, $lte: endOfMonth } }).populate('userId', 'name'),
      User.find({ pgId }),
      MonthlyStat.findOne({ pgId, month: monthStr }),
      PG.findById(pgId),
    ]);

    res.json({ attendance, expenses, payments, members, savedStat, pg });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

// GET /api/stats/dashboard — quick totals for dashboard cards
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.pgId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    await connectDB();
    const pgId = req.user.pgId;

    const [attendance, expenses, payments, members, pg] = await Promise.all([
      Attendance.find({ pgId, date: { $gte: startOfMonth, $lte: endOfMonth } }),
      Expense.find({ pgId, date: { $gte: startOfMonth, $lte: endOfMonth }, status: 'APPROVED' }),
      Payment.find({ pgId, date: { $gte: startOfMonth, $lte: endOfMonth } }).populate('userId', 'name'),
      User.find({ pgId }),
      PG.findById(pgId),
    ]);

    res.json({ attendance, expenses, payments, members, pg });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

// POST /api/stats/monthly/finalize — manager locks a month
router.post('/monthly/finalize', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'MANAGER') {
      res.status(403).json({ error: 'Forbidden' }); return;
    }
    const { month, mealCharge, totalMeals, totalExpenses } = req.body as FinalizeMonthBody;
    if (!month || mealCharge === undefined) {
      res.status(400).json({ error: 'month and mealCharge are required' }); return;
    }

    await connectDB();
    const stat = await MonthlyStat.findOneAndUpdate(
      { pgId: req.user.pgId, month },
      { pgId: req.user.pgId, month, mealCharge, totalMeals, totalExpenses, isLocked: true },
      { upsert: true, new: true }
    );
    res.json(stat);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

export default router;
