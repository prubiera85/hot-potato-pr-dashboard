import type { Context, Config } from "@netlify/functions";
import { Octokit } from "octokit";
import { createAppAuth } from "@octokit/auth-app";
import { getStore } from "@netlify/blobs";

export default async (req: Request, context: Context) => {
  try {
    // Get GitHub App credentials from environment
    const appId = Netlify.env.get("GITHUB_APP_ID");
    const privateKey = Netlify.env.get("GITHUB_APP_PRIVATE_KEY");
    const installationId = Netlify.env.get("GITHUB_APP_INSTALLATION_ID");

    if (!appId || !privateKey || !installationId) {
      return new Response(
        JSON.stringify({
          error: "GitHub App not configured. Please set GITHUB_APP_ID, GITHUB_APP_PRIVATE_KEY, and GITHUB_APP_INSTALLATION_ID environment variables.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize Octokit with App authentication
    const octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId,
        privateKey: privateKey.replace(/\\n/g, "\n"),
        installationId,
      },
    });

    // Get configuration from Netlify Blobs
    const configStore = getStore("pr-dashboard-config");
    const configData = await configStore.get("config", { type: "json" });

    const defaultConfig = {
      assignmentTimeLimit: 4,
      warningThreshold: 80,
      repositories: [],
    };

    const config = configData || defaultConfig;

    // Fetch PRs from all configured repositories
    const allPRs = [];

    for (const repo of config.repositories) {
      if (!repo.enabled) continue;

      try {
        const { data: pulls } = await octokit.rest.pulls.list({
          owner: repo.owner,
          repo: repo.name,
          state: "open",
          per_page: 100,
        });

        // Enhance each PR with computed metadata
        const enhancedPRs = pulls.map((pr) => {
          const hoursOpen = (Date.now() - new Date(pr.created_at).getTime()) / (1000 * 60 * 60);
          const reviewerCount = pr.requested_reviewers?.length || 0;
          const missingAssignee = !pr.assignees || pr.assignees.length === 0;
          const missingReviewer = reviewerCount === 0;
          const isUrgent = pr.labels?.some((label) => label.name.toLowerCase() === "urgent") || false;

          // Calculate status
          let status: "ok" | "warning" | "overdue" = "ok";
          if (missingAssignee || missingReviewer) {
            if (hoursOpen >= config.assignmentTimeLimit) {
              status = "overdue";
            } else if ((hoursOpen / config.assignmentTimeLimit) * 100 >= config.warningThreshold) {
              status = "warning";
            }
          }

          return {
            ...pr,
            status,
            hoursOpen,
            missingAssignee,
            missingReviewer,
            reviewerCount,
            isUrgent,
            repo: {
              owner: repo.owner,
              name: repo.name,
            },
          };
        });

        allPRs.push(...enhancedPRs);
      } catch (error) {
        console.error(`Error fetching PRs from ${repo.owner}/${repo.name}:`, error);
        // Continue with other repos even if one fails
      }
    }

    return new Response(JSON.stringify({ prs: allPRs, config }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in get-prs function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch PRs", details: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const config: Config = {
  path: "/api/prs",
};
