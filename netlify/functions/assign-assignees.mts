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
    const { owner, repo, pull_number, assignees, action } = body;

    if (!owner || !repo || !pull_number || !assignees || !action) {
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

    // Assign or remove assignees
    if (action === "add") {
      await octokit.rest.issues.addAssignees({
        owner,
        repo,
        issue_number: pull_number,
        assignees,
      });
    } else {
      await octokit.rest.issues.removeAssignees({
        owner,
        repo,
        issue_number: pull_number,
        assignees,
      });
    }

    return new Response(
      JSON.stringify({ success: true, action, assignees }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error managing assignees:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to manage assignees",
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
  path: "/api/assign-assignees",
};
