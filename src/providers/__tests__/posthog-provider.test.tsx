import { render, screen, waitFor } from "@testing-library/react";

import posthog from "posthog-js";

import { PostHogProvider } from "../posthog-provider";

jest.mock("posthog-js", () => ({
  __esModule: true,
  default: { init: jest.fn(), stopSessionRecording: jest.fn(), startSessionRecording: jest.fn() },
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
  it.each(["/resetar-senha", "/verificar-email"])(
    "stops replay before mounting %s on client navigation and resumes after leaving",
    path => {
      const view = render(<PostHogProvider>public</PostHogProvider>);
      const maskRequest = jest.mocked(posthog.init).mock.calls[0][1]?.session_recording
        ?.maskCapturedNetworkRequestFn;
      const metadata = {
        name: new URL(path + "#token=fixture", window.location.href).href,
        entryType: "resource",
        startTime: 0,
        duration: 0,
      };
      expect(maskRequest?.(metadata)).toBeNull();
      const publicRequest = { ...metadata, name: "/catalogo" };
      expect(maskRequest?.(publicRequest)).toEqual(publicRequest);
      expect(maskRequest?.({ ...metadata, name: "http://[" })).toBeNull();
      jest.mocked(posthog.stopSessionRecording).mockImplementationOnce(() => {
        expect(screen.queryByText("private")).not.toBeInTheDocument();
      });
      window.history.pushState(null, "", path);
      view.rerender(<PostHogProvider>private</PostHogProvider>);
      expect(posthog.stopSessionRecording).toHaveBeenCalledTimes(1);
      expect(screen.getByText("private")).toBeInTheDocument();
      jest.mocked(posthog.startSessionRecording).mockImplementationOnce(() => {
        expect(screen.queryByText("private")).not.toBeInTheDocument();
      });
      window.history.pushState(null, "", "/login");
      view.rerender(<PostHogProvider>public</PostHogProvider>);
      expect(posthog.startSessionRecording).toHaveBeenCalledTimes(1);
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
