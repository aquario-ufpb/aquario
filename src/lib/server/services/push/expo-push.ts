import { getContainer } from "@/lib/server/container";
import type { PushCategoria } from "@/lib/shared/push/push";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
/** Limite de mensagens por requisição do Expo Push Service. */
const BATCH_SIZE = 100;
/** Cada lote tem prazo próprio: um Expo lento não segura a função até o limite da plataforma. */
const BATCH_TIMEOUT_MS = 10_000;

/**
 * O Expo recusa notificações acima de 4 KiB. Título e corpo vêm de texto livre (descrição do
 * calendário, título da vaga), então são cortados em bytes com folga para o resto do payload.
 */
const MAX_TITLE_BYTES = 120;
const MAX_BODY_BYTES = 360;

export type PushMessage = {
  title: string;
  body: string;
  /** Rota do app (ex.: `/vagas/<id>`), aberta ao tocar na notificação. */
  url: string;
  /** Depois deste instante o Expo descarta a mensagem em vez de entregá-la atrasada. */
  expiration?: Date;
};

const segmenter = new Intl.Segmenter("pt-BR", { granularity: "grapheme" });

/** Corta `texto` em até `maxBytes` bytes UTF-8 sem partir caracteres, terminando em "…". */
export function truncarBytes(texto: string, maxBytes: number): string {
  if (Buffer.byteLength(texto) <= maxBytes) {
    return texto;
  }
  const reticencias = "…";
  let restante = maxBytes - Buffer.byteLength(reticencias);
  let resultado = "";
  for (const { segment } of segmenter.segment(texto)) {
    const bytes = Buffer.byteLength(segment);
    if (bytes > restante) {
      break;
    }
    resultado += segment;
    restante -= bytes;
  }
  return resultado.trimEnd() + reticencias;
}

type ExpoTicket = { status: "ok" | "error"; details?: { error?: string } };

export type PushResult = {
  /** Mensagens que o Expo aceitou (ticket `ok`). */
  aceitos: number;
  /** Tokens marcados como `DeviceNotRegistered` (app desinstalado, permissão revogada). */
  invalidos: string[];
};

/**
 * Envia a mesma notificação para vários tokens, em lotes de 100. Falhas de rede, timeout ou
 * resposta de erro de um lote não derrubam quem chamou: notificação é melhor esforço.
 *
 * `onInvalidos` roda ao fim de cada lote: se a função estourar o tempo no meio do envio, os
 * tokens inválidos dos lotes já enviados continuam removidos.
 */
export async function sendExpoPush(
  tokens: string[],
  message: PushMessage,
  fetchImpl: typeof fetch = fetch,
  onInvalidos?: (tokens: string[]) => Promise<void>
): Promise<PushResult> {
  const result: PushResult = { aceitos: 0, invalidos: [] };
  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE);
    const invalidosDoLote: string[] = [];
    try {
      const response = await fetchImpl(EXPO_PUSH_URL, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        signal: AbortSignal.timeout(BATCH_TIMEOUT_MS),
        body: JSON.stringify(
          batch.map(to => ({
            to,
            title: truncarBytes(message.title, MAX_TITLE_BYTES),
            body: truncarBytes(message.body, MAX_BODY_BYTES),
            data: { url: message.url },
            sound: "default",
            channelId: "default",
            ...(message.expiration && {
              expiration: Math.floor(message.expiration.getTime() / 1000),
            }),
          }))
        ),
      });
      if (!response.ok) {
        continue;
      }
      const { data } = (await response.json()) as { data?: ExpoTicket[] };
      data?.forEach((ticket, index) => {
        const token = batch[index];
        if (ticket.status === "ok") {
          result.aceitos += 1;
        } else if (token && ticket.details?.error === "DeviceNotRegistered") {
          invalidosDoLote.push(token);
        }
      });
    } catch {
      // Melhor esforço: segue para o próximo lote.
    }
    if (invalidosDoLote.length) {
      result.invalidos.push(...invalidosDoLote);
      try {
        await onInvalidos?.(invalidosDoLote);
      } catch {
        // Falha ao limpar não impede os próximos lotes; o token volta a ser marcado no próximo envio.
      }
    }
  }
  return result;
}

/** Envia para todos que ativaram a categoria e remove os tokens inválidos. */
export async function notifyCategoria(
  categoria: PushCategoria,
  message: PushMessage,
  fetchImpl: typeof fetch = fetch
): Promise<{ enviados: number; removidos: number }> {
  const { pushDispositivosRepository } = getContainer();
  const tokens = await pushDispositivosRepository.tokensFor(categoria);
  if (!tokens.length) {
    return { enviados: 0, removidos: 0 };
  }
  const { aceitos, invalidos } = await sendExpoPush(tokens, message, fetchImpl, lote =>
    pushDispositivosRepository.deleteTokens(lote)
  );
  return { enviados: aceitos, removidos: invalidos.length };
}
