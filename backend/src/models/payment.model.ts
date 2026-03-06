import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayment extends Document {
  amount: number;
  userId: mongoose.Types.ObjectId;
  pgId: mongoose.Types.ObjectId;
  date: Date;
  note?: string;
}

const PaymentSchema = new Schema<IPayment>({
  amount: { type: Number, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  pgId: { type: Schema.Types.ObjectId, ref: 'PG', required: true },
  date: { type: Date, default: Date.now },
  note: { type: String },
}, { timestamps: true });

const Payment: Model<IPayment> = mongoose.models.Payment ?? mongoose.model<IPayment>('Payment', PaymentSchema);
export default Payment;
