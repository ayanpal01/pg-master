import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { connectDB } from '../lib/db';
import Payment from '../models/payment.model';
import { AddPaymentBody, UpdatePaymentBody } from '../types';

const router = Router();
router.use(authMiddleware);

// GET /api/payments?userId=...
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.pgId) { res.status(401).json({ error: 'Unauthorized' }); return; }

    await connectDB();
    const userId = req.query['userId'] as string | undefined;

    interface PaymentFilter {
      pgId: unknown;
      userId?: string;
    }
    const query: PaymentFilter = { pgId: req.user.pgId };
    if (userId) query.userId = userId;

    const payments = await Payment.find(query).sort({ date: -1 }).populate('userId', 'name');
    res.json(payments);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

// POST /api/payments — manager records a payment for a member
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Security: Only managers can record payments
    if (!req.user || req.user.role !== 'MANAGER') {
      res.status(403).json({ error: 'Only managers can record payments' }); 
      return;
    }
    
    const { userId, amount, note, date } = req.body as AddPaymentBody;
    if (!userId || !amount) { 
      res.status(400).json({ error: 'userId and amount are required' }); 
      return; 
    }

    await connectDB();
    
    // Security: Verify the user belongs to the manager's PG
    const User = (await import('../models/user.model')).default;
    const targetUser = await User.findById(userId);
    if (!targetUser || targetUser.pgId?.toString() !== req.user.pgId?.toString()) {
      res.status(403).json({ error: 'Cannot record payment for user from different PG' });
      return;
    }
    
    const payment = new Payment({
      amount,
      userId,
      pgId: req.user.pgId,
      note,
      date: date ? new Date(date) : new Date(),
    });
    await payment.save();
    res.status(201).json(payment);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

// PATCH /api/payments/:id
router.patch('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Security: Only managers can update payments
    if (!req.user || req.user.role !== 'MANAGER') {
      res.status(403).json({ error: 'Only managers can update payments' }); 
      return;
    }
    
    await connectDB();
    
    // Security: Verify payment belongs to manager's PG
    const existingPayment = await Payment.findById(req.params['id']);
    if (!existingPayment || existingPayment.pgId.toString() !== req.user.pgId?.toString()) {
      res.status(403).json({ error: 'Cannot modify payment from different PG' });
      return;
    }
    
    const payment = await Payment.findByIdAndUpdate(
      req.params['id'], 
      req.body as UpdatePaymentBody, 
      { new: true }
    );
    res.json(payment);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

// DELETE /api/payments/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Security: Only managers can delete payments
    if (!req.user || req.user.role !== 'MANAGER') {
      res.status(403).json({ error: 'Only managers can delete payments' }); 
      return;
    }
    
    await connectDB();
    
    // Security: Verify payment belongs to manager's PG
    const payment = await Payment.findById(req.params['id']);
    if (!payment || payment.pgId.toString() !== req.user.pgId?.toString()) {
      res.status(403).json({ error: 'Cannot delete payment from different PG' });
      return;
    }
    
    await Payment.findByIdAndDelete(req.params['id']);
    res.json({ success: true });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

export default router;
