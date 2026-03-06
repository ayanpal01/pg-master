import { Router, Response } from 'express';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import { ExpenseService } from '../services/expense.service';
import { AddExpenseBody, UpdateExpenseBody, UpdateExpenseStatusBody } from '../types';

const router = Router();
router.use(authMiddleware);

// GET /api/expenses?status=APPROVED|PENDING|REJECTED
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.pgId) { res.status(401).json({ error: 'No PG assigned' }); return; }
    const status = req.query['status'] as 'PENDING' | 'APPROVED' | 'REJECTED' | undefined;
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
    if (!req.user?.pgId || req.user.role !== 'MANAGER') {
      res.status(403).json({ error: 'Forbidden' }); return;
    }
    const { amount, description, date, spentBy } = req.body as AddExpenseBody;
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
    if (!req.user || req.user.role !== 'MANAGER') {
      res.status(403).json({ error: 'Forbidden' }); return;
    }
    const { expenseId, status } = req.body as UpdateExpenseStatusBody;
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' }); return;
    }
    const expense = await ExpenseService.updateExpenseStatus(expenseId, req.user._id.toString(), status);
    res.json(expense);
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

// PATCH /api/expenses/:id — edit expense fields
router.patch('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user || req.user.role !== 'MANAGER') {
      res.status(403).json({ error: 'Forbidden' }); return;
    }
    const { amount, description, date, spentBy } = req.body as UpdateExpenseBody;
    const expense = await ExpenseService.updateExpense(req.params['id']!, {
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
    if (!req.user || req.user.role !== 'MANAGER') {
      res.status(403).json({ error: 'Forbidden' }); return;
    }
    await ExpenseService.deleteExpense(req.params['id']!);
    res.json({ success: true });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json({ error });
  }
});

export default router;
