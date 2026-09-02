import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { trackEvent } from "@/analytics/posthog-client";
import { reauthenticateForSigaa } from "@/lib/client/api/sigaa-reauth";

import { SigaaSensitiveActionDialog } from "../sigaa-sensitive-action-dialog";

jest.mock("@/analytics/posthog-client", () => ({ trackEvent: jest.fn() }));
jest.mock("@/lib/client/api/sigaa-reauth", () => ({ reauthenticateForSigaa: jest.fn() }));

describe("SIGAA sensitive action dialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(reauthenticateForSigaa).mockResolvedValue({
      proofToken: "short-lived-proof",
      expiresAt: "2026-08-22T12:15:00.000Z",
    });
  });

  it("blocks capture and emits only the bounded action on success", async () => {
    const user = userEvent.setup();
    const action = jest.fn().mockResolvedValue(undefined);
    render(
      <SigaaSensitiveActionDialog
        open
        title="Desconectar do SIGAA"
        description="Preserva o snapshot."
        confirmLabel="Desconectar"
        pendingLabel="Desconectando…"
        actionName="disconnect"
        onOpenChange={jest.fn()}
        action={action}
        onCompleted={jest.fn()}
      />
    );

    expect(screen.getByRole("dialog")).toHaveClass("ph-no-capture");
    await user.type(screen.getByLabelText("Senha do Aquário"), "private-password");
    await user.click(screen.getByRole("button", { name: "Desconectar" }));

    expect(action).toHaveBeenCalledWith("short-lived-proof");
    expect(trackEvent).toHaveBeenNthCalledWith(1, "sigaa_sensitive_action_started", {
      action: "disconnect",
    });
    expect(trackEvent).toHaveBeenNthCalledWith(2, "sigaa_sensitive_action_succeeded", {
      action: "disconnect",
    });
    expect(jest.mocked(trackEvent).mock.calls.flat()).not.toContain("private-password");
  });
});
