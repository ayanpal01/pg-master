import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongoose';
import User from '@/lib/models/user.model';
import { getSession } from './session';

export async function verifyAuth(req: NextRequest) {
  let uniqueKey: string | null = null;

  try {
    const session = await getSession();
    if (session && session.uid) {
      uniqueKey = session.uid;
    }
  } catch (error) {
    console.error('Session decryption failed:', error);
  }

  if (!uniqueKey) return null;

  try {
    console.log('[auth-util] Connecting to database for session verification...');
    await connectDB();
    console.log('[auth-util] Looking up user with uniqueKey:', uniqueKey);
    const user = await User.findOne({ uniqueKey });
    
    if (!user) {
      console.warn('[auth-util] No user found in database for uniqueKey:', uniqueKey);
    }
    
    return {
      uid: uniqueKey,
      dbUser: user
    };
  } catch (error: any) {
    console.error('[auth-util] Auth verification database error:', error.message || error);
    return null;
  }
}

export function rolesGuard(user: any, allowedRoles: string[]) {
  if (!user || !allowedRoles.includes(user.role)) {
    return false;
  }
  return true;
}
