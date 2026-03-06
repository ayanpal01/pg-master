import { connectDB } from '../lib/db';
import PG, { IPG } from '../models/pg.model';
import User, { IUser } from '../models/user.model';
import mongoose from 'mongoose';
import { generateUniqueKey } from '../lib/keygen';

interface CreatePGResult {
  pg: IPG;
  manager: IUser;
  managerKey: string;
}

export class PGService {
  static async createPG(
    managerName: string,
    managerPhone: string,
    pgName: string,
    mealTypes: string[]
  ): Promise<CreatePGResult> {
    await connectDB();
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const managerKey = generateUniqueKey();
      const pgId = new mongoose.Types.ObjectId();
      const managerId = new mongoose.Types.ObjectId();

      const newPG = new PG({
        _id: pgId,
        name: pgName,
        mealTypes,
        managerId,
        active: true,
      });

      const manager = new User({
        _id: managerId,
        name: managerName,
        phoneNumber: managerPhone,
        uniqueKey: managerKey,
        pgId,
        role: 'MANAGER',
        active: true,
      });

      await newPG.save({ session });
      await manager.save({ session });
      await session.commitTransaction();

      return { pg: newPG, manager, managerKey };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async addMember(pgId: string, name: string, phoneNumber: string): Promise<IUser> {
    await connectDB();
    const uniqueKey = generateUniqueKey();
    const newMember = new User({ name, phoneNumber, uniqueKey, pgId, role: 'MEMBER', active: true });
    await newMember.save();
    return newMember;
  }

  static async resetMemberKey(pgId: string, managerUid: string, userId: string): Promise<string> {
    await connectDB();
    const manager = await User.findOne({ uniqueKey: managerUid, pgId, role: 'MANAGER' });
    if (!manager) throw new Error('Unauthorized/Forbidden');

    const member = await User.findOne({ _id: userId, pgId });
    if (!member) throw new Error('Member not found in this PG');

    const newKey = generateUniqueKey();
    member.uniqueKey = newKey;
    await member.save();
    return newKey;
  }

  static async updatePGSettings(
    pgId: string,
    managerUid: string,
    settings: { cookingChargePerUser?: Record<string, number> }
  ): Promise<IPG> {
    await connectDB();
    const manager = await User.findOne({ uniqueKey: managerUid, pgId, role: 'MANAGER' });
    if (!manager) throw new Error('Unauthorized');

    const pg = await PG.findById(pgId);
    if (!pg) throw new Error('PG not found');

    if (settings.cookingChargePerUser) {
      for (const [userId, amount] of Object.entries(settings.cookingChargePerUser)) {
        pg.cookingChargePerUser.set(userId, amount);
      }
    }
    return pg.save();
  }

  static async transferAdmin(pgId: string, currentManagerUid: string, newManagerId: string): Promise<boolean> {
    await connectDB();
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const pg = await PG.findById(pgId).session(session);
      if (!pg) throw new Error('PG not found');

      const currentManager = await User.findOne({ uniqueKey: currentManagerUid }).session(session);
      if (!currentManager || currentManager.role !== 'MANAGER' || currentManager.pgId?.toString() !== pgId) {
        throw new Error('Unauthorized');
      }

      const newManager = await User.findById(newManagerId).session(session);
      if (!newManager || newManager.pgId?.toString() !== pgId) {
        throw new Error('New manager must be a member of the same PG');
      }

      currentManager.role = 'MEMBER';
      newManager.role = 'MANAGER';
      pg.managerId = newManager._id as mongoose.Types.ObjectId;

      await currentManager.save({ session });
      await newManager.save({ session });
      await pg.save({ session });
      await session.commitTransaction();
      return true;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
