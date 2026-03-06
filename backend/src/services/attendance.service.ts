import { connectDB } from '../lib/db';
import Attendance, { IAttendance } from '../models/attendance.model';
import mongoose from 'mongoose';

interface AttendanceRecordInput {
  userId: string;
  mealType: string;
  status: boolean;
}

export class AttendanceService {
  static async recordAttendance(
    pgId: string,
    date: Date,
    records: AttendanceRecordInput[]
  ): Promise<IAttendance | null> {
    await connectDB();
    const formattedDate = new Date(date);
    formattedDate.setHours(0, 0, 0, 0);

    const attendanceRecords = records.map((r) => ({
      userId: new mongoose.Types.ObjectId(r.userId),
      mealType: r.mealType,
      status: r.status,
    }));

    return Attendance.findOneAndUpdate(
      { pgId: new mongoose.Types.ObjectId(pgId), date: formattedDate },
      {
        pgId: new mongoose.Types.ObjectId(pgId),
        date: formattedDate,
        records: attendanceRecords,
        isOfficial: true,
      },
      { upsert: true, new: true }
    );
  }

  static async getAttendanceByMonth(pgId: string, month: Date): Promise<IAttendance[]> {
    await connectDB();
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    return Attendance.find({
      pgId: new mongoose.Types.ObjectId(pgId),
      date: { $gte: start, $lte: end },
    }).sort({ date: 1 });
  }

  static async toggleUserMeal(
    pgId: string,
    userId: string,
    date: Date,
    mealType: string,
    status: boolean
  ): Promise<IAttendance> {
    await connectDB();
    const formattedDate = new Date(date);
    formattedDate.setHours(0, 0, 0, 0);

    const record = await Attendance.findOne({ pgId, date: formattedDate });

    if (record) {
      const existingIdx = record.records.findIndex(
        (r) => r.userId.toString() === userId && r.mealType === mealType
      );
      if (existingIdx > -1) {
        record.records[existingIdx].memberProposedStatus = status;
      } else {
        record.records.push({
          userId: new mongoose.Types.ObjectId(userId),
          mealType,
          status: true,
          memberProposedStatus: status,
        });
      }
      return record.save();
    }

    return Attendance.create({
      pgId: new mongoose.Types.ObjectId(pgId),
      date: formattedDate,
      isOfficial: false,
      records: [{ userId: new mongoose.Types.ObjectId(userId), mealType, status: true, memberProposedStatus: status }],
    });
  }
}
