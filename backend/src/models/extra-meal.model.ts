import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IExtraMeal extends Document {
  userId: mongoose.Types.ObjectId;
  pgId: mongoose.Types.ObjectId;
  month: string; // Format: "YYYY-MM"
  count: number;
}

const ExtraMealSchema = new Schema<IExtraMeal>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  pgId: { type: Schema.Types.ObjectId, ref: 'PG', required: true },
  month: { type: String, required: true },
  count: { type: Number, required: true, default: 0 },
}, { timestamps: true });

ExtraMealSchema.index({ userId: 1, pgId: 1, month: 1 }, { unique: true });

const ExtraMeal: Model<IExtraMeal> = mongoose.models.ExtraMeal ?? mongoose.model<IExtraMeal>('ExtraMeal', ExtraMealSchema);
export default ExtraMeal;
