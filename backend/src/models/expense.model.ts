import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExpense extends Document {
  amount: number;
  description: string;
  date: Date;
  createdBy: mongoose.Types.ObjectId;
  spentBy: mongoose.Types.ObjectId;
  pgId: mongoose.Types.ObjectId;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy: mongoose.Types.ObjectId | null;
  approvedAt: Date | null;
}

const ExpenseSchema = new Schema<IExpense>({
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  date: { type: Date, default: Date.now },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  spentBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  pgId: { type: Schema.Types.ObjectId, ref: 'PG', required: true },
  status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
  approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null },
}, { timestamps: true });

const Expense: Model<IExpense> = mongoose.models.Expense ?? mongoose.model<IExpense>('Expense', ExpenseSchema);
export default Expense;
