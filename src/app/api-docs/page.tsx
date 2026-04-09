"use client";

import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";

/**
 * Interactive API documentation page powered by Scalar.
 *
 * The Scalar component fetches the OpenAPI spec from `/api/openapi` on mount
 * and renders an interactive reference with a sidebar, code samples, and
 * "Try it out" functionality. The spec itself is generated from Zod schemas
 * registered in `src/lib/server/openapi/paths/`.
 *
 * This is a client component because the underlying Scalar renderer uses
 * browser-only APIs (the package is a Vue app wrapped in a React adapter).
 */
export default function ApiDocsPage() {
  return (
    <ApiReferenceReact
      configuration={{
        url: "/api/openapi",
        theme: "default",
        hideClientButton: false,
        defaultOpenAllTags: false,
        metaData: {
          title: "Aquário UFPB API — Documentation",
          description:
            "Interactive reference for the Aquário UFPB API. Test endpoints directly from your browser.",
        },
      }}
    />
  );
}
