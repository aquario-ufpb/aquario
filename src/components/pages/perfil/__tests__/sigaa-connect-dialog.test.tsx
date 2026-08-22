import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SigaaConnectDialog } from "../sigaa-connect-dialog";
import { reauthenticateForSigaa } from "@/lib/client/api/sigaa-reauth";
import {
  confirmOwnSigaaCourseChange,
  SigaaCourseChangeInvalidError,
  SigaaCourseChangeRequiredError,
  synchronizeOwnSigaa,
} from "@/lib/client/api/sigaa";

jest.mock("@/lib/client/api/sigaa-reauth", () => ({ reauthenticateForSigaa: jest.fn() }));
jest.mock("@/lib/client/api/sigaa", () => {
  const actual = jest.requireActual("@/lib/client/api/sigaa");
  return {
    ...actual,
    synchronizeOwnSigaa: jest.fn(),
    confirmOwnSigaaCourseChange: jest.fn(),
  };
});

const mockReauthenticate = jest.mocked(reauthenticateForSigaa);
const mockSynchronize = jest.mocked(synchronizeOwnSigaa);
const mockConfirmCourseChange = jest.mocked(confirmOwnSigaaCourseChange);

describe("SIGAA connect dialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockReauthenticate.mockResolvedValue({
      proofToken: "short-lived-proof",
      expiresAt: "2026-08-21T12:15:00.000Z",
    });
    mockSynchronize.mockResolvedValue({
      status: "synchronized",
      synchronizedAt: "2026-08-21T12:00:00.000Z",
      run: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "SUCCEEDED",
        failureCode: null,
        connectorRequestId: "request-id",
        startedAt: "2026-08-21T11:59:00.000Z",
        finishedAt: "2026-08-21T12:00:00.000Z",
      },
    });
    mockConfirmCourseChange.mockResolvedValue({
      status: "synchronized",
      synchronizedAt: "2026-08-21T12:00:00.000Z",
      courseReplaced: true,
      run: {
        id: "550e8400-e29b-41d4-a716-446655440010",
        status: "SUCCEEDED",
        failureCode: null,
        connectorRequestId: "confirmation-request-id",
        startedAt: "2026-08-21T11:59:00.000Z",
        finishedAt: "2026-08-21T12:00:00.000Z",
      },
    });
  });

  it("exposes labeled secret fields and requires explicit consent", async () => {
    const user = userEvent.setup();
    render(
      <SigaaConnectDialog open requireConsent onOpenChange={jest.fn()} onSynchronized={jest.fn()} />
    );

    expect(screen.getByRole("dialog", { name: "Conectar ao SIGAA" })).toBeInTheDocument();
    expect(screen.getByLabelText("Usuário do SIGAA")).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText("Senha do SIGAA")).toHaveAttribute(
      "autocomplete",
      "current-password"
    );
    expect(screen.getByLabelText("Senha do Aquário")).toHaveAttribute(
      "autocomplete",
      "current-password"
    );

    await user.type(screen.getByLabelText("Usuário do SIGAA"), "student");
    await user.type(screen.getByLabelText("Senha do SIGAA"), "example-sigaa-password");
    await user.type(screen.getByLabelText("Senha do Aquário"), "example-aquario-password");
    await user.click(screen.getByRole("button", { name: "Conectar e sincronizar" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Confirme o consentimento");
    expect(mockReauthenticate).not.toHaveBeenCalled();
  });

  it("passes the proof directly to a single synchronization call", async () => {
    const user = userEvent.setup();
    const onSynchronized = jest.fn();
    render(
      <SigaaConnectDialog
        open
        requireConsent
        onOpenChange={jest.fn()}
        onSynchronized={onSynchronized}
      />
    );

    await user.click(screen.getByLabelText(/Autorizo o Aquário/));
    await user.type(screen.getByLabelText("Usuário do SIGAA"), "student");
    await user.type(screen.getByLabelText("Senha do SIGAA"), "example-sigaa-password");
    await user.type(screen.getByLabelText("Senha do Aquário"), "example-aquario-password");
    await user.click(screen.getByRole("button", { name: "Conectar e sincronizar" }));

    expect(mockReauthenticate).toHaveBeenCalledTimes(1);
    expect(mockSynchronize).toHaveBeenCalledTimes(1);
    expect(mockSynchronize).toHaveBeenCalledWith(
      expect.objectContaining({ username: "student", proofToken: "short-lived-proof" })
    );
    expect(onSynchronized).toHaveBeenCalledTimes(1);
  });

  it("reuses the idempotency key after an ambiguous network failure", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    mockSynchronize
      .mockRejectedValueOnce(new TypeError("network interrupted"))
      .mockResolvedValueOnce({
        status: "synchronized",
        synchronizedAt: "2026-08-21T12:00:00.000Z",
        run: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          status: "SUCCEEDED",
          failureCode: null,
          connectorRequestId: "request-id",
          startedAt: "2026-08-21T11:59:00.000Z",
          finishedAt: "2026-08-21T12:00:00.000Z",
        },
      });

    render(
      <SigaaConnectDialog
        open
        requireConsent
        onOpenChange={onOpenChange}
        onSynchronized={jest.fn()}
      />
    );

    const fillAndSubmit = async () => {
      await user.click(screen.getByLabelText(/Autorizo o Aquário/));
      await user.type(screen.getByLabelText("Usuário do SIGAA"), "student");
      await user.type(screen.getByLabelText("Senha do SIGAA"), "example-sigaa-password");
      await user.type(screen.getByLabelText("Senha do Aquário"), "example-aquario-password");
      await user.click(screen.getByRole("button", { name: "Conectar e sincronizar" }));
    };

    await fillAndSubmit();
    expect(await screen.findByRole("alert")).toHaveTextContent("network interrupted");
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Usuário do SIGAA")).toHaveValue("");
    expect(screen.getByLabelText("Senha do SIGAA")).toHaveValue("");
    expect(screen.getByLabelText("Senha do Aquário")).toHaveValue("");
    await fillAndSubmit();

    const firstKey = mockSynchronize.mock.calls[0][0].idempotencyKey;
    const secondKey = mockSynchronize.mock.calls[1][0].idempotencyKey;
    expect(mockSynchronize.mock.calls.map(([input]) => input.username)).toEqual([
      "student",
      "student",
    ]);
    expect(secondKey).toBe(firstKey);
  });

  it("starts a new operation when the username changes after an ambiguous failure", async () => {
    const user = userEvent.setup();
    mockSynchronize
      .mockRejectedValueOnce(new TypeError("network interrupted"))
      .mockResolvedValueOnce({
        status: "synchronized",
        synchronizedAt: "2026-08-21T12:00:00.000Z",
        run: {
          id: "550e8400-e29b-41d4-a716-446655440000",
          status: "SUCCEEDED",
          failureCode: null,
          connectorRequestId: "request-id",
          startedAt: "2026-08-21T11:59:00.000Z",
          finishedAt: "2026-08-21T12:00:00.000Z",
        },
      });

    render(
      <SigaaConnectDialog open requireConsent onOpenChange={jest.fn()} onSynchronized={jest.fn()} />
    );

    const submit = async (username: string) => {
      await user.click(screen.getByLabelText(/Autorizo o Aquário/));
      await user.type(screen.getByLabelText("Usuário do SIGAA"), username);
      await user.type(screen.getByLabelText("Senha do SIGAA"), "example-sigaa-password");
      await user.type(screen.getByLabelText("Senha do Aquário"), "example-aquario-password");
      await user.click(screen.getByRole("button", { name: "Conectar e sincronizar" }));
    };

    await submit("student-one");
    expect(await screen.findByRole("alert")).toHaveTextContent("network interrupted");
    await submit("student-two");

    expect(mockSynchronize.mock.calls[1][0].idempotencyKey).not.toBe(
      mockSynchronize.mock.calls[0][0].idempotencyKey
    );
  });

  it("shows before and after, clears secrets, and requires explicit irreversible confirmation", async () => {
    const user = userEvent.setup();
    const onSynchronized = jest.fn();
    mockSynchronize.mockRejectedValueOnce(
      new SigaaCourseChangeRequiredError({
        message: "O SIGAA informou um curso diferente do perfil.",
        code: "SIGAA_COURSE_MISMATCH",
        resolution: "confirmation_required",
        proposalId: "550e8400-e29b-41d4-a716-446655440020",
        expiresAt: "2026-08-21T12:10:00.000Z",
        currentCourse: "Ciência da Computação",
        sigaaCourse: "Engenharia de Computação - Graduação",
        targetCourse: "Engenharia da Computação",
      })
    );

    render(
      <SigaaConnectDialog
        open
        requireConsent
        onOpenChange={jest.fn()}
        onSynchronized={onSynchronized}
      />
    );

    await user.click(screen.getByLabelText(/Autorizo o Aquário/));
    await user.type(screen.getByLabelText("Usuário do SIGAA"), "first-user");
    await user.type(screen.getByLabelText("Senha do SIGAA"), "first-sigaa-password");
    await user.type(screen.getByLabelText("Senha do Aquário"), "first-aquario-password");
    await user.click(screen.getByRole("button", { name: "Conectar e sincronizar" }));

    expect(await screen.findByText("Ciência da Computação")).toBeInTheDocument();
    expect(screen.getByText("Engenharia da Computação")).toBeInTheDocument();
    expect(screen.getByText(/Engenharia de Computação - Graduação/)).toBeInTheDocument();
    expect(screen.getByText(/Esta ação é irreversível no Aquário\./)).toBeInTheDocument();
    expect(screen.getByLabelText("Usuário do SIGAA")).toHaveValue("");
    expect(screen.getByLabelText("Senha do SIGAA")).toHaveValue("");
    expect(screen.getByLabelText("Senha do Aquário")).toHaveValue("");

    await user.type(screen.getByLabelText("Usuário do SIGAA"), "fresh-user");
    await user.type(screen.getByLabelText("Senha do SIGAA"), "fresh-sigaa-password");
    await user.type(screen.getByLabelText("Senha do Aquário"), "fresh-aquario-password");
    await user.click(screen.getByRole("button", { name: "Substituir meu curso e sincronizar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("irreversível");
    expect(mockConfirmCourseChange).not.toHaveBeenCalled();

    await user.click(screen.getByLabelText(/Entendo que meu curso será substituído/));
    await user.click(screen.getByRole("button", { name: "Substituir meu curso e sincronizar" }));

    expect(mockConfirmCourseChange).toHaveBeenCalledWith(
      expect.objectContaining({
        proposalId: "550e8400-e29b-41d4-a716-446655440020",
        username: "fresh-user",
        password: "fresh-sigaa-password",
        proofToken: "short-lived-proof",
      })
    );
    expect(mockConfirmCourseChange.mock.calls[0][0].idempotencyKey).not.toBe(
      mockSynchronize.mock.calls[0][0].idempotencyKey
    );
    expect(mockReauthenticate).toHaveBeenLastCalledWith(
      "fresh-aquario-password",
      "550e8400-e29b-41d4-a716-446655440020"
    );
    expect(onSynchronized).toHaveBeenCalledWith(true);
  });

  it("returns to fresh credentials when a confirmation is stale", async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();
    const mismatch = {
      message: "Curso divergente",
      code: "SIGAA_COURSE_MISMATCH" as const,
      resolution: "confirmation_required" as const,
      proposalId: "550e8400-e29b-41d4-a716-446655440020",
      expiresAt: "2026-08-21T12:10:00.000Z",
      currentCourse: "Ciência da Computação",
      sigaaCourse: "Engenharia de Computação - Graduação",
      targetCourse: "Engenharia da Computação",
    };
    mockSynchronize.mockRejectedValueOnce(new SigaaCourseChangeRequiredError(mismatch));
    mockConfirmCourseChange.mockRejectedValueOnce(
      new SigaaCourseChangeInvalidError({
        message: "A proposta de substituição de curso não é mais válida.",
        code: "SIGAA_COURSE_MISMATCH",
        resolution: "stale",
      })
    );
    render(
      <SigaaConnectDialog
        open
        requireConsent
        onOpenChange={onOpenChange}
        onSynchronized={jest.fn()}
      />
    );

    await user.click(screen.getByLabelText(/Autorizo o Aquário/));
    await user.type(screen.getByLabelText("Usuário do SIGAA"), "first-user");
    await user.type(screen.getByLabelText("Senha do SIGAA"), "first-password");
    await user.type(screen.getByLabelText("Senha do Aquário"), "first-aquario");
    await user.click(screen.getByRole("button", { name: "Conectar e sincronizar" }));
    await screen.findByText("Confirmar substituição de curso");
    await user.type(screen.getByLabelText("Usuário do SIGAA"), "fresh-user");
    await user.type(screen.getByLabelText("Senha do SIGAA"), "fresh-password");
    await user.type(screen.getByLabelText("Senha do Aquário"), "fresh-aquario");
    await user.click(screen.getByLabelText(/Entendo que meu curso será substituído/));
    await user.click(screen.getByRole("button", { name: "Substituir meu curso e sincronizar" }));

    expect(await screen.findByText("Conectar ao SIGAA")).toBeInTheDocument();
    expect(screen.queryByText("Confirmar substituição de curso")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Inicie uma nova sincronização");
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
