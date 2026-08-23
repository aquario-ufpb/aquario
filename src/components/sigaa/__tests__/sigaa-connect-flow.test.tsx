import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SigaaConnectFlow } from "../sigaa-connect-flow";

describe("SigaaConnectFlow", () => {
  it("renders inline, uses the supplied exit label, and clears credentials before exiting", async () => {
    const user = userEvent.setup();
    let usernameInput: HTMLInputElement | null = null;
    const onExit = jest.fn(() => {
      expect(usernameInput?.value).toBe("");
      expect(screen.getByLabelText("Senha do SIGAA")).toHaveValue("");
      expect(screen.getByLabelText("Senha do Aquário")).toHaveValue("");
    });

    render(
      <SigaaConnectFlow
        requireConsent
        onSynchronized={jest.fn()}
        onExit={onExit}
        exitLabel="Configurar manualmente"
      />
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    usernameInput = screen.getByLabelText<HTMLInputElement>("Usuário do SIGAA");
    await user.type(usernameInput, "student");
    await user.type(screen.getByLabelText("Senha do SIGAA"), "temporary-sigaa-password");
    await user.type(screen.getByLabelText("Senha do Aquário"), "temporary-aquario-password");

    await user.click(screen.getByRole("button", { name: "Configurar manualmente" }));

    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("generates non-conflicting form and description ids for concurrent instances", () => {
    const { container } = render(
      <>
        <SigaaConnectFlow requireConsent onSynchronized={jest.fn()} onExit={jest.fn()} />
        <SigaaConnectFlow requireConsent onSynchronized={jest.fn()} onExit={jest.fn()} />
      </>
    );

    const ids = Array.from(container.querySelectorAll("[id]"), element => element.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const input of container.querySelectorAll("input[aria-describedby]")) {
      const describedBy = input.getAttribute("aria-describedby")?.split(" ") ?? [];
      for (const id of describedBy) {
        expect(document.getElementById(id)).not.toBeNull();
      }
    }
  });

  it("moves focus to the visible heading when embedded in onboarding", () => {
    render(
      <SigaaConnectFlow
        requireConsent
        onSynchronized={jest.fn()}
        onExit={jest.fn()}
        autoFocusHeading
      />
    );

    expect(screen.getByRole("heading", { name: "Conectar ao SIGAA" })).toHaveFocus();
  });
});
