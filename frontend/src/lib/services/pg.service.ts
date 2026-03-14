import connectDB from '../mongoose';
import PG from '../models/pg.model';
import User from '../models/user.model';
import mongoose from 'mongoose';
import { generateUniqueKey } from '../utils/keygen';

export class PGService {
  /**
   * Creates a new PG and sets the user as MANAGER.
   */
  static async createPG(managerName: string, managerPhone: string, pgName: string, mealTypes: string[]) {
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
        managerId: managerId,
        active: true
      });

      const manager = new User({
        _id: managerId,
        name: managerName,
        phoneNumber: managerPhone,
        uniqueKey: managerKey,
        pgId: pgId,
        role: 'MANAGER',
        active: true
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

  /**
   * Transfers admin (MANAGER) rights from current manager to a member.
   */
  static async transferAdmin(pgId: string, currentManagerUid: string, newManagerId: string) {
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

      // Perform atomic switch
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

  /**
   * Adds a new member to a PG.
   */
  static async addMember(pgId: string, name: string, phoneNumber: string) {
    await connectDB();
    const uniqueKey = generateUniqueKey();
    
    const newMember = new User({
      name,
      phoneNumber,
      uniqueKey,
      pgId,
      role: 'MEMBER',
      active: true
    });

    await newMember.save();
    return newMember;
  }

  /**
   * Regenerates a new unique key for a member by a manager.
   */
  static async resetMemberKey(pgId: string, managerUid: string, userId: string) {
    await connectDB();
    
    // Authorization check
    const manager = await User.findOne({ uniqueKey: managerUid, pgId, role: 'MANAGER' });
    if (!manager) throw new Error('Unauthorized/Forbidden');

    const member = await User.findOne({ _id: userId, pgId });
    if (!member) throw new Error('Member not found in this PG');

    const newKey = generateUniqueKey();
    member.uniqueKey = newKey;
    await member.save();

    return newKey;
  }

  static async updatePGSettings(pgId: string, managerUid: string, settings: { cookingChargePerUser?: Record<string, number> }) {
    await connectDB();
    const manager = await User.findOne({ uniqueKey: managerUid, pgId, role: 'MANAGER' });
    if (!manager) throw new Error('Unauthorized');

    const pg = await PG.findById(pgId);
    if (!pg) throw new Error('PG not found');

    if (settings.cookingChargePerUser) {
      // mongoose Map update
      for (const [userId, amount] of Object.entries(settings.cookingChargePerUser)) {
        pg.cookingChargePerUser.set(userId, amount);
      }
    }

    return pg.save();
  }
}
