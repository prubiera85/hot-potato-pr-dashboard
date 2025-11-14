import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

const defaultConfig = {
  assignmentTimeLimit: 4,
  warningThreshold: 80,
  repositories: [],
};

export default async (req: Request, context: Context) => {
  const configStore = getStore("pr-dashboard-config");

  try {
    if (req.method === "GET") {
      // Get configuration
      const config = await configStore.get("config", { type: "json" });
      return new Response(JSON.stringify(config || defaultConfig), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (req.method === "POST") {
      // Update configuration
      const newConfig = await req.json();

      // Validate configuration
      if (typeof newConfig.assignmentTimeLimit !== "number" || newConfig.assignmentTimeLimit <= 0) {
        return new Response(
          JSON.stringify({
            error: "Invalid assignmentTimeLimit. Must be a positive number.",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (
        typeof newConfig.warningThreshold !== "number" ||
        newConfig.warningThreshold < 0 ||
        newConfig.warningThreshold > 100
      ) {
        return new Response(
          JSON.stringify({
            error: "Invalid warningThreshold. Must be a number between 0 and 100.",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      if (!Array.isArray(newConfig.repositories)) {
        return new Response(
          JSON.stringify({
            error: "Invalid repositories. Must be an array.",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Validate each repository
      for (const repo of newConfig.repositories) {
        if (!repo.owner || !repo.name || typeof repo.enabled !== "boolean") {
          return new Response(
            JSON.stringify({
              error: "Invalid repository format. Each repository must have owner, name, and enabled properties.",
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      }

      // Save configuration
      await configStore.setJSON("config", newConfig);

      return new Response(
        JSON.stringify({ success: true, config: newConfig }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in config function:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to handle configuration",
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
  path: "/api/config",
};
