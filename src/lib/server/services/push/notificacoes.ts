import type { EventoCalendario } from "@prisma/client";
import { getContainer } from "@/lib/server/container";
import { notifyCategoria, type PushMessage } from "./expo-push";

const DIA_MS = 24 * 60 * 60 * 1000;
/** João Pessoa: UTC−3, sem horário de verão. */
const OFFSET_BRASIL_MS = 3 * 60 * 60 * 1000;

/**
 * Intervalo `[início, fim)` que cobre a data de amanhã (no calendário de Brasília) do jeito que
 * os eventos são gravados: a importação por CSV usa a meia-noite local (03:00Z) e as rotas de
 * admin gravam `YYYY-MM-DD` como meia-noite UTC (00:00Z). O dia inteiro em UTC pega os dois.
 */
export function amanhaNoBrasil(now: Date): { inicio: Date; fim: Date } {
  const local = new Date(now.getTime() - OFFSET_BRASIL_MS);
  const amanha = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() + 1);
  return { inicio: new Date(amanha), fim: new Date(amanha + DIA_MS) };
}

/** Uma notificação por dia, mesmo com vários eventos, para não lotar a bandeja. */
export function mensagemDePrazos(
  eventos: Pick<EventoCalendario, "descricao">[]
): PushMessage | null {
  const [primeiro, ...resto] = eventos;
  if (!primeiro) {
    return null;
  }
  const extra =
    resto.length === 1
      ? " e mais 1 evento"
      : resto.length > 1
        ? ` e mais ${resto.length} eventos`
        : "";
  return {
    title: "Amanhã no calendário acadêmico",
    body: `${primeiro.descricao}${extra}.`,
    url: "/calendario",
  };
}

export async function notificarPrazosDeAmanha(now = new Date()) {
  const { inicio, fim } = amanhaNoBrasil(now);
  const eventos = await getContainer().calendarioRepository.findEventosIniciandoEntre(inicio, fim);
  const mensagem = mensagemDePrazos(eventos);
  return mensagem ? notifyCategoria("prazos", mensagem) : { enviados: 0, removidos: 0 };
}

export function notificarNovaVaga(vaga: {
  id: string;
  titulo: string;
  entidade: { nome: string };
}) {
  return notifyCategoria("vagas", {
    title: "Nova vaga no Aquário",
    body: `${vaga.titulo} · ${vaga.entidade.nome}`,
    url: `/vagas/${vaga.id}`,
  });
}

export function notificarNovoProjeto(projeto: { titulo: string; slug: string }, entidade: string) {
  return notifyCategoria("entidades", {
    title: `Novo projeto de ${entidade}`,
    body: projeto.titulo,
    url: `/projetos/${projeto.slug}`,
  });
}
