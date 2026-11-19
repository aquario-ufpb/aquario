import { forgotPassword, type ForgotPasswordDependencies } from "../forgot-password";
import { MockEmailService } from "@/lib/server/services/email/mock-email-service";

jest.mock("@/lib/server/config/env", () => ({ EMAIL_ENABLED: false, IS_PROD: true }));

it("does not issue recovery credentials in production when email is unavailable", async () => {
  const emailService = new MockEmailService();
  const deps = {
    usuariosRepository: { findByEmail: jest.fn() },
    tokenVerificacaoRepository: { create: jest.fn() },
    emailService,
  } as unknown as ForgotPasswordDependencies;
  const result = await forgotPassword({ email: "fixture@example.invalid" }, deps);
  expect(result.message).toContain("Se o email estiver cadastrado");
  expect(deps.usuariosRepository.findByEmail).not.toHaveBeenCalled();
  expect(deps.tokenVerificacaoRepository.create).not.toHaveBeenCalled();
  expect(emailService.sentEmails).toHaveLength(0);
});

it("keeps verification and recovery credentials out of mock transport logs", async () => {
  const info = jest.spyOn(console, "info").mockImplementation(() => {});
  try {
    const email = new MockEmailService();
    await email.sendPasswordResetEmail(
      "fixture@example.invalid",
      "synthetic-reset-token",
      "Fixture"
    );
    await email.sendVerificationEmail(
      "fixture@example.invalid",
      "synthetic-verify-token",
      "Fixture"
    );
    expect(JSON.stringify(info.mock.calls)).not.toMatch(/synthetic-(reset|verify)-token/);
  } finally {
    info.mockRestore();
  }
});
