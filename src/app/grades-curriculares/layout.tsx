import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Grades Curriculares · Aquário",
  description:
    "Consulte as grades curriculares dos cursos do Centro de Informática da UFPB: disciplinas obrigatórias, optativas e pré-requisitos por período.",
  alternates: { canonical: "/grades-curriculares" },
  openGraph: {
    title: "Grades Curriculares · Aquário",
    description:
      "Consulte as grades curriculares dos cursos do Centro de Informática da UFPB: disciplinas obrigatórias, optativas e pré-requisitos por período.",
    url: "/grades-curriculares",
    type: "website",
  },
};

export default function GradesCurricularesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
