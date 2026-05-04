import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mapas · Aquário",
  description:
    "Mapas interativos do Centro de Informática da UFPB: salas, laboratórios, professores e localização de cada andar.",
  alternates: { canonical: "/mapas" },
  openGraph: {
    title: "Mapas · Aquário",
    description:
      "Mapas interativos do Centro de Informática da UFPB: salas, laboratórios, professores e localização de cada andar.",
    url: "/mapas",
    type: "website",
  },
};

export default function MapasLayout({ children }: { children: React.ReactNode }) {
  return children;
}
