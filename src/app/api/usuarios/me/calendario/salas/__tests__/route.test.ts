/** @jest-environment node */
import { GET, POST, DELETE } from "../route";
import { getContainer } from "@/lib/server/container";
import { getPublishedSaciAllocation } from "@/lib/server/services/calendario/saci";
const owner = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  cursoId: "course",
  centro: { sigla: "CI" },
};
jest.mock("@/lib/server/services/auth/middleware", () => ({
  withAuth: (req: Request, handler: (req: Request, user: typeof owner) => Promise<Response>) =>
    handler(req, owner),
}));
jest.mock("@/lib/server/container", () => ({ getContainer: jest.fn() }));
jest.mock("@/lib/server/services/calendario/saci", () => ({
  getPublishedSaciAllocation: jest.fn(),
}));
const repository = { list: jest.fn(), save: jest.fn(), delete: jest.fn() };
const read = jest.fn();
const source = { sourceKey: "internal123", code: "EDO1", scheduleRaw: "35M23", semester: "2026.2" };
const allocation = {
  id: 100,
  codigo: "EDO1",
  turma: "07",
  horario: "35M23",
  room: { bloco: "CI", nome: "106" },
};
const request = (body: unknown, method = "POST") =>
  new Request("http://localhost/api/usuarios/me/calendario/salas", {
    method,
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
const body = { semester: "2026.2", sourceKey: "internal123", allocationId: 100 };
beforeEach(() => {
  jest.clearAllMocks();
  (getContainer as jest.Mock).mockReturnValue({
    calendarRoomBindingRepository: repository,
    sigaaRepository: { readImportedState: read },
  });
  read.mockResolvedValue({
    connection: { status: "CONNECTED" },
    snapshot: { payload: { identity: { sourceSemester: "2026.2" }, classes: [source] } },
  });
  (getPublishedSaciAllocation as jest.Mock).mockResolvedValue({
    semester: "2026.2",
    allocations: [allocation],
  });
  repository.list.mockResolvedValue([]);
  repository.save.mockResolvedValue(undefined);
});
it("reads and deletes only the authenticated owner's course-specific preferences", async () => {
  const response = await GET(
    new Request("http://localhost/api/usuarios/me/calendario/salas?semestre=2026.2")
  );
  expect(repository.list).toHaveBeenCalledWith(owner.id, "course", "2026.2");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("vary")).toBe("Authorization");
  await DELETE(request({ semester: "2026.2", sourceKey: "internal123" }, "DELETE"));
  expect(repository.delete).toHaveBeenCalledWith(owner.id, "course", "2026.2", "internal123");
});
it("derives section/code/center/timetable from the owned snapshot and public allocation, without trusting client fields", async () => {
  const response = await POST(request(body));
  expect(response.status).toBe(200);
  expect(repository.save).toHaveBeenCalledWith(
    owner.id,
    "course",
    expect.objectContaining({
      sourceKey: "internal123",
      allocationId: 100,
      section: "07",
      centerId: "CI",
      code: "EDO1",
    })
  );
  expect((await POST(request({ ...body, section: "forged" }))).status).toBe(400);
});
it("rejects a source key absent from the owner's snapshot before reading SACI", async () => {
  expect((await POST(request({ ...body, sourceKey: "someone-else" }))).status).toBe(409);
  expect(getPublishedSaciAllocation).not.toHaveBeenCalled();
  expect(repository.save).not.toHaveBeenCalled();
});
it("rejects stale semesters and wrong timetables even when the SACI id exists", async () => {
  (getPublishedSaciAllocation as jest.Mock).mockResolvedValueOnce({
    semester: "2026.1",
    allocations: [allocation],
  });
  expect((await POST(request(body))).status).toBe(409);
  (getPublishedSaciAllocation as jest.Mock).mockResolvedValueOnce({
    semester: "2026.2",
    allocations: [{ ...allocation, horario: "2T34" }],
  });
  expect((await POST(request(body))).status).toBe(409);
  expect(repository.save).not.toHaveBeenCalled();
});
it("rejects missing/ambiguous rooms and disconnected imports", async () => {
  (getPublishedSaciAllocation as jest.Mock).mockResolvedValueOnce({
    semester: "2026.2",
    allocations: [allocation, allocation],
  });
  expect((await POST(request(body))).status).toBe(409);
  read.mockResolvedValue({ connection: { status: "DISCONNECTED" }, snapshot: null });
  expect((await POST(request(body))).status).toBe(409);
  expect(repository.save).not.toHaveBeenCalled();
});
it("rejects malformed or oversized inputs and keeps error responses private", async () => {
  expect((await POST(new Request("http://localhost", { method: "POST", body: "{" }))).status).toBe(
    400
  );
  expect((await POST(request({ ...body, sourceKey: "x".repeat(9000) }))).status).toBe(400);
  repository.list.mockRejectedValueOnce(new Error("db"));
  const result = await GET(new Request("http://localhost?semestre=2026.2"));
  expect(result.status).toBe(503);
  expect(result.headers.get("cache-control")).toBe("private, no-store");
});

it.each(["", "x".repeat(65)])(
  "rejects invalid derived SACI section %j before saving",
  async section => {
    (getPublishedSaciAllocation as jest.Mock).mockResolvedValueOnce({
      semester: "2026.2",
      allocations: [{ ...allocation, turma: section }],
    });
    expect((await POST(request(body))).status).toBe(409);
    expect(repository.save).not.toHaveBeenCalled();
  }
);
