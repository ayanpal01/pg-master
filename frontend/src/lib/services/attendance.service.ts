import connectDB from '../mongoose';
import Attendance from '../models/attendance.model';
import PG from '../models/pg.model';
import mongoose from 'mongoose';

export class AttendanceService {
  /**
   * Records attendance for multiple users on a specific date.
   */
  static async recordAttendance(pgId: string, date: Date, records: Array<{ userId: string, mealType: string, status: boolean }>) {
    await connectDB();
    
    const formattedDate = new Date(date);
    formattedDate.setHours(0, 0, 0, 0);

    const attendanceRecords = records.map(r => ({
      userId: new mongoose.Types.ObjectId(r.userId),
      mealType: r.mealType,
      status: r.status,
      // If manager is taking it, we can also sync the proposed status if we want, 
      // but the key is that 'status' is now official.
    }));

    return Attendance.findOneAndUpdate(
      { pgId: new mongoose.Types.ObjectId(pgId), date: formattedDate },
      { 
        pgId: new mongoose.Types.ObjectId(pgId), 
        date: formattedDate, 
        records: attendanceRecords,
        isOfficial: true 
      },
      { upsert: true, new: true }
    );
  }

  static async getAttendanceByMonth(pgId: string, month: Date) {
    await connectDB();
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    return Attendance.find({
      pgId: new mongoose.Types.ObjectId(pgId),
      date: { $gte: start, $lte: end }
    }).sort({ date: 1 });
  }

  static async toggleUserMeal(pgId: string, userId: string, date: Date, mealType: string, status: boolean) {
    await connectDB();
    const formattedDate = new Date(date);
    formattedDate.setHours(0, 0, 0, 0);

    const record = await Attendance.findOne({ pgId, date: formattedDate });
    
    if (record) {
      const existingIdx = record.records.findIndex(r => r.userId.toString() === userId && r.mealType === mealType);
      if (existingIdx > -1) {
        record.records[existingIdx].memberProposedStatus = status;
      } else {
        record.records.push({ 
          userId: new mongoose.Types.ObjectId(userId), 
          mealType, 
          status: true, // Internal default
          memberProposedStatus: status 
        });
      }
      return record.save();
    } else {
      return Attendance.create({
        pgId: new mongoose.Types.ObjectId(pgId),
        date: formattedDate,
        isOfficial: false,
        records: [{ 
          userId: new mongoose.Types.ObjectId(userId), 
          mealType, 
          status: true, 
          memberProposedStatus: status 
        }]
      });
    }
  }
}
