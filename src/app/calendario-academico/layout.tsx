import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendário Acadêmico · Aquário",
  description:
    "Calendário acadêmico oficial da UFPB: datas de matrícula, início e fim de período, feriados e principais eventos do semestre letivo.",
  alternates: { canonical: "/calendario-academico" },
  openGraph: {
    title: "Calendário Acadêmico · Aquário",
    description:
      "Calendário acadêmico oficial da UFPB: datas de matrícula, início e fim de período, feriados e principais eventos do semestre letivo.",
    url: "/calendario-academico",
    type: "website",
  },
};

export default function CalendarioAcademicoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
