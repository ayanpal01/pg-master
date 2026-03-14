import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayment extends Document {
  amount: number;
  userId: mongoose.Types.ObjectId;
  pgId: mongoose.Types.ObjectId;
  date: Date;
  note?: string;
}

const PaymentSchema: Schema = new Schema({
  amount: { type: Number, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  pgId: { type: Schema.Types.ObjectId, ref: 'PG', required: true },
  date: { type: Date, default: Date.now },
  note: { type: String }
}, { timestamps: true });

// Force-clear the model in development to handle schema changes correctly
if (process.env.NODE_ENV !== 'production' && mongoose.models.Payment) {
  delete (mongoose.models as any).Payment;
}

const Payment: Model<IPayment> = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
export default Payment;
