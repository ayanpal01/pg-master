import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest, requireRole } from '../middleware/auth';
import { AttendanceService } from '../services/attendance.service';
import Attendance from '../models/attendance.model';
import { connectDB } from '../lib/db';
import { AttendanceRecordInput } from '../types';

const router = Router();

// All attendance routes require authentication
router.use(authMiddleware);

// GET /api/attendance?date=YYYY-MM-DD or ?month=YYYY-MM
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.pgId) { res.status(401).json({ error: 'No PG assigned' }); return; }

    const dateParam = req.query['date'] as string | undefined;
    const monthParam = req.query['month'] as string | undefined;

    if (dateParam) {
      const date = new Date(dateParam);
      date.setHours(0, 0, 0, 0);
      await connectDB();
      const attendance = await Attendance.findOne({ pgId: req.user.pgId, date });
      res.json(attendance);
      return;
    }

    const month = monthParam ? new Date(monthParam) : new Date();
    const attendance = await AttendanceService.getAttendanceByMonth(req.user.pgId.toString(), month);
    res.json(attendance);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

// POST /api/attendance
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }

    const body = req.body as { toggle?: boolean; mealType?: string; status?: boolean; date?: string; records?: AttendanceRecordInput[] };

    if (body.toggle) {
      // Member toggling their own meal
      const { mealType, status } = body;
      if (mealType === undefined || status === undefined) {
        res.status(400).json({ error: 'mealType and status are required' }); return;
      }
      const attendance = await AttendanceService.toggleUserMeal(
        req.user.pgId!.toString(),
        req.user._id.toString(),
        new Date(),
        mealType,
        status
      );
      res.json(attendance);
      return;
    }

    // Manager recording full attendance
    if (req.user.role !== 'MANAGER') {
      res.status(403).json({ error: 'Forbidden' }); return;
    }

    const { date, records } = body;
    if (!date || !records) {
      res.status(400).json({ error: 'date and records are required' }); return;
    }

    const attendance = await AttendanceService.recordAttendance(
      req.user.pgId!.toString(),
      new Date(date),
      records
    );
    res.json(attendance);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

export default router;
