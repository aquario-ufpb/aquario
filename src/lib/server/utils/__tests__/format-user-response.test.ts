import type { UsuarioWithRelations } from "@/lib/server/db/interfaces/types";
import { formatPublicUserResponse, formatUserResponse } from "../format-user-response";

function makeUsuario(): UsuarioWithRelations {
  return {
    id: "user-1",
    nome: "Test User",
    email: "test@academico.ufpb.br",
    slug: "test-user",
    papelPlataforma: "MASTER_ADMIN",
    eVerificado: true,
    eFacade: false,
    senhaHash: "hash",
    permissoes: ["entidade:admin:ent-1"],
    urlFotoPerfil: null,
    periodoAtual: "5",
    matricula: null,
    onboardingMetadata: null,
    centroId: "centro-1",
    cursoId: "curso-1",
    criadoEm: new Date("2026-01-01T00:00:00.000Z"),
    atualizadoEm: new Date("2026-01-01T00:00:00.000Z"),
    centro: {
      id: "centro-1",
      nome: "Centro de Informatica",
      sigla: "CI",
      descricao: null,
      campusId: "campus-1",
    },
    curso: {
      id: "curso-1",
      nome: "Ciencia da Computacao",
      centroId: "centro-1",
      criadoEm: new Date("2026-01-01T00:00:00.000Z"),
      atualizadoEm: new Date("2026-01-01T00:00:00.000Z"),
    },
  } as UsuarioWithRelations;
}

describe("format-user-response", () => {
  it("keeps private fields in the full user response", () => {
    const result = formatUserResponse(makeUsuario());

    expect(result).toMatchObject({
      email: "test@academico.ufpb.br",
      papelPlataforma: "MASTER_ADMIN",
      eVerificado: true,
      permissoes: ["entidade:admin:ent-1"],
    });
  });

  it("omits private fields from the public user response", () => {
    const result = formatPublicUserResponse(makeUsuario());

    expect(result).toEqual({
      id: "user-1",
      nome: "Test User",
      slug: "test-user",
      eFacade: false,
      urlFotoPerfil: null,
      centro: {
        id: "centro-1",
        nome: "Centro de Informatica",
        sigla: "CI",
      },
      curso: {
        id: "curso-1",
        nome: "Ciencia da Computacao",
      },
    });
    expect(result).not.toHaveProperty("email");
    expect(result).not.toHaveProperty("papelPlataforma");
    expect(result).not.toHaveProperty("eVerificado");
    expect(result).not.toHaveProperty("permissoes");
  });
});
