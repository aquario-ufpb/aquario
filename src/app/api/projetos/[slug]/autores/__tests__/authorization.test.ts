/** @jest-environment node */
import { NextRequest } from "next/server";
import { PUT } from "../route";

const mockUserId = "e91afba3-be35-4352-b44d-3896fdcf6ad1";
const mockMember = jest.fn();
const mockReplace = jest.fn();

jest.mock("@/lib/server/services/jwt/jwt", () => ({
  verifyToken: () => ({ sub: mockUserId, sessionVersion: 0 }),
}));
jest.mock("@/lib/server/container", () => ({
  getContainer: () => ({
    usuariosRepository: {
      findById: () =>
        Promise.resolve({ id: mockUserId, papelPlataforma: "USER", sessionVersion: 0 }),
    },
    membrosRepository: { findActiveByUsuarioAndEntidade: mockMember },
    projetosRepository: {
      findBySlugWithAutores: () =>
        Promise.resolve({ id: "project", autores: [{ usuarioId: mockUserId }] }),
      usuariosExist: () => Promise.resolve(true),
      entidadesExist: () => Promise.resolve(true),
      replaceAutores: mockReplace,
    },
  }),
}));

it.each([
  ["MEMBRO", 403],
  ["ADMIN", 200],
])("checks each entity even when the caller is the project author (%s)", async (papel, status) => {
  mockReplace.mockClear().mockResolvedValue({});
  mockMember.mockResolvedValueOnce({ papel: "ADMIN" }).mockResolvedValueOnce({ papel });
  const request = new NextRequest("http://localhost/api/projetos/test/autores", {
    method: "PUT",
    headers: { authorization: "Bearer fixture", "content-type": "application/json" },
    body: JSON.stringify({
      autores: [
        { usuarioId: mockUserId, autorPrincipal: true },
        { entidadeId: "39395c4b-414b-40fd-87df-11d5f59e6673" },
        { entidadeId: "d1fd4f51-4487-4a8a-999e-d03ca55d3880" },
      ],
    }),
  });
  const response = await PUT(request, { params: Promise.resolve({ slug: "test" }) });
  expect(response.status).toBe(status);
  expect(mockReplace).toHaveBeenCalledTimes(status === 200 ? 1 : 0);
});
