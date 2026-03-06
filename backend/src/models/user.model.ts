import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  phoneNumber?: string;
  uniqueKey: string;
  pgId: mongoose.Types.ObjectId | null;
  role: 'MANAGER' | 'MEMBER';
  active: boolean;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true, unique: true },
  uniqueKey: { type: String, required: true, unique: true },
  pgId: { type: Schema.Types.ObjectId, ref: 'PG', default: null },
  role: { type: String, enum: ['MANAGER', 'MEMBER'], default: 'MEMBER' },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const User: Model<IUser> = mongoose.models.User ?? mongoose.model<IUser>('User', UserSchema);
export default User;
