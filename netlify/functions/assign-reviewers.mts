import type { Context } from "@netlify/functions";
import { getInstallationOctokit } from "./lib/github-auth.mts";

export default async (req: Request, context: Context) => {
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    const { owner, repo, pull_number, reviewers, action } = body;

    if (!owner || !repo || !pull_number || !reviewers || !action) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!["add", "remove"].includes(action)) {
      return new Response(
        JSON.stringify({ error: "Action must be 'add' or 'remove'" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get Octokit instance for this owner's installation
    const octokit = await getInstallationOctokit(owner);

    // Assign or remove reviewers
    if (action === "add") {
      await octokit.rest.pulls.requestReviewers({
        owner,
        repo,
        pull_number,
        reviewers,
      });
    } else {
      await octokit.rest.pulls.removeRequestedReviewers({
        owner,
        repo,
        pull_number,
        reviewers,
      });
    }

    return new Response(
      JSON.stringify({ success: true, action, reviewers }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error managing reviewers:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to manage reviewers",
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
  path: "/api/assign-reviewers",
};
