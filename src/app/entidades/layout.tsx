import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Entidades · Aquário",
  description:
    "Conheça as entidades do Centro de Informática da UFPB: laboratórios, grupos de pesquisa, ligas acadêmicas, empresas juniores e centros acadêmicos.",
  alternates: { canonical: "/entidades" },
  openGraph: {
    title: "Entidades · Aquário",
    description:
      "Conheça as entidades do Centro de Informática da UFPB: laboratórios, grupos de pesquisa, ligas acadêmicas, empresas juniores e centros acadêmicos.",
    url: "/entidades",
    type: "website",
  },
};

export default function EntidadesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
