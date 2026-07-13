import { isUserAdminOfEntidade, type Membro } from "../membro.types";

const activeAdmin: Membro = {
  id: "membro-1",
  usuario: { id: "user-1", nome: "User" },
  papel: "ADMIN",
  cargo: null,
  startedAt: "2026-01-01T00:00:00.000Z",
  endedAt: null,
};

describe("isUserAdminOfEntidade", () => {
  it("requires an active admin membership", () => {
    expect(isUserAdminOfEntidade("user-1", [activeAdmin])).toBe(true);
    expect(
      isUserAdminOfEntidade("user-1", [{ ...activeAdmin, endedAt: "2026-02-01T00:00:00.000Z" }])
    ).toBe(false);
  });
});
