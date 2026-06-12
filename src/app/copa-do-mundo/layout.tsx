import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Copa do Mundo 2026 · Aquário",
  description:
    "Tabela completa da Copa do Mundo FIFA 2026 (EUA · Canadá · México): todos os 104 jogos, horários de Brasília, grupos e bandeiras, com opção de adicionar cada partida ao Google Agenda.",
  alternates: { canonical: "/copa-do-mundo" },
  openGraph: {
    title: "Copa do Mundo 2026 · Aquário",
    description:
      "Todos os jogos da Copa do Mundo FIFA 2026 com horários de Brasília e opção de adicionar ao Google Agenda.",
    url: "/copa-do-mundo",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
