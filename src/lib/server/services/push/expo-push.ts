import { getContainer } from "@/lib/server/container";
import type { PushCategoria } from "@/lib/shared/push/push";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
/** Limite de mensagens por requisição do Expo Push Service. */
const BATCH_SIZE = 100;
/** Cada lote tem prazo próprio: um Expo lento não segura a função até o limite da plataforma. */
const BATCH_TIMEOUT_MS = 10_000;

export type PushMessage = {
  title: string;
  body: string;
  /** Rota do app (ex.: `/vagas/<id>`), aberta ao tocar na notificação. */
  url: string;
};

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
 */
export async function sendExpoPush(
  tokens: string[],
  message: PushMessage,
  fetchImpl: typeof fetch = fetch
): Promise<PushResult> {
  const result: PushResult = { aceitos: 0, invalidos: [] };
  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE);
    try {
      const response = await fetchImpl(EXPO_PUSH_URL, {
        method: "POST",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        signal: AbortSignal.timeout(BATCH_TIMEOUT_MS),
        body: JSON.stringify(
          batch.map(to => ({
            to,
            title: message.title,
            body: message.body,
            data: { url: message.url },
            sound: "default",
            channelId: "default",
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
          result.invalidos.push(token);
        }
      });
    } catch {
      // Melhor esforço: segue para o próximo lote.
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
  const { aceitos, invalidos } = await sendExpoPush(tokens, message, fetchImpl);
  await pushDispositivosRepository.deleteTokens(invalidos);
  return { enviados: aceitos, removidos: invalidos.length };
}
