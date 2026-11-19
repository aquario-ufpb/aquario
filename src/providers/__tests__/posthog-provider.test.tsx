import { render, waitFor } from "@testing-library/react";

import posthog from "posthog-js";

import { PostHogProvider } from "../posthog-provider";

jest.mock("posthog-js", () => ({
  __esModule: true,
  default: { init: jest.fn() },
}));
jest.mock("posthog-js/react", () => ({
  PostHogProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("@/lib/shared/config/env", () => ({
  POSTHOG_KEY: "phc_public-test-key",
  POSTHOG_VERBOSE: false,
  IS_DEV: false,
  IS_PROD: true,
}));

jest.mock("next/navigation", () => ({ usePathname: () => window.location.pathname }));

describe("PostHogProvider privacy", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.history.replaceState(null, "", "/");
  });

  it.each(["/resetar-senha?token=fixture", "/verificar-email/#token=fixture"])(
    "skips analytics on %s and initializes after leaving",
    path => {
      window.history.replaceState(null, "", path);
      const view = render(<PostHogProvider>account action</PostHogProvider>);
      expect(posthog.init).not.toHaveBeenCalled();
      window.history.replaceState(null, "", "/login");
      view.rerender(<PostHogProvider>login</PostHogProvider>);
      expect(posthog.init).toHaveBeenCalledTimes(1);
    }
  );
  it("blocks SIGAA private regions from replay and masks every input", async () => {
    render(<PostHogProvider>private content</PostHogProvider>);

    await waitFor(() => expect(posthog.init).toHaveBeenCalledTimes(1));
    expect(jest.mocked(posthog.init).mock.calls[0][1]).toMatchObject({
      disable_capture_url_hashes: true,
      disable_product_tours: true,
      custom_personal_data_properties: ["token"],
      session_recording: {
        blockSelector: ".ph-no-capture, [data-ph-no-capture='true']",
        maskAllInputs: true,
        recordBody: false,
        recordHeaders: false,
      },
    });
  });
});
