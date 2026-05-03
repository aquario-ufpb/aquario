import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projetos · Aquário",
  description:
    "Descubra projetos de alunos, laboratórios, grupos e ligas acadêmicas do Centro de Informática da UFPB.",
  alternates: { canonical: "/projetos" },
  openGraph: {
    title: "Projetos · Aquário",
    description:
      "Descubra projetos de alunos, laboratórios, grupos e ligas acadêmicas do Centro de Informática da UFPB.",
    url: "/projetos",
    type: "website",
  },
};

export default function ProjetosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
