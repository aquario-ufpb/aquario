import type { Metadata } from "next";
import LandingClient from "./landing-client";

export const metadata: Metadata = {
  title: "Aquário · Comunidade do CI/UFPB",
  description:
    "Tudo que o estudante do Centro de Informática da UFPB precisa em um só lugar: salas, disciplinas, guias, entidades, projetos, vagas e calendário acadêmico.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Aquário · Comunidade do CI/UFPB",
    description:
      "Tudo que o estudante do Centro de Informática da UFPB precisa em um só lugar: salas, disciplinas, guias, entidades, projetos, vagas e calendário acadêmico.",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aquário · Comunidade do CI/UFPB",
    description: "Tudo que o estudante do Centro de Informática da UFPB precisa em um só lugar.",
  },
};

export default function Home() {
  return <LandingClient />;
}
