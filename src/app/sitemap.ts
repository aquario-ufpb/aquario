import type { MetadataRoute } from "next";
import { getContainer } from "@/lib/server/container";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Regenerate at most once an hour. Without this the sitemap is frozen at build
// time and new projetos/entidades/guias never reach search engines until the
// next deploy.
export const revalidate = 3600;

const STATIC_PATHS: {
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}[] = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/sobre", priority: 0.6, changeFrequency: "monthly" },
  { path: "/recursos", priority: 0.7, changeFrequency: "monthly" },
  { path: "/projetos", priority: 0.9, changeFrequency: "daily" },
  { path: "/entidades", priority: 0.9, changeFrequency: "weekly" },
  { path: "/calendario-academico", priority: 0.7, changeFrequency: "weekly" },
  { path: "/grades-curriculares", priority: 0.7, changeFrequency: "monthly" },
  { path: "/mapas", priority: 0.6, changeFrequency: "monthly" },
  { path: "/guias", priority: 0.8, changeFrequency: "weekly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const container = getContainer();

  // Pull only public, indexable content. Failures degrade gracefully — a partial
  // sitemap is far better than a failed deploy because one query was slow.
  const [projetosResult, entidades, guias] = await Promise.all([
    container.projetosRepository
      .findMany({ page: 1, limit: 1000, status: "PUBLICADO", orderBy: "criadoEm", order: "desc" })
      .catch(() => ({ projetos: [], total: 0 })),
    container.entidadesRepository.findMany().catch(() => []),
    container.guiasRepository.findMany().catch(() => []),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map(
    ({ path, priority, changeFrequency }) => ({
      url: `${SITE_URL}${path}`,
      changeFrequency,
      priority,
      lastModified: new Date(),
    })
  );

  const projetoEntries: MetadataRoute.Sitemap = projetosResult.projetos
    .filter(p => p.slug)
    .map(p => ({
      url: `${SITE_URL}/projetos/${p.slug}`,
      lastModified: p.atualizadoEm ?? p.criadoEm,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  const entidadeEntries: MetadataRoute.Sitemap = entidades
    .filter(e => e.slug)
    .map(e => ({
      url: `${SITE_URL}/entidade/${e.slug}`,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  // Guides: include guia root and each section URL.
  const guiaEntries: MetadataRoute.Sitemap = [];
  for (const guia of guias) {
    if (!guia.slug) {
      continue;
    }
    guiaEntries.push({
      url: `${SITE_URL}/guias/${guia.slug}`,
      changeFrequency: "weekly",
      priority: 0.6,
    });
    for (const secao of guia.secoes ?? []) {
      if (!secao.slug) {
        continue;
      }
      guiaEntries.push({
        url: `${SITE_URL}/guias/${guia.slug}/${secao.slug}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  return [...staticEntries, ...projetoEntries, ...entidadeEntries, ...guiaEntries];
}
