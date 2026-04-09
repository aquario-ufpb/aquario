import { z } from "zod";
import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { errorResponses } from "../common-schemas";

/**
 * Miscellaneous endpoints that don't fit into any specific resource group:
 * health check, file upload, and static content image serving.
 *
 * These are registered together to avoid creating three separate files for
 * one endpoint each. Upload and content-images will be added in later commits
 * of this PR.
 */

const healthResponseSchema = z
  .object({
    status: z.literal("ok").openapi({
      description: "Service health indicator. Always 'ok' when the service is reachable.",
      example: "ok",
    }),
  })
  .openapi("HealthResponse");

export function registerMiscPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: "get",
    path: "/health",
    tags: ["Health"],
    summary: "Service health check",
    description:
      "Simple liveness probe for the API service. Returns HTTP 200 with `{ status: 'ok' }` when the service is reachable. Use this for uptime monitoring and load balancer health checks.",
    responses: {
      200: {
        description: "Service is healthy.",
        content: {
          "application/json": {
            schema: healthResponseSchema,
            example: { status: "ok" },
          },
        },
      },
      ...errorResponses([500]),
    },
  });
}
