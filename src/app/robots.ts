import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/server/utils/seo";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const rules: MetadataRoute.Robots["rules"] = [
    {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/admin",
        "/admin/",
        "/perfil",
        "/login",
        "/registro",
        "/esqueci-senha",
        "/resetar-senha",
        "/verificar-email",
        "/projetos/novo",
        "/projetos/*/editar",
        "/vagas/novo",
        "/api-docs",
        "/metrics",
      ],
    },
  ];

  // If the origin is unconfigured in production, fail closed: emit the rules
  // (so crawlers still see disallows) but omit `host`/`sitemap` rather than
  // pointing them at localhost.
  if (!siteUrl) {
    return { rules };
  }

  return {
    rules,
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
