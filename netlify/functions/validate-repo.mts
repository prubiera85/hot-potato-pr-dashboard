import type { Context } from '@netlify/functions';
import { getInstallationOctokit } from './lib/github-auth.mts';

export default async (req: Request, context: Context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { owner, repo } = await req.json();

    if (!owner || !repo) {
      return new Response(
        JSON.stringify({ error: 'owner and repo are required', valid: false }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Get Octokit instance for this owner's installation
    const octokit = await getInstallationOctokit(owner);

    // Try to access the repository
    try {
      await octokit.rest.repos.get({
        owner,
        repo,
      });

      return new Response(
        JSON.stringify({
          valid: true,
          message: `Successfully validated access to ${owner}/${repo}`,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error: any) {
      let errorMessage = 'Unknown error occurred';
      let errorDetails = '';

      if (error.status === 404) {
        errorMessage = `Repository not found or GitHub App doesn't have access`;
        errorDetails = `Repository: ${owner}/${repo}\n\nPossible reasons:\n1. Repository doesn't exist\n2. GitHub App is not installed for "${owner}"\n3. Repository is not included in the app's access permissions\n\nPlease ensure:\n- The GitHub App is installed for "${owner}"\n- The repository is selected in the app's repository access settings`;
      } else if (error.status === 403) {
        errorMessage = `Access forbidden`;
        errorDetails = `Repository: ${owner}/${repo}\n\nThe GitHub App doesn't have permission to access this repository.\n\nPlease check:\n- The app has the required permissions\n- The repository is selected in the app's access settings`;
      } else if (error.message) {
        errorMessage = error.message;
        errorDetails = `Repository: ${owner}/${repo}\n\nError: ${error.message}`;
      }

      return new Response(
        JSON.stringify({
          valid: false,
          error: errorMessage,
          details: errorDetails,
        }),
        {
          status: 200, // Return 200 even for validation failures
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error: any) {
    console.error('Error in validate-repo function:', error);

    // Handle installation not found errors specially
    if (error.message && error.message.includes('not installed')) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: error.message,
          details: error.message,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: 'Failed to validate repository',
        details: error.message || String(error),
        valid: false,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
