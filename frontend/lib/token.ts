import { jwtVerify } from 'jose';

export type AuthPayload = {
  sub?: string | number;
  username?: string;
  role?: string;
  email?: string;
  name?: string;
};

const rawSecret =
  process.env.AUTH_JWT_SECRET ||
  process.env.JWT_SECRET ||
  'dev-secret';

const encoder = new TextEncoder();
const secretKey = encoder.encode(rawSecret);

export async function decodeAuthToken(token?: string | null): Promise<AuthPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as AuthPayload;
  } catch {
    return null;
  }
}
