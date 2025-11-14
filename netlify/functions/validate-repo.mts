import type { Context } from '@netlify/functions';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

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

    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_PRIVATE_KEY;
    const installationId = process.env.GITHUB_INSTALLATION_ID;

    if (!appId || !privateKey || !installationId) {
      return new Response(
        JSON.stringify({
          error: 'GitHub App not configured',
          valid: false,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Format private key (handle \n as literal string)
    let formattedPrivateKey = privateKey;
    if (!privateKey.includes('\n') && privateKey.includes('\\n')) {
      formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
    }

    // Create authenticated Octokit instance
    const octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId,
        privateKey: formattedPrivateKey,
        installationId,
      },
    });

    // Try to get repository info
    try {
      const { data } = await octokit.repos.get({
        owner,
        repo,
      });

      return new Response(
        JSON.stringify({
          valid: true,
          message: `✅ Repositorio accesible: ${data.full_name}`,
          private: data.private,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (repoError: any) {
      let errorMessage = 'Error al acceder al repositorio';

      if (repoError.status === 404) {
        errorMessage = `❌ El repositorio "${owner}/${repo}" no existe o la GitHub App no tiene acceso. Verifica que:\n1. El repositorio existe\n2. La GitHub App está instalada en este repositorio`;
      } else if (repoError.status === 403) {
        errorMessage = `🔒 No tienes permisos para acceder a "${owner}/${repo}". Instala la GitHub App en este repositorio.`;
      } else {
        errorMessage = `⚠️ Error al validar "${owner}/${repo}": ${repoError.message}`;
      }

      return new Response(
        JSON.stringify({
          valid: false,
          error: errorMessage,
        }),
        {
          status: 200, // Return 200 so the frontend can handle the validation error
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error: any) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({
        error: 'Error interno al validar repositorio',
        valid: false,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
