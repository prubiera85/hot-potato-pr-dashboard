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
    const { owner, repo, prNumber, isUrgent } = await req.json();

    if (!owner || !repo || !prNumber || isUrgent === undefined) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: owner, repo, prNumber, isUrgent",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get Octokit instance for this owner's installation
    const octokit = await getInstallationOctokit(owner);

    // Check if "urgent" label exists in the repository
    let urgentLabelExists = false;
    try {
      await octokit.rest.issues.getLabel({
        owner,
        repo,
        name: "urgent",
      });
      urgentLabelExists = true;
    } catch (error: unknown) {
      // Label doesn't exist, create it
      if (error && typeof error === 'object' && 'status' in error && error.status === 404) {
        await octokit.rest.issues.createLabel({
          owner,
          repo,
          name: "urgent",
          color: "d73a4a", // Red color
          description: "This PR requires immediate attention",
        });
        urgentLabelExists = true;
      }
    }

    if (isUrgent) {
      // Add the "urgent" label
      await octokit.rest.issues.addLabels({
        owner,
        repo,
        issue_number: prNumber,
        labels: ["urgent"],
      });
    } else {
      // Remove the "urgent" label
      try {
        await octokit.rest.issues.removeLabel({
          owner,
          repo,
          issue_number: prNumber,
          name: "urgent",
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
        message: isUrgent ? "Label 'urgent' added" : "Label 'urgent' removed",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in toggle-urgent function:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to toggle urgent label",
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
  path: "/api/toggle-urgent",
};
