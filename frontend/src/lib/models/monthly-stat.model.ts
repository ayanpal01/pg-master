import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMonthlyStat extends Document {
  pgId: mongoose.Types.ObjectId;
  month: string; // Format: "YYYY-MM"
  mealCharge: number;
  totalMeals: number;
  totalExpenses: number;
  isLocked: boolean;
}

const MonthlyStatSchema: Schema = new Schema({
  pgId: { type: Schema.Types.ObjectId, ref: 'PG', required: true },
  month: { type: String, required: true },
  mealCharge: { type: Number, required: true },
  totalMeals: { type: Number, required: true },
  totalExpenses: { type: Number, required: true },
  isLocked: { type: Boolean, default: false }
}, { timestamps: true });

// Ensure one stat per PG per month
MonthlyStatSchema.index({ pgId: 1, month: 1 }, { unique: true });

// Force-clear the model in development
if (process.env.NODE_ENV !== 'production' && mongoose.models.MonthlyStat) {
  delete (mongoose.models as any).MonthlyStat;
}

const MonthlyStat: Model<IMonthlyStat> = mongoose.models.MonthlyStat || mongoose.model<IMonthlyStat>('MonthlyStat', MonthlyStatSchema);
export default MonthlyStat;
