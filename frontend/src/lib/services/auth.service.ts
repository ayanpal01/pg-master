import connectDB from '../mongoose';
import User from '../models/user.model';

export class AuthService {
  /**
   * Look up a user by their unique key.
   */
  static async getUserByUniqueKey(uniqueKey: string) {
    await connectDB();
    return User.findOne({ uniqueKey, active: true }).populate('pgId');
  }

  static async getUserProfile(uniqueKey: string) {
    await connectDB();
    return User.findOne({ uniqueKey }).populate('pgId');
  }
}
