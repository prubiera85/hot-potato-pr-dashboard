import type { Context } from '@netlify/functions';
import { extractTokenFromHeader, verifyToken, type JWTPayload } from './jwt.mts';

export interface AuthenticatedContext extends Context {
  user: JWTPayload;
}

/**
 * Middleware to verify JWT token and attach user to context
 * Usage: const user = await requireAuth(request);
 */
export async function requireAuth(request: Request): Promise<JWTPayload> {
  const authHeader = request.headers.get('Authorization');
  const token = extractTokenFromHeader(authHeader || '');

  if (!token) {
    throw new Error('No authentication token provided');
  }

  try {
    const user = verifyToken(token);
    return user;
  } catch (error: any) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
}

/**
 * Helper to create authenticated error responses
 */
export function createAuthErrorResponse(message: string, status: number = 401) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
