import { getSigaaMenuStatus } from "../sigaa-menu-status-view";

describe("getSigaaMenuStatus", () => {
  it("keeps authentication bootstrap neutral", () => {
    expect(getSigaaMenuStatus({ availability: "checking" })).toMatchObject({
      connectionState: "unknown",
      label: "SIGAA",
      pulseIcon: false,
    });
  });

  it("keeps the visible label stable while checking", () => {
    expect(
      getSigaaMenuStatus({ availability: "available", connection: { status: "checking" } })
    ).toMatchObject({ connectionState: "unknown", label: "SIGAA", tone: "neutral" });
  });

  it("maps a connection error without implying a connection", () => {
    expect(
      getSigaaMenuStatus({ availability: "available", connection: { status: "error" } })
    ).toMatchObject({ connectionState: "error", label: "Ver conexão do SIGAA", tone: "neutral" });
  });

  it("uses green only for a fully connected snapshot", () => {
    expect(
      getSigaaMenuStatus({
        availability: "available",
        connection: {
          status: "ready",
          view: {
            kind: "connected",
            synchronizedAt: "2026-08-23T12:00:00.000Z",
            matricula: "redacted",
          },
        },
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
    expect(
      getSigaaMenuStatus({
        availability: "available",
        connection: { status: "ready", view: input },
      })
    ).toMatchObject({
      connectionState: state,
      label,
      tone: "attention",
    });
  });

  it("keeps a never-connected account neutral", () => {
    expect(
      getSigaaMenuStatus({
        availability: "available",
        connection: { status: "ready", view: { kind: "never_connected" } },
      })
    ).toMatchObject({
      connectionState: "never_connected",
      label: "Conectar ao SIGAA",
      tone: "neutral",
    });
  });
});
