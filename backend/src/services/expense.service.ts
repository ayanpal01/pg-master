import { connectDB } from '../lib/db';
import Expense, { IExpense } from '../models/expense.model';
import mongoose from 'mongoose';

interface AddExpenseData {
  amount: number;
  description: string;
  date: Date;
  spentBy?: string;
}

interface UpdateExpenseData {
  amount?: number;
  description?: string;
  date?: Date;
  spentBy?: string;
}

interface ExpenseFilter {
  pgId: mongoose.Types.ObjectId;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export class ExpenseService {
  static async addExpense(
    pgId: string,
    userId: string,
    data: AddExpenseData
  ): Promise<IExpense> {
    await connectDB();
    const expense = new Expense({
      ...data,
      pgId: new mongoose.Types.ObjectId(pgId),
      createdBy: new mongoose.Types.ObjectId(userId),
      spentBy: new mongoose.Types.ObjectId(data.spentBy ?? userId),
      status: 'PENDING',
    });
    return expense.save();
  }

  static async updateExpenseStatus(
    expenseId: string,
    managerId: string,
    status: 'APPROVED' | 'REJECTED'
  ): Promise<IExpense | null> {
    await connectDB();
    return Expense.findByIdAndUpdate(
      expenseId,
      {
        status,
        approvedBy: new mongoose.Types.ObjectId(managerId),
        approvedAt: new Date(),
      },
      { new: true }
    );
  }

  static async updateExpense(
    expenseId: string,
    data: UpdateExpenseData
  ): Promise<IExpense | null> {
    await connectDB();
    const update: Partial<IExpense> = {
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.date !== undefined && { date: new Date(data.date) }),
      ...(data.spentBy !== undefined && { spentBy: new mongoose.Types.ObjectId(data.spentBy) }),
    };
    return Expense.findByIdAndUpdate(expenseId, update, { new: true });
  }

  static async deleteExpense(expenseId: string): Promise<IExpense | null> {
    await connectDB();
    return Expense.findByIdAndDelete(expenseId);
  }

  static async getExpenses(
    pgId: string,
    status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  ): Promise<IExpense[]> {
    await connectDB();
    const query: ExpenseFilter = { pgId: new mongoose.Types.ObjectId(pgId) };
    if (status) query.status = status;
    return Expense.find(query)
      .sort({ date: -1 })
      .populate('createdBy', 'name')
      .populate('spentBy', 'name') as Promise<IExpense[]>;
  }
}
