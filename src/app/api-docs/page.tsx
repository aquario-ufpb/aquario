"use client";

import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";

import "./api-docs.css";

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
 *
 * Layout notes:
 * - `layout: "modern"` — the default Scalar layout with the sidebar on the
 *   left and the content on the right. Visually the most polished option.
 * - `defaultOpenFirstTag: false` + `defaultOpenAllTags: false` — every tag
 *   group starts collapsed so the user can navigate intentionally instead
 *   of landing on a 19,000px-tall page with 56 endpoints already stacked.
 * - `hideModels: true` collapses the "Models" appendix at the end of the
 *   sidebar. Every component schema (ApiErrorBody, ErrorCode, PaginationMeta,
 *   UserProfile, etc) is already referenced inline on the endpoints that use
 *   it, so the dedicated models section only adds redundant navigation noise.
 * - Visual tweaks that Scalar's configuration API does not expose are
 *   handled in ./api-docs.css using CSS `:has()` and stable Scalar class
 *   names (verified live against the rendered DOM).
 */
export default function ApiDocsPage() {
  return (
    <ApiReferenceReact
      configuration={{
        url: "/api/openapi",
        layout: "modern",
        hideModels: true,
        defaultOpenAllTags: false,
        defaultOpenFirstTag: false,
        theme: "default",
        metaData: {
          title: "Aquário UFPB API — Documentation",
          description:
            "Interactive reference for the Aquário UFPB API. Test endpoints directly from your browser.",
        },
      }}
    />
  );
}
