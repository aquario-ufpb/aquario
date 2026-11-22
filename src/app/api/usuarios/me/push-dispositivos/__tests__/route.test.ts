/** @jest-environment node */
import { DELETE, GET, PUT } from "../route";
import { getContainer } from "@/lib/server/container";

const owner = { id: "550e8400-e29b-41d4-a716-446655440001" };
jest.mock("@/lib/server/services/auth/middleware", () => ({
  withAuth: (req: Request, handler: (req: Request, user: typeof owner) => Promise<Response>) =>
    handler(req, owner),
}));
jest.mock("@/lib/server/container", () => ({ getContainer: jest.fn() }));

const repository = { find: jest.fn(), upsert: jest.fn(), delete: jest.fn() };
const token = "ExponentPushToken[abc123]";
const url = (query = "") => `http://localhost/api/usuarios/me/push-dispositivos${query}`;
const put = (body: unknown) =>
  PUT(
    new Request(url(), {
      method: "PUT",
      body: typeof body === "string" ? body : JSON.stringify(body),
    })
  );
const preferencias = { prazos: true, vagas: false, entidades: true };

beforeEach(() => {
  jest.clearAllMocks();
  (getContainer as jest.Mock).mockReturnValue({ pushDispositivosRepository: repository });
});

describe("push-dispositivos", () => {
  it("registra o aparelho na conta autenticada", async () => {
    const response = await put({ token, plataforma: "android", preferencias });

    expect(response.status).toBe(200);
    expect(repository.upsert).toHaveBeenCalledWith(owner.id, {
      token,
      plataforma: "android",
      preferencias,
    });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("vary")).toBe("Authorization");
  });

  it("recusa token, plataforma ou preferências inválidos", async () => {
    for (const body of [
      { token: "qualquer-coisa", plataforma: "android", preferencias },
      { token, plataforma: "windows", preferencias },
      { token, plataforma: "ios", preferencias: { prazos: "sim" } },
      "{json quebrado",
    ]) {
      expect((await put(body)).status).toBe(400);
    }
    expect(repository.upsert).not.toHaveBeenCalled();
  });

  it("recusa corpo grande demais", async () => {
    const response = await put({ token, plataforma: "ios", preferencias, extra: "x".repeat(4096) });
    expect(response.status).toBe(400);
  });

  it("lê as preferências só deste aparelho e desta conta", async () => {
    repository.find.mockResolvedValueOnce(preferencias).mockResolvedValueOnce(null);

    const registrado = await GET(new Request(url(`?token=${encodeURIComponent(token)}`)));
    expect(await registrado.json()).toEqual({ registrado: true, preferencias });
    expect(repository.find).toHaveBeenCalledWith(owner.id, token);

    const novo = await GET(new Request(url(`?token=${encodeURIComponent(token)}`)));
    expect(await novo.json()).toEqual({
      registrado: false,
      preferencias: { prazos: false, vagas: false, entidades: false },
    });

    expect((await GET(new Request(url("?token=x")))).status).toBe(400);
  });

  it("remove o aparelho da conta no logout", async () => {
    const response = await DELETE(
      new Request(url(`?token=${encodeURIComponent(token)}`), { method: "DELETE" })
    );

    expect(response.status).toBe(204);
    expect(repository.delete).toHaveBeenCalledWith(owner.id, token);
  });

  it("devolve erro genérico se o banco falhar", async () => {
    repository.upsert.mockRejectedValueOnce(new Error("db"));
    const response = await put({ token, plataforma: "android", preferencias });
    expect(response.status).toBe(500);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});
