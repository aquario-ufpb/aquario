import { NextResponse } from "next/server";

import { getOpenApiDocument } from "@/lib/server/openapi/generator";

/**
 * GET /api/openapi
 *
 * Returns the generated OpenAPI 3.1 document describing every public endpoint
 * of the Aquário API. The spec is built once per process on first request and
 * served from a module-level cache afterwards (see `getOpenApiDocument`).
 *
 * This route intentionally does NOT set `export const dynamic = "force-dynamic"`:
 * the spec is a pure function of the deployed code, so letting Next.js cache
 * the response is correct and avoids recomputing the document on every request.
 *
 * The `Access-Control-Allow-Origin: *` header is set explicitly so third-party
 * tools (Postman, Insomnia, Scalar cloud) can import the spec without hitting
 * CORS errors — the documentation is public by design.
 */
export function GET() {
  return NextResponse.json(getOpenApiDocument(), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

/**
 * Handle CORS preflight for the spec endpoint.
 * Some HTTP clients send an OPTIONS request before the actual GET when
 * fetching the spec cross-origin.
 */
export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });
}
