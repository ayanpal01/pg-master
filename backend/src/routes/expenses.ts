import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { ExpenseService } from '../services/expense.service';
import { AddExpenseBody, UpdateExpenseBody, UpdateExpenseStatusBody } from '../types';

const router = Router();
router.use(authMiddleware);

// GET /api/expenses?status=APPROVED|PENDING|REJECTED
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.pgId) { 
      res.status(401).json({ error: 'No PG assigned' }); 
      return; 
    }
    const status = req.query['status'] as 'PENDING' | 'APPROVED' | 'REJECTED' | undefined;
    
    // Security: Only get expenses from user's PG
    const expenses = await ExpenseService.getExpenses(req.user.pgId.toString(), status);
    res.json(expenses);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

// POST /api/expenses — manager adds an expense
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Security: Only managers can add expenses
    if (!req.user?.pgId || req.user.role !== 'MANAGER') {
      res.status(403).json({ error: 'Only managers can add expenses' }); 
      return;
    }
    
    const { amount, description, date, spentBy } = req.body as AddExpenseBody;
    
    // Security: Ensure spentBy user belongs to same PG (if provided)
    if (spentBy) {
      const { connectDB } = await import('../lib/db');
      const User = (await import('../models/user.model')).default;
      await connectDB();
      const spentByUser = await User.findById(spentBy);
      if (!spentByUser || spentByUser.pgId?.toString() !== req.user.pgId.toString()) {
        res.status(403).json({ error: 'Cannot assign expense to user from different PG' });
        return;
      }
    }
    
    const expense = await ExpenseService.addExpense(
      req.user.pgId.toString(),
      req.user._id.toString(),
      { amount, description, date: new Date(date), spentBy }
    );
    res.status(201).json(expense);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

// PATCH /api/expenses  — manager approves/rejects
router.patch('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Security: Only managers can approve/reject
    if (!req.user?.pgId || req.user.role !== 'MANAGER') {
      res.status(403).json({ error: 'Only managers can approve/reject expenses' }); 
      return;
    }
    
    const { expenseId, status } = req.body as UpdateExpenseStatusBody;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' }); 
      return;
    }
    
    // Security: Verify expense belongs to manager's PG
    const { connectDB } = await import('../lib/db');
    const Expense = (await import('../models/expense.model')).default;
    await connectDB();
    const expense = await Expense.findById(expenseId);
    if (!expense || expense.pgId.toString() !== req.user.pgId.toString()) {
      res.status(403).json({ error: 'Cannot modify expense from different PG' });
      return;
    }
    
    const updatedExpense = await ExpenseService.updateExpenseStatus(expenseId, req.user._id.toString(), status);
    res.json(updatedExpense);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

// PATCH /api/expenses/:id — edit expense fields
router.patch('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.pgId || req.user.role !== 'MANAGER') {
      res.status(403).json({ error: 'Forbidden' }); return;
    }
    
    const { connectDB } = await import('../lib/db');
    const Expense = (await import('../models/expense.model')).default;
    await connectDB();
    
    const expenseId = Array.isArray(req.params['id']) ? req.params['id'][0] : req.params['id'];
    const existingExpense = await Expense.findById(expenseId);
    
    if (!existingExpense || existingExpense.pgId.toString() !== req.user.pgId.toString()) {
      res.status(403).json({ error: 'Cannot modify expense from different PG' });
      return;
    }

    const { amount, description, date, spentBy } = req.body as UpdateExpenseBody;
    
    if (spentBy) {
      const User = (await import('../models/user.model')).default;
      const spentByUser = await User.findById(spentBy);
      if (!spentByUser || spentByUser.pgId?.toString() !== req.user.pgId.toString()) {
        res.status(403).json({ error: 'Cannot assign expense to user from different PG' });
        return;
      }
    }

    const expense = await ExpenseService.updateExpense(expenseId!, {
      amount,
      description,
      date: date ? new Date(date) : undefined,
      spentBy,
    });
    res.json(expense);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Security: Only managers can delete
    if (!req.user?.pgId || req.user.role !== 'MANAGER') {
      res.status(403).json({ error: 'Only managers can delete expenses' }); 
      return;
    }
    
    // Security: Verify expense belongs to manager's PG
    const { connectDB } = await import('../lib/db');
    const Expense = (await import('../models/expense.model')).default;
    await connectDB();
    const expense = await Expense.findById(req.params['id']!);
    if (!expense || expense.pgId.toString() !== req.user.pgId.toString()) {
      res.status(403).json({ error: 'Cannot delete expense from different PG' });
      return;
    }
    
    const expenseId = Array.isArray(req.params['id']) ? req.params['id'][0] : req.params['id'];
    await ExpenseService.deleteExpense(expenseId!);
    res.json({ success: true });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

export default router;
