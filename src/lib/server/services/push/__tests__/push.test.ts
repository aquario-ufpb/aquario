/** @jest-environment node */
import { getContainer } from "@/lib/server/container";
import { notifyCategoria, sendExpoPush, truncarBytes } from "../expo-push";
import {
  amanhaNoBrasil,
  fimDeHojeNoBrasil,
  mensagemDePrazos,
  notificarNovaVaga,
  notificarPrazosDeAmanha,
} from "../notificacoes";

jest.mock("@/lib/server/container", () => ({ getContainer: jest.fn() }));

const repository = { tokensFor: jest.fn(), deleteTokens: jest.fn(), reservarEnvio: jest.fn() };
const calendarioRepository = { findEventosIniciandoEntre: jest.fn() };
const message = { title: "T", body: "B", url: "/vagas/1" };

function expoResponse(tickets: unknown[]) {
  return Promise.resolve(new Response(JSON.stringify({ data: tickets }), { status: 200 }));
}

/** Espiona o `fetch` global e devolve as mensagens de cada requisição ao Expo. */
function spyExpo() {
  const spy = jest
    .spyOn(global, "fetch")
    .mockImplementation((_url, init) =>
      expoResponse((JSON.parse(String(init?.body)) as unknown[]).map(() => ({ status: "ok" })))
    );
  const mensagens = () =>
    spy.mock.calls.map(([, init]) => JSON.parse(String(init?.body)) as Record<string, unknown>[]);
  return { spy, mensagens };
}

afterEach(() => jest.restoreAllMocks());

beforeEach(() => {
  jest.clearAllMocks();
  (getContainer as jest.Mock).mockReturnValue({
    pushDispositivosRepository: repository,
    calendarioRepository,
  });
});

describe("sendExpoPush", () => {
  it("envia em lotes de 100 e devolve os tokens não registrados", async () => {
    const tokens = Array.from({ length: 150 }, (_, i) => `ExponentPushToken[${i}]`);
    const fetchImpl = jest.fn((_url: string, init: RequestInit) => {
      const batch = JSON.parse(String(init.body)) as unknown[];
      return expoResponse(
        batch.map((_, i) =>
          i === 0
            ? { status: "error", details: { error: "DeviceNotRegistered" } }
            : { status: "ok" }
        )
      );
    });

    const result = await sendExpoPush(tokens, message, fetchImpl as unknown as typeof fetch);

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const [primeiro] = JSON.parse(String(fetchImpl.mock.calls[0]?.[1].body)) as unknown[];
    expect(primeiro).toEqual({
      to: "ExponentPushToken[0]",
      title: "T",
      body: "B",
      data: { url: "/vagas/1" },
      sound: "default",
      channelId: "default",
    });
    expect(result).toEqual({
      aceitos: 148,
      invalidos: ["ExponentPushToken[0]", "ExponentPushToken[100]"],
    });
    // Cada lote tem timeout próprio.
    expect(fetchImpl.mock.calls[0]?.[1].signal).toBeInstanceOf(AbortSignal);
  });

  it("não lança em falha de rede nem remove tokens por outros erros", async () => {
    const fetchImpl = jest
      .fn()
      .mockRejectedValueOnce(new Error("rede"))
      .mockReturnValueOnce(
        expoResponse([{ status: "error", details: { error: "MessageRateExceeded" } }])
      );

    await expect(
      sendExpoPush(["ExponentPushToken[a]"], message, fetchImpl as unknown as typeof fetch)
    ).resolves.toEqual({ aceitos: 0, invalidos: [] });
    await expect(
      sendExpoPush(["ExponentPushToken[a]"], message, fetchImpl as unknown as typeof fetch)
    ).resolves.toEqual({ aceitos: 0, invalidos: [] });
  });
});

