import jwt from 'jsonwebtoken';

export interface UserPayload {
  login: string;
  id: number;
  avatar_url: string;
  email: string | null;
  name: string | null;
}

export interface JWTPayload extends UserPayload {
  iat: number;
  exp: number;
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: UserPayload): string {
  const secret = Netlify.env.get('JWT_SECRET');

  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  return jwt.sign(user, secret, {
    expiresIn: '7d', // Token expires in 7 days
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JWTPayload {
  const secret = Netlify.env.get('JWT_SECRET');

  if (!secret) {
    throw new Error('JWT_SECRET not configured');
  }

  try {
    return jwt.verify(token, secret) as JWTPayload;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  // Expected format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

/**
 * Check if user is in the allowed users list (if configured)
 */
export function isUserAllowed(login: string): boolean {
  const allowedUsers = Netlify.env.get('ALLOWED_GITHUB_USERS');

  // If no whitelist configured, allow all users
  if (!allowedUsers) {
    return true;
  }

  const allowedList = allowedUsers.split(',').map(u => u.trim().toLowerCase());
  return allowedList.includes(login.toLowerCase());
}
