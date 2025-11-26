import type { Context } from '@netlify/functions';
import { requireAuth, createAuthErrorResponse } from './auth/middleware.mts';

/**
 * Get current authenticated user
 * GET /api/auth-me
 * Requires: Authorization: Bearer <token>
 */
export default async (request: Request, context: Context) => {
  try {
    // Verify authentication
    const user = await requireAuth(request);

    // Return user info
    return new Response(
      JSON.stringify({ user }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    return createAuthErrorResponse(error.message);
  }
};
