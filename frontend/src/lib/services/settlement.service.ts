import connectDB from '../mongoose';
import PG from '../models/pg.model';
import User from '../models/user.model';
import Attendance from '../models/attendance.model';
import Expense from '../models/expense.model';
import Settlement, { ISettlementSnapshot } from '../models/settlement.model';
import mongoose from 'mongoose';
import { startOfMonth, endOfMonth, format, subMonths } from 'date-fns';

export class SettlementService {
  /**
   * Performs the month-end settlement for a PG.
   * Calculates rates, balances, and creates a read-only snapshot.
   */
  static async executeSettlement(pgId: string, monthStr: string) {
    await connectDB();
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const pg = await PG.findById(pgId).session(session);
      if (!pg) throw new Error('PG not found');

      const date = new Date(monthStr + "-01");
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      // 1. Get all approved expenses for this month
      const expenses = await Expense.find({
        pgId,
        status: 'APPROVED',
        date: { $gte: monthStart, $lte: monthEnd }
      }).session(session);

      const totalPgExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

      // 2. Get all attendance for this month
      const attendance = await Attendance.find({
        pgId,
        date: { $gte: monthStart, $lte: monthEnd }
      }).session(session);

      // Map to track user meals
      const userMealMap: Record<string, number> = {};
      let totalPgMeals = 0;

      attendance.forEach(day => {
        day.records.forEach(record => {
          if (record.status) {
            const uid = record.userId.toString();
            userMealMap[uid] = (userMealMap[uid] || 0) + 1;
            totalPgMeals++;
          }
        });
      });

      // 3. Calculate Base Meal Rate
      const baseMealRate = totalPgMeals > 0 ? totalPgExpenses / totalPgMeals : 0;

      // 4. Get all members to calculate balances
      const members = await User.find({ pgId }).session(session);
      
      const snapshots: ISettlementSnapshot[] = [];

      for (const member of members) {
        const userId = member._id.toString();
        const userTotalMeals = userMealMap[userId] || 0;
        const cookingCharge = pg.cookingChargePerUser.get(userId) || 0;
        
        // "Spent" for the user this month (This logic might need refinement based on how spending is tracked)
        // For now, assume a separate Spending entry or similar. 
        // Based on requirements, "Previous month's Final Balance automatically becomes next month's Spent".
        // So we need to fetch user's current 'Spent' which includes carry-over.
        
        // TODO: Implement a UserSpending model or track it on the User model.
        // For this logic, let's assume we have a way to get the cumulative 'Spent' for the user.
        const totalSpent = 0; // Placeholder: This should be user's actual spending pool.

        const baseMealCost = userTotalMeals * baseMealRate;
        const finalBalance = (totalSpent - baseMealCost) - cookingCharge;

        snapshots.push({
          userId: member._id as mongoose.Types.ObjectId,
          userName: member.name,
          totalSpent,
          totalMeals: userTotalMeals,
          cookingCharge,
          baseMealCost,
          finalBalance
        });
      }

      // 5. Save the settlement
      const settlement = new Settlement({
        month: monthStr,
        pgId,
        snapshots,
        totalPgMeals,
        totalPgExpenses,
        baseMealRate,
        isLocked: true
      });

      await settlement.save({ session });

      // 6. Carry forward balances to next month (Reset logic)
      // "Previous month's Final Balance automatically becomes next month's Spent"
      // This implies we need a way to store "Current Spent/Balance" for the user.
      // Let's add a 'balance' field to the User model? Or a separate Transaction ledger.
      
      await session.commitTransaction();
      return settlement;

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
