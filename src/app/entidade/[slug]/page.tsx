import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getContainer } from "@/lib/server/container";
import type { EntidadeWithRelations } from "@/lib/server/db/interfaces/types";
import { jsonLdScriptContent } from "@/lib/server/utils/seo";
import type { Entidade, TipoEntidade } from "@/lib/shared/types";
import EntidadeDetailClient from "./entidade-detail-client";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const TIPO_LABEL: Record<string, string> = {
  LABORATORIO: "Laboratório",
  GRUPO: "Grupo",
  LIGA_ACADEMICA: "Liga Acadêmica",
  EMPRESA_JUNIOR: "Empresa Júnior",
  EMPRESA: "Empresa",
  ATLETICA: "Atlética",
  CENTRO_ACADEMICO: "Centro Acadêmico",
  OUTRO: "Entidade",
};

const VALID_TIPOS: TipoEntidade[] = [
  "LABORATORIO",
  "GRUPO",
  "LIGA_ACADEMICA",
  "CENTRO_ACADEMICO",
  "ATLETICA",
  "EMPRESA",
  "OUTRO",
];

const getEntidadeBySlug = cache(async (slug: string) => {
  return await getContainer().entidadesRepository.findBySlug(slug);
});

function mapImagePath(urlFoto: string | null | undefined): string {
  if (!urlFoto) {
    return "/api/content-images/assets/entidades/default.png";
  }

  if (urlFoto.startsWith("/") || urlFoto.startsWith("http")) {
    return urlFoto;
  }

  return `/api/content-images/assets/entidades/${urlFoto}`;
}

function normalizeTipo(tipo: string): TipoEntidade {
  return VALID_TIPOS.includes(tipo as TipoEntidade) ? (tipo as TipoEntidade) : "OUTRO";
}

function getOrder(entidade: EntidadeWithRelations): number | null {
  const metadata = entidade.metadata;
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata) && "order" in metadata) {
    return typeof metadata.order === "number" ? metadata.order : null;
  }
  return null;
}

function toClientEntidade(entidade: EntidadeWithRelations): Entidade {
  return {
    id: entidade.id,
    name: entidade.nome,
    slug: entidade.slug || entidade.nome.toLowerCase().replace(/\s+/g, "-"),
    subtitle: entidade.subtitle,
    description: entidade.descricao,
    tipo: normalizeTipo(entidade.tipo),
    imagePath: mapImagePath(entidade.urlFoto),
    contato_email: entidade.contato || "",
    instagram: entidade.instagram,
    linkedin: entidade.linkedin,
    website: entidade.website,
    location: entidade.location,
    founding_date: entidade.foundingDate ? entidade.foundingDate.toISOString().split("T")[0] : null,
    order: getOrder(entidade),
    membros: entidade.membros?.map(membro => ({
      id: membro.id,
      usuario: {
        id: membro.usuario.id,
        nome: membro.usuario.nome,
        slug: membro.usuario.slug,
        urlFotoPerfil: membro.usuario.urlFotoPerfil,
        eFacade: membro.usuario.eFacade,
        curso: membro.usuario.curso ? { nome: membro.usuario.curso.nome } : null,
      },
      papel: membro.papel,
      cargo: membro.cargo
        ? {
            id: membro.cargo.id,
            nome: membro.cargo.nome,
            descricao: membro.cargo.descricao,
            ordem: membro.cargo.ordem,
            entidadeId: membro.cargo.entidadeId,
          }
        : null,
      startedAt: membro.startedAt.toISOString(),
      endedAt: membro.endedAt?.toISOString() ?? null,
    })),
    cargos: entidade.cargos?.map(cargo => ({
      id: cargo.id,
      nome: cargo.nome,
      descricao: cargo.descricao,
      ordem: cargo.ordem,
      entidadeId: cargo.entidadeId,
    })),
    centro: entidade.centro
      ? {
          id: entidade.centro.id,
          nome: entidade.centro.nome,
          sigla: entidade.centro.sigla,
        }
      : null,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entidade = await getEntidadeBySlug(slug);

  if (!entidade) {
    return { title: "Entidade · Aquário", robots: { index: false, follow: false } };
  }

  const tipoLabel = TIPO_LABEL[entidade.tipo] ?? "Entidade";
  const title = `${entidade.nome} · ${tipoLabel} · Aquário`;
  const description =
    entidade.subtitle?.trim() ||
    entidade.descricao?.trim() ||
    `${tipoLabel} do Centro de Informática da UFPB no Aquário.`;
  const canonical = `/entidade/${slug}`;
  const ogImages = entidade.urlFoto ? [{ url: entidade.urlFoto, alt: entidade.nome }] : undefined;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "profile",
      url: canonical,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: entidade.urlFoto ? [entidade.urlFoto] : undefined,
    },
  };
}

export default async function EntidadePage({ params }: PageProps) {
  const { slug } = await params;
  const entidade = await getEntidadeBySlug(slug);

  if (!entidade) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: entidade.nome,
    description: entidade.descricao ?? entidade.subtitle ?? undefined,
    image: entidade.urlFoto ?? undefined,
    url: entidade.website ?? undefined,
    sameAs: [entidade.instagram, entidade.linkedin, entidade.website].filter(Boolean),
    foundingDate: entidade.foundingDate ?? undefined,
    location: entidade.location ?? undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScriptContent(jsonLd) }}
      />
      <EntidadeDetailClient slug={slug} initialData={toClientEntidade(entidade)} />
    </>
  );
}
