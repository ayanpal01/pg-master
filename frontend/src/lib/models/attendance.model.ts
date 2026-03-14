import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAttendanceRecord {
  userId: mongoose.Types.ObjectId;
  mealType: string;
  status: boolean;
  memberProposedStatus?: boolean;
}

export interface IAttendance extends Document {
  date: Date;
  pgId: mongoose.Types.ObjectId;
  records: IAttendanceRecord[];
  isOfficial: boolean;
}

const AttendanceSchema: Schema = new Schema({
  date: { type: Date, required: true },
  pgId: { type: Schema.Types.ObjectId, ref: 'PG', required: true },
  isOfficial: { type: Boolean, default: false },
  records: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    mealType: { type: String, required: true },
    status: { type: Boolean, default: true },
    memberProposedStatus: { type: Boolean, default: true }
  }]
}, { timestamps: true });

// Ensure unique attendance per date per PG
AttendanceSchema.index({ date: 1, pgId: 1 }, { unique: true });

// Force-clear the model in development to handle schema changes correctly
if (process.env.NODE_ENV !== 'production' && mongoose.models.Attendance) {
  delete (mongoose.models as any).Attendance;
}

const Attendance: Model<IAttendance> = mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
export default Attendance;
