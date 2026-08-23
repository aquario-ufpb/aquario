import { getSigaaMenuStatus } from "../sigaa-menu-status-view";

describe("getSigaaMenuStatus", () => {
  it.each([
    ["loading", "unknown", "Consultando SIGAA", "neutral"],
    ["error", "error", "Ver conexão do SIGAA", "neutral"],
  ] as const)("maps %s without implying a connection", (input, state, label, tone) => {
    expect(getSigaaMenuStatus(input)).toMatchObject({ connectionState: state, label, tone });
  });

  it("uses green only for a fully connected snapshot", () => {
    expect(
      getSigaaMenuStatus({
        kind: "connected",
        synchronizedAt: "2026-08-23T12:00:00.000Z",
        matricula: "redacted",
      })
    ).toMatchObject({
      connectionState: "connected",
      label: "SIGAA conectado",
      tone: "positive",
    });
  });

  it.each([
    [{ kind: "pending" } as const, "pending", "Concluir conexão"],
    [
      { kind: "disconnected", synchronizedAt: "2026-08-23T12:00:00.000Z" } as const,
      "disconnected",
      "Reconectar ao SIGAA",
    ],
  ])("uses attention styling for an incomplete state", (input, state, label) => {
    expect(getSigaaMenuStatus(input)).toMatchObject({
      connectionState: state,
      label,
      tone: "attention",
    });
  });

  it("keeps a never-connected account neutral", () => {
    expect(getSigaaMenuStatus({ kind: "never_connected" })).toMatchObject({
      connectionState: "never_connected",
      label: "Conectar ao SIGAA",
      tone: "neutral",
    });
  });
});
