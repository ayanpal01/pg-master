import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPG extends Document {
  name: string;
  managerId: mongoose.Types.ObjectId;
  mealTypes: string[];
  cookingChargePerUser: Map<string, number>;
  active: boolean;
  createdAt: Date;
}

const PGSchema: Schema = new Schema({
  name: { type: String, required: true },
  managerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  mealTypes: { type: [String], default: ['Breakfast', 'Lunch', 'Dinner'] },
  cookingChargePerUser: { 
    type: Map, 
    of: Number, 
    default: new Map() 
  },
  active: { type: Boolean, default: true },
}, { timestamps: true });

const PG: Model<IPG> = mongoose.models.PG || mongoose.model<IPG>('PG', PGSchema);
export default PG;
