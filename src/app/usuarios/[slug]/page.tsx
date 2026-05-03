import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getContainer } from "@/lib/server/container";
import { jsonLdScriptContent } from "@/lib/server/utils/seo";
import UsuarioProfileClient from "./usuario-profile-client";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const usuario = await getContainer().usuariosRepository.findBySlug(slug);

  if (!usuario) {
    return { title: "Usuário · Aquário", robots: { index: false, follow: false } };
  }

  // Facade users are placeholders for unverified members — don't index.
  if (usuario.eFacade) {
    return {
      title: `${usuario.nome} · Aquário`,
      robots: { index: false, follow: false },
    };
  }

  const title = `${usuario.nome} · Aquário`;
  const description = `${usuario.curso?.nome ?? "Aluno(a)"} no ${usuario.centro?.sigla ?? "CI"} — perfil no Aquário, comunidade do Centro de Informática da UFPB.`;
  const canonical = `/usuarios/${slug}`;
  const ogImages = usuario.urlFotoPerfil
    ? [{ url: usuario.urlFotoPerfil, alt: usuario.nome }]
    : undefined;

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
      card: "summary",
      title,
      description,
      images: usuario.urlFotoPerfil ? [usuario.urlFotoPerfil] : undefined,
    },
  };
}

export default async function UsuarioPage({ params }: PageProps) {
  const { slug } = await params;
  const usuario = await getContainer().usuariosRepository.findBySlug(slug);

  if (!usuario) {
    notFound();
  }

  const jsonLd = !usuario.eFacade
    ? {
        "@context": "https://schema.org",
        "@type": "Person",
        name: usuario.nome,
        image: usuario.urlFotoPerfil ?? undefined,
        affiliation: {
          "@type": "Organization",
          name: `${usuario.centro?.sigla ?? "CI"} — ${usuario.centro?.nome ?? "Centro de Informática"} · UFPB`,
        },
        alumniOf: usuario.curso?.nome ?? undefined,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdScriptContent(jsonLd) }}
        />
      )}
      <UsuarioProfileClient slug={slug} />
    </>
  );
}
