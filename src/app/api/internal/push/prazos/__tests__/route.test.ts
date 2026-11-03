/** @jest-environment node */
import { GET } from "../route";
import { notificarPrazosDeAmanha } from "@/lib/server/services/push/notificacoes";

jest.mock("@/lib/server/services/push/notificacoes", () => ({
  notificarPrazosDeAmanha: jest.fn(),
}));

const request = (authorization?: string) =>
  new Request("http://localhost/api/internal/push/prazos", {
    headers: authorization ? { Authorization: authorization } : {},
  });

beforeEach(() => {
  jest.clearAllMocks();
  process.env.CRON_SECRET = "segredo-do-cron";
});

afterAll(() => {
  delete process.env.CRON_SECRET;
});

describe("cron de prazos", () => {
  it("só roda com o segredo do cron", async () => {
    expect((await GET(request())).status).toBe(401);
    expect((await GET(request("Bearer outro-segredo"))).status).toBe(401);
    expect(notificarPrazosDeAmanha).not.toHaveBeenCalled();
  });

  it("notifica os prazos de amanhã", async () => {
    (notificarPrazosDeAmanha as jest.Mock).mockResolvedValue({ enviados: 3, removidos: 1 });

    const response = await GET(request("Bearer segredo-do-cron"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ enviados: 3, removidos: 1 });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("fica indisponível sem configuração", async () => {
    delete process.env.CRON_SECRET;
    expect((await GET(request("Bearer x"))).status).toBe(503);
  });
});
