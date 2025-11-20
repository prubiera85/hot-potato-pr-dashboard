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
            const enhancedPRs = await Promise.all(
              pulls.map(async (pr) => {
                const hoursOpen = (Date.now() - new Date(pr.created_at).getTime()) / (1000 * 60 * 60);

                // Get PR details which includes accurate comment counts and updated assignees/reviewers
                let issueComments = 0;
                let reviewComments = 0;
                let assignees = pr.assignees || [];
                let requested_reviewers = pr.requested_reviewers || [];
                let requested_teams = pr.requested_teams || [];
                let allReviewers: any[] = [];

                try {
                  const { data: prDetails } = await octokit.rest.pulls.get({
                    owner: repo.owner,
                    repo: repo.name,
                    pull_number: pr.number,
                  });
                  issueComments = prDetails.comments || 0; // General conversation comments
                  reviewComments = prDetails.review_comments || 0; // Code review comments
                  // Use the fresh data from the detailed call
                  assignees = prDetails.assignees || [];
                  requested_reviewers = prDetails.requested_reviewers || [];
                  requested_teams = prDetails.requested_teams || [];

                  // Get reviews to include reviewers who already reviewed
                  try {
                    const { data: reviews } = await octokit.rest.pulls.listReviews({
                      owner: repo.owner,
                      repo: repo.name,
                      pull_number: pr.number,
                    });

                    // Combine all reviewers: requested + those who already reviewed
                    const reviewersMap = new Map();

                    // Add requested reviewers
                    requested_reviewers.forEach(reviewer => {
                      reviewersMap.set(reviewer.id, reviewer);
                    });

                    // Add reviewers who have already submitted reviews
                    reviews.forEach(review => {
                      if (review.user && review.user.id) {
                        reviewersMap.set(review.user.id, review.user);
                      }
                    });

                    allReviewers = Array.from(reviewersMap.values());
                  } catch (reviewError) {
                    console.error(`Error fetching reviews for PR #${pr.number}:`, reviewError);
                    // Fallback to just requested reviewers
                    allReviewers = requested_reviewers;
                  }
                } catch (error) {
                  console.error(`Error fetching PR details for #${pr.number}:`, error);
                  // Fallback to list data
                  issueComments = pr.comments || 0;
                  reviewComments = pr.review_comments || 0;
                  allReviewers = requested_reviewers;
                }

                const commentCount = issueComments + reviewComments;
                const reviewerCount = allReviewers.length + requested_teams.length;
                const missingAssignee = assignees.length === 0;
                const missingReviewer = reviewerCount === 0;
                const isUrgent = pr.labels?.some((label) => label.name.toLowerCase() === "urgent") || false;
                const isQuick = pr.labels?.some((label) => label.name.toLowerCase() === "quick") || false;

                // Calculate status
                let status: "ok" | "warning" | "overdue" = "ok";
                const hasAssignee = assignees.length > 0;

                // If has assignee, status is always OK
                if (hasAssignee) {
                  status = "ok";
                } else if (hoursOpen >= config.assignmentTimeLimit) {
                  // Time limit exceeded without assignee - warning (yellow)
                  status = "warning";
                }

                return {
                  ...pr,
                  assignees, // Explicitly set assignees from detailed PR data
                  requested_reviewers: allReviewers, // All reviewers (requested + already reviewed)
                  requested_teams, // Teams requested for review
                  status,
                  hoursOpen,
                  missingAssignee,
                  missingReviewer,
                  reviewerCount,
                  commentCount,
                  issueComments,
                  reviewComments,
                  isUrgent,
                  isQuick,
                  repo: {
                    owner: repo.owner,
                    name: repo.name,
                  },
                };
              })
            );

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
