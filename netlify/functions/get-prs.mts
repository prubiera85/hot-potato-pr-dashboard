import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";
import { getInstallationOctokit } from "./lib/github-auth.mts";

export default async (req: Request, context: Context) => {
  try {
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
    const errors: Record<string, string> = {};

    // Group repositories by owner to reuse Octokit instances
    const reposByOwner = new Map<string, typeof config.repositories>();
    for (const repo of config.repositories) {
      if (!repo.enabled) continue;

      const repos = reposByOwner.get(repo.owner) || [];
      repos.push(repo);
      reposByOwner.set(repo.owner, repos);
    }

    // Process repositories by owner
    for (const [owner, repos] of reposByOwner.entries()) {
      try {
        // Get Octokit instance for this owner's installation
        const octokit = await getInstallationOctokit(owner);

        for (const repo of repos) {
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
              const commentCount = pr.comments || 0;
              const missingAssignee = !pr.assignees || pr.assignees.length === 0;
              const missingReviewer = reviewerCount === 0;
              const isUrgent = pr.labels?.some((label) => label.name.toLowerCase() === "urgent") || false;
              const isQuick = pr.labels?.some((label) => label.name.toLowerCase() === "quick") || false;

              // Calculate status
              let status: "ok" | "warning" | "overdue" = "ok";
              if (!missingAssignee) {
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
                commentCount,
                isUrgent,
                isQuick,
                repo: {
                  owner: repo.owner,
                  name: repo.name,
                },
              };
            });

            allPRs.push(...enhancedPRs);
          } catch (error) {
            const repoName = `${repo.owner}/${repo.name}`;
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error fetching PRs from ${repoName}:`, error);
            errors[repoName] = errorMessage;
            // Continue with other repos even if one fails
          }
        }
      } catch (error) {
        // Error getting Octokit for this owner
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error authenticating for owner ${owner}:`, error);

        // Mark all repos for this owner as errored
        for (const repo of repos) {
          const repoName = `${repo.owner}/${repo.name}`;
          errors[repoName] = errorMessage;
        }
      }
    }

    return new Response(JSON.stringify({ prs: allPRs, config, errors: Object.keys(errors).length > 0 ? errors : undefined }), {
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
