import type { Context } from '@netlify/functions';

/**
 * Initiates the GitHub OAuth flow
 * GET /api/auth-login
 */
export default async (request: Request, context: Context) => {
  const clientId = Netlify.env.get('GITHUB_APP_CLIENT_ID');

  if (!clientId) {
    return new Response(
      JSON.stringify({ error: 'GitHub OAuth not configured' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // Get the current URL to determine callback URL
  const url = new URL(request.url);
  const protocol = url.protocol;
  const host = url.host;

  // Callback URL for local dev vs production
  const callbackUrl = `${protocol}//${host}/auth/callback`;

  // Build GitHub OAuth authorization URL
  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubAuthUrl.searchParams.set('client_id', clientId);
  githubAuthUrl.searchParams.set('redirect_uri', callbackUrl);
  githubAuthUrl.searchParams.set('scope', 'read:user user:email');
  githubAuthUrl.searchParams.set('state', crypto.randomUUID()); // CSRF protection

  // Redirect to GitHub OAuth
  return new Response(
    JSON.stringify({
      authUrl: githubAuthUrl.toString(),
      callbackUrl
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
