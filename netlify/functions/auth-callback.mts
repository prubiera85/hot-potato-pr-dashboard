import type { Context } from '@netlify/functions';
import { generateToken, isUserAllowed, getUserRole, type UserPayload } from './auth/jwt.mts';

/**
 * Handles GitHub OAuth callback
 * GET /api/auth-callback?code=xxx
 */
export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  // Check for OAuth errors
  if (error) {
    return new Response(
      JSON.stringify({ error: `GitHub OAuth error: ${error}` }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  if (!code) {
    return new Response(
      JSON.stringify({ error: 'No authorization code provided' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const clientId = Netlify.env.get('GITHUB_APP_CLIENT_ID');
  const clientSecret = Netlify.env.get('GITHUB_APP_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    return new Response(
      JSON.stringify({ error: 'GitHub OAuth not configured' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Step 1: Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error);
    }

    const accessToken = tokenData.access_token;

    // Step 2: Get user information from GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user information');
    }

    const githubUser = await userResponse.json();

    // Step 3: Check if user is allowed (if whitelist is configured)
    if (!isUserAllowed(githubUser.login)) {
      return new Response(
        JSON.stringify({
          error: 'Access denied',
          message: `User ${githubUser.login} is not in the allowed users list`,
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Step 4: Get user role based on configuration
    const role = getUserRole(githubUser.login);

    // Step 5: Create user payload
    const user: UserPayload = {
      login: githubUser.login,
      id: githubUser.id,
      avatar_url: githubUser.avatar_url,
      email: githubUser.email,
      name: githubUser.name,
      role,
    };

    // Step 6: Generate JWT token
    const token = generateToken(user);

    // Step 7: Return token and user info
    return new Response(
      JSON.stringify({
        token,
        user,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    return new Response(
      JSON.stringify({
        error: 'Authentication failed',
        message: error.message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
