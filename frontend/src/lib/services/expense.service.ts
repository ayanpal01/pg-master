import connectDB from '../mongoose';
import Expense from '../models/expense.model';
import mongoose from 'mongoose';

export class ExpenseService {
  /**
   * Adds a new expense (Defaults to PENDING status).
   */
  static async addExpense(pgId: string, userId: string, data: { amount: number, description: string, date: Date, spentBy?: string }) {
    await connectDB();
    const expense = new Expense({
      ...data,
      pgId: new mongoose.Types.ObjectId(pgId),
      createdBy: new mongoose.Types.ObjectId(userId),
      spentBy: new mongoose.Types.ObjectId(data.spentBy || userId),
      status: 'PENDING'
    });
    return expense.save();
  }

  /**
   * Approves or Rejects an expense. Only for managers.
   */
  static async updateExpenseStatus(expenseId: string, managerId: string, status: 'APPROVED' | 'REJECTED') {
    await connectDB();
    return Expense.findByIdAndUpdate(expenseId, {
      status,
      approvedBy: new mongoose.Types.ObjectId(managerId),
      approvedAt: new Date()
    }, { new: true });
  }

  static async updateExpense(expenseId: string, data: { amount?: number, description?: string, date?: Date, spentBy?: string }) {
    await connectDB();
    const update: any = { ...data };
    if (data.spentBy) update.spentBy = new mongoose.Types.ObjectId(data.spentBy);
    if (data.date) update.date = new Date(data.date);
    
    return Expense.findByIdAndUpdate(expenseId, update, { new: true });
  }

  static async deleteExpense(expenseId: string) {
    await connectDB();
    return Expense.findByIdAndDelete(expenseId);
  }

  static async getExpenses(pgId: string, status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    await connectDB();
    const query: any = { pgId: new mongoose.Types.ObjectId(pgId) };
    if (status) query.status = status;
    return Expense.find(query).sort({ date: -1 }).populate('createdBy', 'name').populate('spentBy', 'name');
  }
}
