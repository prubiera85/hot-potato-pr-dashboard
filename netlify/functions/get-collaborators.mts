import type { Context } from "@netlify/functions";
import { getInstallationOctokit } from "./lib/github-auth.mts";

export default async (req: Request, context: Context) => {
  try {
    const url = new URL(req.url);
    const owner = url.searchParams.get("owner");
    const repo = url.searchParams.get("repo");

    if (!owner || !repo) {
      return new Response(
        JSON.stringify({ error: "Missing owner or repo parameter" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get Octokit instance for this owner's installation
    const octokit = await getInstallationOctokit(owner);

    // Fetch multiple sources to match GitHub's UI
    const [collaboratorsResult, contributorsResult, orgMembersResult] = await Promise.allSettled([
      // Repository collaborators
      octokit.rest.repos.listCollaborators({
        owner,
        repo,
        per_page: 100,
      }),
      // Repository contributors
      octokit.rest.repos.listContributors({
        owner,
        repo,
        per_page: 100,
      }),
      // Organization members (if the owner is an organization)
      octokit.rest.orgs.listMembers({
        org: owner,
        per_page: 100,
      }),
    ]);

    const collaborators = collaboratorsResult.status === 'fulfilled' ? collaboratorsResult.value.data : [];
    const contributors = contributorsResult.status === 'fulfilled' ? contributorsResult.value.data : [];
    const orgMembers = orgMembersResult.status === 'fulfilled' ? orgMembersResult.value.data : [];

    // Users to exclude
    const excludedUsers = ['jmoratilla', 'torresrodrigoe', 'silvap-javier', 'robertoOneclick'];

    // Merge and deduplicate users by ID
    const userMap = new Map();

    [...collaborators, ...contributors, ...orgMembers].forEach((user) => {
      if (user.type === 'User' && !excludedUsers.includes(user.login)) { // Exclude bots and specific users
        userMap.set(user.id, {
          id: user.id,
          login: user.login,
          avatar_url: user.avatar_url,
        });
      }
    });

    // Return simplified collaborator data sorted by login
    const simplifiedCollaborators = Array.from(userMap.values()).sort((a, b) =>
      a.login.localeCompare(b.login)
    );

    return new Response(JSON.stringify(simplifiedCollaborators), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error fetching collaborators:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch collaborators",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const config = {
  path: "/api/collaborators",
};
