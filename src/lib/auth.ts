import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

export async function verifyAuth(request: NextRequest): Promise<AuthPayload | null> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    
    const token = authHeader.substring(7);
    const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
    if (!secret) {
      return null;
    }
    const decoded = jwt.verify(token, secret) as AuthPayload;
    
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export function generateToken(payload: AuthPayload): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET or JWT_SECRET must be defined');
  }
  return jwt.sign(payload, secret, { expiresIn: '1d' });
}

export function generateRefreshToken(userId: string): string {
  const secret = process.env.NEXTAUTH_SECRET || process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET or JWT_REFRESH_SECRET must be defined');
  }
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
}

