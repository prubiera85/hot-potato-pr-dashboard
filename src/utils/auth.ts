import type { User } from '../stores/authStore';

/**
 * Initiate GitHub OAuth login
 */
export async function initiateGitHubLogin(): Promise<void> {
  try {
    const response = await fetch('/api/auth-login');
    if (!response.ok) {
      throw new Error('Failed to initiate login');
    }

    const { authUrl } = await response.json();

    // Redirect to GitHub OAuth
    window.location.href = authUrl;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Handle OAuth callback and exchange code for token
 */
export async function handleOAuthCallback(code: string): Promise<{ token: string; user: User }> {
  try {
    const response = await fetch(`/api/auth-callback?code=${code}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Authentication failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('OAuth callback error:', error);
    throw error;
  }
}

/**
 * Verify current session and get user info
 */
export async function verifySession(token: string): Promise<User | null> {
  try {
    const response = await fetch('/api/auth-me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const { user } = await response.json();
    return user;
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

/**
 * Make an authenticated API request
 */
export async function authenticatedFetch(
  url: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
}
