import { toSigaaIntegrationView } from "../view-model";
import type { SigaaImportedState } from "@/lib/client/api/sigaa";

const emptyState: SigaaImportedState = {
  matricula: { value: null, origin: null, verifiedAt: null },
  connection: null,
  snapshot: null,
};

describe("SIGAA integration view", () => {
  it("models the first connection without scattered flags", () => {
    expect(toSigaaIntegrationView(emptyState)).toEqual({ kind: "never_connected" });
  });

  it("preserves the last synchronization timestamp after disconnect", () => {
    expect(
      toSigaaIntegrationView({
        ...emptyState,
        connection: {
          status: "DISCONNECTED",
          consentVersion: "sigaa-v1-2026-08",
          consentedAt: "2026-08-21T12:00:00.000Z",
          connectedAt: "2026-08-21T12:01:00.000Z",
          disconnectedAt: "2026-08-21T13:00:00.000Z",
        },
        snapshot: {
          contractVersion: "1.0",
          connectorObservedAt: "2026-08-21T12:01:00.000Z",
          synchronizedAt: "2026-08-21T12:01:30.000Z",
          upstreamCommit: "a".repeat(40),
          installedByRunId: null,
          payload: {
            identity: { matricula: "20260000001", sourceCourse: null, sourceSemester: null },
            curriculum: {
              code: "2026",
              maximumCompletionTerm: null,
              semesterWorkload: { minimum: null, maximum: null },
              cra: { value: null, source: "unavailable" },
              progress: [],
              components: [],
            },
            grades: [],
            classes: [],
          },
        },
      })
    ).toEqual({ kind: "disconnected", synchronizedAt: "2026-08-21T12:01:30.000Z" });
  });
});
