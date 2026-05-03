import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
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
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
