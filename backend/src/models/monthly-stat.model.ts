import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMonthlyStat extends Document {
  pgId: mongoose.Types.ObjectId;
  month: string; // Format: "YYYY-MM"
  mealCharge: number;
  totalMeals: number;
  totalExpenses: number;
  isLocked: boolean;
}

const MonthlyStatSchema = new Schema<IMonthlyStat>({
  pgId: { type: Schema.Types.ObjectId, ref: 'PG', required: true },
  month: { type: String, required: true },
  mealCharge: { type: Number, required: true },
  totalMeals: { type: Number, required: true },
  totalExpenses: { type: Number, required: true },
  isLocked: { type: Boolean, default: false },
}, { timestamps: true });

MonthlyStatSchema.index({ pgId: 1, month: 1 }, { unique: true });

const MonthlyStat: Model<IMonthlyStat> = mongoose.models.MonthlyStat ?? mongoose.model<IMonthlyStat>('MonthlyStat', MonthlyStatSchema);
export default MonthlyStat;
