import type { Metadata } from "next";
import { getContainer } from "@/lib/server/container";
import GuiasClient from "./guias-client";

type PageProps = {
  params: Promise<{ parts?: string[] }>;
};

const SITE_TITLE = "Guias · Aquário";
const ROOT_DESCRIPTION =
  "Guias do Centro de Informática da UFPB: ementas, dicas, tutoriais e referências sobre disciplinas, períodos, e a vida acadêmica.";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { parts } = await params;

  if (!parts || parts.length === 0) {
    return {
      title: SITE_TITLE,
      description: ROOT_DESCRIPTION,
      alternates: { canonical: "/guias" },
      openGraph: { title: SITE_TITLE, description: ROOT_DESCRIPTION, url: "/guias" },
    };
  }

  const [guiaSlug, secaoSlug, subSlug] = parts;
  const container = getContainer();
  const guia = guiaSlug ? await container.guiasRepository.findBySlug(guiaSlug) : null;

  if (!guia) {
    return { title: SITE_TITLE, robots: { index: false, follow: false } };
  }

  const canonical = `/guias/${parts.join("/")}`;

  if (!secaoSlug) {
    const title = `${guia.titulo} · Guias · Aquário`;
    return {
      title,
      description: `Guia "${guia.titulo}" no Aquário, comunidade do Centro de Informática da UFPB.`,
      alternates: { canonical },
      openGraph: { title, url: canonical },
    };
  }

  const secao = guia.secoes?.find(s => s.slug === secaoSlug);
  if (!secao) {
    return { title: `${guia.titulo} · Aquário`, robots: { index: false, follow: false } };
  }

  if (!subSlug) {
    const title = `${secao.titulo} · ${guia.titulo} · Aquário`;
    return {
      title,
      description: `${secao.titulo} — guia "${guia.titulo}" no Aquário (CI/UFPB).`,
      alternates: { canonical },
      openGraph: { title, url: canonical },
    };
  }

  const subSecoes = await container.subSecoesGuiaRepository.findBySecaoId(secao.id);
  const subSecao = subSecoes.find(s => s.slug === subSlug);
  if (!subSecao) {
    return {
      title: `${secao.titulo} · ${guia.titulo} · Aquário`,
      robots: { index: false, follow: false },
    };
  }

  const title = `${subSecao.titulo} · ${secao.titulo} · ${guia.titulo} · Aquário`;
  return {
    title,
    description: `${subSecao.titulo} — ${secao.titulo}, guia "${guia.titulo}" no Aquário (CI/UFPB).`,
    alternates: { canonical },
    openGraph: { title, url: canonical },
  };
}

export default function GuiasPage() {
  return <GuiasClient />;
}