describe("limites do payload", () => {
  it("corta texto longo em bytes sem partir caracteres multibyte", () => {
    const descricao = "Prazo de trancamento 📚 — ação obrigatória ".repeat(200);
    const cortado = truncarBytes(descricao, 360);
    expect(Buffer.byteLength(cortado)).toBeLessThanOrEqual(360);
    expect(cortado.endsWith("…")).toBe(true);
    expect(cortado).not.toContain("\uFFFD");
    expect(descricao.startsWith(cortado.slice(0, -1))).toBe(true);
    expect(truncarBytes("curto", 360)).toBe("curto");
  });

  it("uma descrição enorme não estoura o limite de 4 KiB do Expo", async () => {
    const fetchImpl = jest.fn<Promise<Response>, [string, RequestInit]>(() =>
      expoResponse([{ status: "ok" }])
    );
    const enorme = { ...message, title: "Título ".repeat(100), body: "ção ".repeat(5000) };

    await sendExpoPush(["ExponentPushToken[a]"], enorme, fetchImpl as unknown as typeof fetch);

    const [enviada] = JSON.parse(String(fetchImpl.mock.calls[0]?.[1].body)) as unknown[];
    expect(Buffer.byteLength(JSON.stringify(enviada))).toBeLessThan(4096);
  });

  it("manda expiration em segundos só quando a mensagem tem validade", async () => {
    const fetchImpl = jest.fn<Promise<Response>, [string, RequestInit]>(() =>
      expoResponse([{ status: "ok" }])
    );
    const expiration = new Date("2026-11-05T03:00:00Z");

    await sendExpoPush(
      ["ExponentPushToken[a]"],
      { ...message, expiration },
      fetchImpl as unknown as typeof fetch
    );

    const [enviada] = JSON.parse(String(fetchImpl.mock.calls[0]?.[1].body)) as Record<
      string,
      unknown
    >[];
    expect(enviada?.expiration).toBe(expiration.getTime() / 1000);
  });
});

