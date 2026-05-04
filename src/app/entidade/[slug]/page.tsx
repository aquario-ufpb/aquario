import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContainer } from "@/lib/server/container";
import { jsonLdScriptContent } from "@/lib/server/utils/seo";
import EntidadeDetailClient from "./entidade-detail-client";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const TIPO_LABEL: Record<string, string> = {
  LABORATORIO: "Laboratório",
  GRUPO: "Grupo",
  LIGA_ACADEMICA: "Liga Acadêmica",
  EMPRESA_JUNIOR: "Empresa Júnior",
  CENTRO_ACADEMICO: "Centro Acadêmico",
  OUTRO: "Entidade",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entidade = await getContainer().entidadesRepository.findBySlug(slug);

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
  const entidade = await getContainer().entidadesRepository.findBySlug(slug);

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
      <EntidadeDetailClient slug={slug} />
    </>
  );
}
