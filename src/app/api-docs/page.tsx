"use client";

import { ApiReferenceReact } from "@scalar/api-reference-react";
import "@scalar/api-reference-react/style.css";

import "./api-docs.css";

// "use client" is required — Scalar is a Vue app wrapped in a React adapter and uses browser-only APIs.
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