describe("notifyCategoria", () => {
  it("envia só para quem ativou a categoria e limpa os inválidos", async () => {
    repository.tokensFor.mockResolvedValue(["ExponentPushToken[a]"]);
    const fetchImpl = jest.fn(() =>
      expoResponse([{ status: "error", details: { error: "DeviceNotRegistered" } }])
    );

    await expect(
      notifyCategoria("vagas", message, fetchImpl as unknown as typeof fetch)
    ).resolves.toEqual({ enviados: 0, removidos: 1 });
    expect(repository.tokensFor).toHaveBeenCalledWith("vagas");
    expect(repository.deleteTokens).toHaveBeenCalledWith(["ExponentPushToken[a]"]);
  });

  it("remove os inválidos lote a lote, sem esperar o fim do envio", async () => {
    const tokens = Array.from({ length: 150 }, (_, i) => `ExponentPushToken[${i}]`);
    repository.tokensFor.mockResolvedValue(tokens);
    repository.deleteTokens.mockResolvedValue(undefined);
    const fetchImpl = jest.fn((_url: string, init: RequestInit) => {
      // O segundo lote só sai depois que os inválidos do primeiro foram apagados.
      if (fetchImpl.mock.calls.length === 2) {
        expect(repository.deleteTokens).toHaveBeenCalledWith(["ExponentPushToken[0]"]);
      }
      const batch = JSON.parse(String(init.body)) as unknown[];
      return expoResponse(
        batch.map((_, i) =>
          i === 0
            ? { status: "error", details: { error: "DeviceNotRegistered" } }
            : { status: "ok" }
        )
      );
    });

    await expect(
      notifyCategoria("vagas", message, fetchImpl as unknown as typeof fetch)
    ).resolves.toEqual({ enviados: 148, removidos: 2 });
    expect(repository.deleteTokens.mock.calls).toEqual([
      [["ExponentPushToken[0]"]],
      [["ExponentPushToken[100]"]],
    ]);
  });

  it("falha ao limpar tokens não interrompe os próximos lotes", async () => {
    const tokens = Array.from({ length: 150 }, (_, i) => `ExponentPushToken[${i}]`);
    repository.tokensFor.mockResolvedValue(tokens);
    repository.deleteTokens.mockRejectedValue(new Error("banco fora"));
    const fetchImpl = jest.fn(() =>
      expoResponse([{ status: "error", details: { error: "DeviceNotRegistered" } }])
    );

    await expect(
      notifyCategoria("vagas", message, fetchImpl as unknown as typeof fetch)
    ).resolves.toEqual({ enviados: 0, removidos: 2 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("conta como enviados só os aceitos pelo Expo", async () => {
    repository.tokensFor.mockResolvedValue(["ExponentPushToken[a]", "ExponentPushToken[b]"]);
    const fetchImpl = jest.fn(() => Promise.resolve(new Response("erro", { status: 500 })));

    await expect(
      notifyCategoria("vagas", message, fetchImpl as unknown as typeof fetch)
    ).resolves.toEqual({ enviados: 0, removidos: 0 });
  });

  it("não chama o Expo sem inscritos", async () => {
    repository.tokensFor.mockResolvedValue([]);
    const fetchImpl = jest.fn();

    await notifyCategoria("prazos", message, fetchImpl as unknown as typeof fetch);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("prazos", () => {
  it("pega a data de amanhã no calendário de Brasília, nas duas formas de gravação", () => {
    // 2026-11-03 23:30 em João Pessoa = 2026-11-04 02:30 UTC: amanhã é dia 4.
    expect(amanhaNoBrasil(new Date("2026-11-04T02:30:00Z"))).toEqual({
      inicio: new Date("2026-11-04T00:00:00Z"),
      fim: new Date("2026-11-05T00:00:00Z"),
    });
    // 2026-11-04 08:00 em João Pessoa (horário do cron): amanhã é dia 5.
    const { inicio, fim } = amanhaNoBrasil(new Date("2026-11-04T11:00:00Z"));
    const dentro = (iso: string) => new Date(iso) >= inicio && new Date(iso) < fim;
    expect(dentro("2026-11-05T00:00:00Z")).toBe(true); // rotas de admin (YYYY-MM-DD)
    expect(dentro("2026-11-05T03:00:00Z")).toBe(true); // importação CSV (meia-noite local)
    expect(dentro("2026-11-04T03:00:00Z")).toBe(false); // hoje
    expect(dentro("2026-11-06T03:00:00Z")).toBe(false); // depois de amanhã
  });

  it("junta vários eventos numa notificação", () => {
    expect(mensagemDePrazos([])).toBeNull();
    expect(mensagemDePrazos([{ descricao: "Matrícula" }])?.body).toBe("Matrícula.");
    expect(
      mensagemDePrazos([{ descricao: "Matrícula" }, { descricao: "A" }, { descricao: "B" }])
    ).toEqual({
      title: "Amanhã no calendário acadêmico",
      body: "Matrícula e mais 2 eventos.",
      url: "/calendario",
    });
  });

  it("consulta os eventos de amanhã e só notifica se houver", async () => {
    calendarioRepository.findEventosIniciandoEntre.mockResolvedValue([]);
    await expect(notificarPrazosDeAmanha(new Date("2026-11-04T11:00:00Z"))).resolves.toEqual({
      enviados: 0,
      removidos: 0,
    });
    expect(calendarioRepository.findEventosIniciandoEntre).toHaveBeenCalledWith(
      new Date("2026-11-05T00:00:00Z"),
      new Date("2026-11-06T00:00:00Z")
    );
    expect(repository.tokensFor).not.toHaveBeenCalled();
  });
});

describe("prazos: execuções repetidas e validade", () => {
  // 2026-11-04 08:00 em João Pessoa, horário do cron.
  const agora = new Date("2026-11-04T11:00:00Z");

  beforeEach(() => {
    calendarioRepository.findEventosIniciandoEntre.mockResolvedValue([
      { descricao: "Último dia de trancamento" },
    ]);
    repository.tokensFor.mockResolvedValue(["ExponentPushToken[a]"]);
  });

  it("o lembrete expira na próxima meia-noite de João Pessoa", async () => {
    expect(fimDeHojeNoBrasil(agora)).toEqual(new Date("2026-11-05T03:00:00Z"));
    // 23:30 em João Pessoa ainda é o mesmo dia local.
    expect(fimDeHojeNoBrasil(new Date("2026-11-05T02:30:00Z"))).toEqual(
      new Date("2026-11-05T03:00:00Z")
    );

    repository.reservarEnvio.mockResolvedValue(true);
    const { mensagens } = spyExpo();
    await notificarPrazosDeAmanha(agora);

    expect(mensagens()[0]?.[0]?.expiration).toBe(Date.parse("2026-11-05T03:00:00Z") / 1000);
  });

  it("duas execuções do cron no mesmo dia enviam uma vez só", async () => {
    repository.reservarEnvio.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    const { spy } = spyExpo();

    const resultados = await Promise.all([
      notificarPrazosDeAmanha(agora),
      notificarPrazosDeAmanha(agora),
    ]);

    expect(repository.reservarEnvio).toHaveBeenCalledTimes(2);
    expect(repository.reservarEnvio).toHaveBeenCalledWith("prazos:2026-11-05");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(resultados).toContainEqual({ enviados: 0, removidos: 0 });
    expect(resultados).toContainEqual({ enviados: 1, removidos: 0 });
  });
});

describe("vaga nova", () => {
  it("aponta para a tela da vaga no app", async () => {
    repository.tokensFor.mockResolvedValue(["ExponentPushToken[a]"]);
    const { mensagens } = spyExpo();

    await notificarNovaVaga({ id: "v1", titulo: "Estágio", entidade: { nome: "ARIA" } });

    expect(repository.tokensFor).toHaveBeenCalledWith("vagas");
    expect(mensagens()[0]?.[0]?.data).toEqual({ url: "/vagas/v1" });
  });
});
