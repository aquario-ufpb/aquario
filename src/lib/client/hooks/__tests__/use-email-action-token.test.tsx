import { renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { useEmailActionToken } from "../use-email-action-token";

describe("useEmailActionToken", () => {
  it.each([
    ["/resetar-senha?lang=pt#token=a%2Bb", "a+b", "?lang=pt"],
    ["/resetar-senha?lang=pt&token=legacy", "legacy", "?lang=pt"],
    ["/resetar-senha?token=old#token=new", "new", ""],
    ["/resetar-senha", null, ""],
  ])("consumes %s once, including under Strict Mode", (path, expected, search) => {
    window.history.replaceState({ test: true }, "", path as string);
    const { result, rerender } = renderHook(useEmailActionToken, { wrapper: StrictMode });
    rerender();
    expect(result.current).toBe(expected);
    expect(window.location.hash).toBe("");
    expect(window.location.search).toBe(search);
    expect(window.history.state).toEqual({ test: true });
  });
});
