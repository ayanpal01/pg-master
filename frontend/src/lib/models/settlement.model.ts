import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISettlementSnapshot {
  userId: mongoose.Types.ObjectId;
  userName: string;
  totalSpent: number;
  totalMeals: number;
  cookingCharge: number;
  baseMealCost: number;
  finalBalance: number;
}

export interface ISettlement extends Document {
  month: string; // YYYY-MM
  pgId: mongoose.Types.ObjectId;
  snapshots: ISettlementSnapshot[];
  totalPgMeals: number;
  totalPgExpenses: number;
  baseMealRate: number;
  isLocked: boolean;
  createdAt: Date;
}

const SettlementSchema: Schema = new Schema({
  month: { type: String, required: true },
  pgId: { type: Schema.Types.ObjectId, ref: 'PG', required: true },
  snapshots: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    totalSpent: { type: Number, required: true },
    totalMeals: { type: Number, required: true },
    cookingCharge: { type: Number, required: true },
    baseMealCost: { type: Number, required: true },
    finalBalance: { type: Number, required: true }
  }],
  totalPgMeals: { type: Number, required: true },
  totalPgExpenses: { type: Number, required: true },
  baseMealRate: { type: Number, required: true },
  isLocked: { type: Boolean, default: true },
}, { timestamps: true });

// Ensure unique settlement per month per PG
SettlementSchema.index({ month: 1, pgId: 1 }, { unique: true });

const Settlement: Model<ISettlement> = mongoose.models.Settlement || mongoose.model<ISettlement>('Settlement', SettlementSchema);
export default Settlement;
