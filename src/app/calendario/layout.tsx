import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Minhas Disciplinas · Aquário",
  description:
    "Gerencie suas disciplinas do Centro de Informática da UFPB, escolha turmas e visualize seu calendário pessoal.",
  alternates: { canonical: "/calendario" },
  openGraph: {
    title: "Minhas Disciplinas · Aquário",
    description:
      "Gerencie suas disciplinas do Centro de Informática da UFPB, escolha turmas e visualize seu calendário pessoal.",
    url: "/calendario",
    type: "website",
  },
};

export default function CalendarioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
