import type { EntidadeWithRelations } from "@/lib/server/db/interfaces/types";
import { formatPublicEntidadeResponse } from "../format-entidade-response";

function makeEntidade(): EntidadeWithRelations {
  return {
    id: "entidade-1",
    nome: "LOG",
    slug: "log",
    subtitle: "Grupo de Otimizacao e Logistica",
    descricao: null,
    tipo: "GRUPO",
    urlFoto: null,
    contato: null,
    instagram: null,
    linkedin: null,
    website: null,
    location: null,
    foundingDate: null,
    metadata: {},
    centroId: "centro-1",
    criadoEm: new Date("2026-01-01T00:00:00.000Z"),
    atualizadoEm: new Date("2026-01-01T00:00:00.000Z"),
    centro: {
      id: "centro-1",
      nome: "Centro de Informatica",
      sigla: "CI",
      descricao: null,
      campusId: "campus-1",
    },
    cargos: [],
    membros: [
      {
        id: "membro-1",
        usuarioId: "user-1",
        entidadeId: "entidade-1",
        papel: "ADMIN",
        cargoId: null,
        startedAt: new Date("2026-01-01T00:00:00.000Z"),
        endedAt: null,
        cargo: null,
        usuario: {
          id: "user-1",
          nome: "Test User",
          email: "test@academico.ufpb.br",
          slug: "test-user",
          papelPlataforma: "MASTER_ADMIN",
          eVerificado: true,
          eFacade: false,
          senhaHash: "hash",
          permissoes: ["entidade:admin:entidade-1"],
          urlFotoPerfil: null,
          periodoAtual: "5",
          matricula: "12345",
          onboardingMetadata: null,
          centroId: "centro-1",
          cursoId: "curso-1",
          criadoEm: new Date("2026-01-01T00:00:00.000Z"),
          atualizadoEm: new Date("2026-01-01T00:00:00.000Z"),
          curso: {
            id: "curso-1",
            nome: "Ciencia da Computacao",
            centroId: "centro-1",
            criadoEm: new Date("2026-01-01T00:00:00.000Z"),
            atualizadoEm: new Date("2026-01-01T00:00:00.000Z"),
          },
        },
      },
    ],
  } as unknown as EntidadeWithRelations;
}

describe("format-entidade-response", () => {
  it("omits private user fields from each member's usuario", () => {
    const result = formatPublicEntidadeResponse(makeEntidade());

    expect(result.membros).toEqual([
      {
        id: "membro-1",
        entidadeId: "entidade-1",
        papel: "ADMIN",
        cargoId: null,
        startedAt: new Date("2026-01-01T00:00:00.000Z"),
        endedAt: null,
        cargo: null,
        usuario: {
          id: "user-1",
          nome: "Test User",
          slug: "test-user",
          eFacade: false,
          urlFotoPerfil: null,
          curso: { id: "curso-1", nome: "Ciencia da Computacao" },
        },
      },
    ]);

    const membro = result.membros?.[0]?.usuario as Record<string, unknown>;
    expect(membro).not.toHaveProperty("email");
    expect(membro).not.toHaveProperty("senhaHash");
    expect(membro).not.toHaveProperty("papelPlataforma");
    expect(membro).not.toHaveProperty("eVerificado");
    expect(membro).not.toHaveProperty("permissoes");
    expect(membro).not.toHaveProperty("matricula");
  });

  it("keeps top-level entidade fields untouched", () => {
    const result = formatPublicEntidadeResponse(makeEntidade());

    expect(result.nome).toBe("LOG");
    expect(result.slug).toBe("log");
    expect(result.centro).toEqual({
      id: "centro-1",
      nome: "Centro de Informatica",
      sigla: "CI",
      descricao: null,
      campusId: "campus-1",
    });
  });
});
