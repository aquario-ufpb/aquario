import { fireEvent, render, screen } from "@testing-library/react";
import { StrictMode } from "react";
import { authService } from "@/lib/client/api/auth";
import VerificarEmail from "../page";

jest.mock("@/lib/client/api/auth", () => ({ authService: { verifyEmail: jest.fn() } }));
jest.mock("@/contexts/auth-context", () => ({ useAuth: () => ({ token: null }) }));
jest.mock("@/lib/client/hooks/use-usuarios", () => ({ useCurrentUser: () => ({}) }));

it("retries verification with the retained token after a failed request", async () => {
  const verify = jest.mocked(authService.verifyEmail);
  verify
    .mockRejectedValueOnce(new Error("Falha de conexão"))
    .mockResolvedValueOnce({ success: true, message: "OK" });
  window.history.replaceState(null, "", "/verificar-email#token=fixture");
  render(
    <StrictMode>
      <VerificarEmail />
    </StrictMode>
  );
  await screen.findByText("Falha de conexão");
  expect(window.location.hash).toBe("");
  expect(verify).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Tentar verificar novamente" }));
  await screen.findByRole("heading", { name: "Email verificado!" });
  expect(verify.mock.calls).toEqual([["fixture"], ["fixture"]]);
});
