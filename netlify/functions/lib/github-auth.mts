import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

// Cache for installation IDs to avoid repeated API calls
const installationCache = new Map<string, { id: number; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get the Octokit instance authenticated as the GitHub App
 */
export function getAppOctokit(): Octokit {
  const appId = Netlify.env.get('GITHUB_APP_ID');
  const privateKey = Netlify.env.get('GITHUB_APP_PRIVATE_KEY');

  if (!appId || !privateKey) {
    throw new Error('GitHub App credentials not configured');
  }

  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey: formattedPrivateKey,
    },
  });
}

/**
 * Get the installation ID for a specific owner (user or organization)
 * This allows the app to work with multiple installations simultaneously
 */
export async function getInstallationIdForOwner(owner: string): Promise<number> {
  // Check cache first
  const cached = installationCache.get(owner);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.id;
  }

  const octokit = getAppOctokit();

  try {
    // List all installations for this app
    const { data: installations } = await octokit.apps.listInstallations();

    // Find the installation that matches the owner
    const installation = installations.find(
      (inst) => inst.account?.login.toLowerCase() === owner.toLowerCase()
    );

    if (!installation) {
      throw new Error(
        `GitHub App is not installed for owner "${owner}". ` +
        `Please install the app at: https://github.com/apps/YOUR_APP_NAME/installations/new`
      );
    }

    // Cache the result
    installationCache.set(owner, {
      id: installation.id,
      expiresAt: Date.now() + CACHE_TTL,
    });

    return installation.id;
  } catch (error: any) {
    if (error.status === 404) {
      throw new Error(
        `GitHub App is not installed for owner "${owner}". ` +
        `Please install the app first.`
      );
    }
    throw error;
  }
}

/**
 * Get an Octokit instance authenticated for a specific installation
 */
export async function getInstallationOctokit(owner: string): Promise<Octokit> {
  const appId = Netlify.env.get('GITHUB_APP_ID');
  const privateKey = Netlify.env.get('GITHUB_APP_PRIVATE_KEY');

  if (!appId || !privateKey) {
    throw new Error('GitHub App credentials not configured');
  }

  const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
  const installationId = await getInstallationIdForOwner(owner);

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      appId,
      privateKey: formattedPrivateKey,
      installationId,
    },
  });
}
