import type { EventoCalendario } from "@prisma/client";
import { getContainer } from "@/lib/server/container";
import { notifyCategoria, type PushMessage } from "./expo-push";

const DIA_MS = 24 * 60 * 60 * 1000;
/** O calendário guarda as datas à meia-noite de João Pessoa (UTC−3, sem horário de verão). */
const OFFSET_BRASIL_MS = 3 * 60 * 60 * 1000;

/** Intervalo `[início, fim)` do dia seguinte no horário de Brasília. */
export function amanhaNoBrasil(now: Date): { inicio: Date; fim: Date } {
  const local = new Date(now.getTime() - OFFSET_BRASIL_MS);
  const hojeUtc = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  const inicio = new Date(hojeUtc + DIA_MS + OFFSET_BRASIL_MS);
  return { inicio, fim: new Date(inicio.getTime() + DIA_MS) };
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
