import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '24h';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in .env');
}

const key = new TextEncoder().encode(JWT_SECRET);

export interface JwtPayload {
  uid: string;
  iat: number;
  exp: number;
}

export async function signToken(uid: string): Promise<string> {
  return new SignJWT({ uid })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(key);
}

export async function verifyToken(token: string): Promise<JwtPayload> {
  const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
  return payload as unknown as JwtPayload;
}
