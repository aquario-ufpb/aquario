import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContainer } from "@/lib/server/container";
import { jsonLdScriptContent } from "@/lib/server/utils/seo";
import ProjetoDetailClient from "./projeto-detail-client";

type PageProps = {
  params: Promise<{ id: string }>;
};

/**
 * The `[id]` route param is a slug. Public PUBLICADO projects have full
 * server-rendered metadata + initialData; drafts/archived fall through to the
 * client (which auth-fetches via the API and 404s for unauthorized viewers).
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id: slug } = await params;
  const projeto = await getContainer().projetosRepository.findBySlug(slug);

  if (!projeto || projeto.status !== "PUBLICADO") {
    // Drafts/archived/missing: don't leak details to crawlers.
    return {
      title: "Projeto · Aquário",
      robots: { index: false, follow: false },
    };
  }

  const title = `${projeto.titulo} · Aquário`;
  const description =
    projeto.subtitulo?.trim() ||
    `Projeto publicado no Aquário, comunidade do Centro de Informática da UFPB.`;
  const canonical = `/projetos/${projeto.slug}`;
  const ogImages = projeto.urlImagem
    ? [{ url: projeto.urlImagem, alt: projeto.titulo }]
    : undefined;

  return {
    title,
    description,
    keywords: projeto.tags?.length ? projeto.tags : undefined,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: projeto.urlImagem ? [projeto.urlImagem] : undefined,
    },
  };
}

export default async function ProjetoPage({ params }: PageProps) {
  const { id: slug } = await params;
  const projeto = await getContainer().projetosRepository.findBySlug(slug);

  if (!projeto) {
    notFound();
  }

  // Only seed initialData for public projects. Drafts/archived require auth,
  // which the server can't verify here without coupling to the cookie/session
  // layer — let the client React Query hook handle that path via the API.
  const initialData = projeto.status === "PUBLICADO" ? projeto : undefined;

  const principal = projeto.autores.find(a => a.autorPrincipal) ?? projeto.autores[0];
  const authorName = principal?.entidade?.nome ?? principal?.usuario?.nome ?? "Aquário";

  const jsonLd =
    projeto.status === "PUBLICADO"
      ? {
          "@context": "https://schema.org",
          "@type": "CreativeWork",
          name: projeto.titulo,
          headline: projeto.titulo,
          description: projeto.subtitulo ?? undefined,
          image: projeto.urlImagem ?? undefined,
          keywords: projeto.tags?.length ? projeto.tags.join(", ") : undefined,
          dateCreated: projeto.criadoEm,
          datePublished: projeto.publicadoEm ?? projeto.criadoEm,
          author: { "@type": "Person", name: authorName },
        }
      : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // jsonLdScriptContent escapes `<` so user-controlled fields (titulo,
          // subtitulo, tags) cannot break out of the script context.
          dangerouslySetInnerHTML={{ __html: jsonLdScriptContent(jsonLd) }}
        />
      )}
      <ProjetoDetailClient slug={slug} initialData={initialData} />
    </>
  );
}
