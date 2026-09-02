/** @jest-environment node */

const mockDeleteExpiredRuns = jest.fn();

jest.mock("@/lib/server/container", () => ({
  getContainer: () => ({
    sigaaRepository: { deleteExpiredRuns: mockDeleteExpiredRuns },
  }),
}));

import { GET } from "../route";

const SECRET = "retention-test-secret-at-least-32-characters";

describe("SIGAA retention cron", () => {
  const originalSecret = process.env.CRON_SECRET;
  const originalConnectorSecret = process.env.SIGAA_CONNECTOR_API_SECRET;

  afterAll(() => {
    if (originalSecret === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = originalSecret;
    }
    if (originalConnectorSecret === undefined) {
      delete process.env.SIGAA_CONNECTOR_API_SECRET;
    } else {
      process.env.SIGAA_CONNECTOR_API_SECRET = originalConnectorSecret;
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CRON_SECRET = SECRET;
    delete process.env.SIGAA_CONNECTOR_API_SECRET;
  });

  it("deletes only runs selected by the repository retention policy", async () => {
    mockDeleteExpiredRuns.mockResolvedValue({ deleted: 3 });
    const response = await GET(
      new Request("http://localhost/api/internal/sigaa/retention", {
        headers: { Authorization: `Bearer ${SECRET}` },
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ deleted: 3 });
    expect(mockDeleteExpiredRuns).toHaveBeenCalledTimes(1);
  });

  it("rejects a wrong secret before touching persistence", async () => {
    const response = await GET(
      new Request("http://localhost/api/internal/sigaa/retention", {
        headers: { Authorization: "Bearer wrong" },
      })
    );

    expect(response.status).toBe(401);
    expect(mockDeleteExpiredRuns).not.toHaveBeenCalled();
  });

  it("fails closed when the cron secret is missing or reused", async () => {
    delete process.env.CRON_SECRET;
    const missingResponse = await GET(new Request("http://localhost/api/internal/sigaa/retention"));
    expect(missingResponse.status).toBe(503);

    process.env.CRON_SECRET = SECRET;
    process.env.SIGAA_CONNECTOR_API_SECRET = SECRET;
    const reusedResponse = await GET(
      new Request("http://localhost/api/internal/sigaa/retention", {
        headers: { Authorization: `Bearer ${SECRET}` },
      })
    );
    delete process.env.SIGAA_CONNECTOR_API_SECRET;

    expect(reusedResponse.status).toBe(503);
    expect(mockDeleteExpiredRuns).not.toHaveBeenCalled();
  });
});
