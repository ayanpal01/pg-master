import mongoose from 'mongoose';

// ─── Domain Types ──────────────────────────────────────────────────────────────

export interface IAttendanceRecord {
  userId: mongoose.Types.ObjectId;
  mealType: string;
  status: boolean;
  memberProposedStatus?: boolean;
}

export interface PopulatedUser {
  _id: mongoose.Types.ObjectId;
  name: string;
  role?: 'MANAGER' | 'MEMBER';
}

// ─── Request body types ────────────────────────────────────────────────────────

export interface LoginBody {
  uniqueKey: string;
}

export interface CreatePGBody {
  name: string;
  mealTypes: string[];
  managerName: string;
  phoneNumber: string;
}

export interface AttendanceRecordInput {
  userId: string;
  mealType: string;
  status: boolean;
}

export interface ToggleMealBody {
  toggle: true;
  mealType: string;
  status: boolean;
}

export interface SetAttendanceBody {
  date: string;
  records: AttendanceRecordInput[];
}

export type AttendanceBody = ToggleMealBody | SetAttendanceBody;

export interface AddExpenseBody {
  amount: number;
  description: string;
  date: string;
  spentBy?: string;
}

export interface UpdateExpenseStatusBody {
  expenseId: string;
  status: 'APPROVED' | 'REJECTED';
}

export interface AddPaymentBody {
  userId: string;
  amount: number;
  note?: string;
  date?: string;
}

export interface UpdatePaymentBody {
  amount?: number;
  note?: string;
}

export interface UpdateExpenseBody {
  amount?: number;
  description?: string;
  date?: string;
  spentBy?: string;
}

export interface AddMemberBody {
  name: string;
  phoneNumber: string;
}

export interface ResetMemberKeyBody {
  userId: string;
}

export interface UpdatePGBody {
  cookingChargePerUser?: Record<string, number>;
}

export interface FinalizeMonthBody {
  month: string;
  mealCharge: number;
  totalMeals: number;
  totalExpenses: number;
}

// ─── Stats response types ──────────────────────────────────────────────────────

export interface MonthlyStatsResponse {
  attendance: mongoose.Document[];
  expenses: mongoose.Document[];
  payments: mongoose.Document[];
  members: mongoose.Document[];
  savedStat: mongoose.Document | null;
  pg: mongoose.Document | null;
}
