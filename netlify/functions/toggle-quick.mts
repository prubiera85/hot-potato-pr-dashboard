import type { Context, Config } from "@netlify/functions";
import { getInstallationOctokit } from "./lib/github-auth.mts";

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { owner, repo, prNumber, isQuick } = await req.json();

    if (!owner || !repo || !prNumber || isQuick === undefined) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: owner, repo, prNumber, isQuick",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get Octokit instance for this owner's installation
    const octokit = await getInstallationOctokit(owner);

    // Check if "quick" label exists in the repository
    let quickLabelExists = false;
    try {
      await octokit.rest.issues.getLabel({
        owner,
        repo,
        name: "quick",
      });
      quickLabelExists = true;
    } catch (error: unknown) {
      // Label doesn't exist, create it
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        await octokit.rest.issues.createLabel({
          owner,
          repo,
          name: "quick",
          color: "fbca04", // Yellow color
          description: "This PR is quick to review",
        });
        quickLabelExists = true;
      }
    }

    if (isQuick) {
      // Add the "quick" label
      await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: prNumber,
        labels: ["quick"],
      });
    } else {
      // Remove the "quick" label
      try {
        await octokit.rest.issues.removeLabel({
          owner,
          repo,
          issue_number: prNumber,
          name: "quick",
        });
      } catch (error: unknown) {
        // Ignore if label doesn't exist on the PR
        if (!(error && typeof error === 'object' && 'status' in error && error.status === 404)) {
          throw error;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: isQuick ? "Label 'quick' added" : "Label 'quick' removed",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in toggle-quick function:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to toggle quick label",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const config: Config = {
  path: "/api/toggle-quick",
};
