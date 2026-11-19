/**
 * @jest-environment node
 */
import { PATCH as updateInfo } from "../info/route";
import { PATCH as updateSlug } from "../slug/route";

const mockUser = {
  id: "fixture",
  nome: "Fixture",
  slug: "fixture",
  centro: { id: "center" },
  curso: { id: "course" },
  senhaHash: "sensitive-fixture-hash",
  sessionVersion: 4,
  eFacade: false,
};

jest.mock("@/lib/server/services/auth/middleware", () => ({
  withAdmin: (
    request: Request,
    handler: (request: Request, actor: { id: string }) => Promise<Response>
  ) => handler(request, { id: "admin-fixture" }),
}));
jest.mock("@/lib/server/container", () => ({
  getContainer: () => ({
    usuariosRepository: {
      findById: () => Promise.resolve(mockUser),
      updateSlug: () => Promise.resolve(),
    },
  }),
}));
jest.mock("@/lib/server/services/audit-log", () => ({ recordAuditLog: jest.fn() }));

describe.each([
  { name: "info", route: updateInfo, body: {} },
  { name: "slug", route: updateSlug, body: { slug: "fixture" } },
])("admin update $name", ({ route, body }) => {
  it.each([true, false])(
    "returns eFacade=%s without credentials or session state",
    async eFacade => {
      mockUser.eFacade = eFacade;
      const request = new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      const response = await route(request, { params: Promise.resolve({ id: mockUser.id }) });
      const user = await response.json();
      expect(response.status).toBe(200);
      expect(user).toMatchObject({ id: mockUser.id, slug: mockUser.slug, eFacade });
      expect(user).not.toHaveProperty("senhaHash");
      expect(user).not.toHaveProperty("sessionVersion");
    }
  );
});
