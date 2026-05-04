import type { MetadataRoute } from "next";
import { getContainer } from "@/lib/server/container";
import { getSiteUrl } from "@/lib/server/utils/seo";
import type { ProjetoWithRelations } from "@/lib/shared/types/projeto";

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

const PROJETOS_PAGE_SIZE = 500;

/**
 * Pull every PUBLICADO projeto across all pages. The first call also gives us
 * `total`, which bounds the loop so the catalog can grow past any single
 * page-size without dropping URLs from the sitemap.
 */
async function fetchAllPublicadoProjetos(): Promise<ProjetoWithRelations[]> {
  const repo = getContainer().projetosRepository;

  try {
    const first = await repo.findMany({
      page: 1,
      limit: PROJETOS_PAGE_SIZE,
      status: "PUBLICADO",
      orderBy: "criadoEm",
      order: "desc",
    });
    const all = [...first.projetos];
    const totalPages = Math.ceil(first.total / PROJETOS_PAGE_SIZE);

    for (let page = 2; page <= totalPages; page++) {
      const next = await repo.findMany({
        page,
        limit: PROJETOS_PAGE_SIZE,
        status: "PUBLICADO",
        orderBy: "criadoEm",
        order: "desc",
      });
      all.push(...next.projetos);
    }
    return all;
  } catch {
    // A partial sitemap is far better than a failed deploy because one query
    // was slow; downstream callers still get static + entidade + guia entries.
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  // Fail closed: with no configured origin (typically a CI build with
  // NEXT_PUBLIC_APP_URL unset) we emit an empty sitemap rather than localhost
  // URLs. The hourly revalidate will repopulate once env is available.
  if (!siteUrl) {
    return [];
  }
  const container = getContainer();

  const [projetos, entidades, guias] = await Promise.all([
    fetchAllPublicadoProjetos(),
    container.entidadesRepository.findMany().catch(() => []),
    container.guiasRepository.findMany().catch(() => []),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map(
    ({ path, priority, changeFrequency }) => ({
      url: `${siteUrl}${path}`,
      changeFrequency,
      priority,
      lastModified: new Date(),
    })
  );

  const projetoEntries: MetadataRoute.Sitemap = projetos
    .filter(p => p.slug)
    .map(p => ({
      url: `${siteUrl}/projetos/${p.slug}`,
      lastModified: p.atualizadoEm ?? p.criadoEm,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

  const entidadeEntries: MetadataRoute.Sitemap = entidades
    .filter(e => e.slug)
    .map(e => ({
      url: `${siteUrl}/entidade/${e.slug}`,
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
      url: `${siteUrl}/guias/${guia.slug}`,
      changeFrequency: "weekly",
      priority: 0.6,
    });
    for (const secao of guia.secoes ?? []) {
      if (!secao.slug) {
        continue;
      }
      guiaEntries.push({
        url: `${siteUrl}/guias/${guia.slug}/${secao.slug}`,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  }

  return [...staticEntries, ...projetoEntries, ...entidadeEntries, ...guiaEntries];
}
