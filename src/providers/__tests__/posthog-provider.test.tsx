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

describe("PostHogProvider privacy", () => {
  it("blocks SIGAA private regions from replay and masks every input", async () => {
    render(<PostHogProvider>private content</PostHogProvider>);

    await waitFor(() => expect(posthog.init).toHaveBeenCalledTimes(1));
    expect(jest.mocked(posthog.init).mock.calls[0][1]).toMatchObject({
      session_recording: {
        blockSelector: ".ph-no-capture, [data-ph-no-capture='true']",
        maskAllInputs: true,
      },
    });
  });
});
