import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../lib/jwt';
import { connectDB } from '../lib/db';
import User from '../models/user.model';
import { IUser } from '../models/user.model';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
  uid?: string;
}

function clearSessionCookie(res: Response) {
  res.clearCookie('session', { path: '/', sameSite: 'none', secure: true });
  res.clearCookie('session', { path: '/', sameSite: 'lax' });
}

/**
 * Validates the JWT from the httpOnly cookie and attaches the DB user to the request.
 */
export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.cookies?.session as string | undefined;

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: no session cookie' });
    return;
  }

  let payload: JwtPayload;
  try {
    payload = await verifyToken(token);
  } catch {
    clearSessionCookie(res);
    res.status(401).json({ error: 'Session expired or invalid' });
    return;
  }

  try {
    await connectDB();
    const user = await User.findOne({ uniqueKey: payload.uid, active: true }).populate('pgId');
    if (!user) {
      clearSessionCookie(res);
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }
    
    // Attach user to request for route handlers
    req.user = user;
    req.uid = payload.uid;
    next();
  } catch (err) {
    console.error('[authMiddleware] DB error:', err);
    clearSessionCookie(res);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Requires the authenticated user to have one of the specified roles.
 */
export function requireRole(...roles: Array<'MANAGER' | 'MEMBER'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: 'Forbidden: insufficient role' });
      return;
    }
    next();
  };
}
