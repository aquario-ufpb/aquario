import { mergeFacadeUser } from "../merge-facade-user";
import type { IUsuariosRepository } from "@/lib/server/db/interfaces/usuarios-repository.interface";
import type {
  IMembrosRepository,
  MembroRaw,
} from "@/lib/server/db/interfaces/membros-repository.interface";
import type { UsuarioWithRelations } from "@/lib/server/db/interfaces/types";

function makeUsuario(overrides: Partial<UsuarioWithRelations> = {}): UsuarioWithRelations {
  return {
    id: "user-1",
    nome: "Test User",
    email: "test@academico.ufpb.br",
    eFacade: false,
    papelPlataforma: "USER",
    centro: { id: "c1", nome: "CI", sigla: "CI", descricao: null, campusId: "campus-1" },
    curso: { id: "k1", nome: "CC", centroId: "c1", criadoEm: new Date(), atualizadoEm: new Date() },
    ...overrides,
  } as unknown as UsuarioWithRelations;
}

function makeMembership(overrides: Partial<MembroRaw> = {}): MembroRaw {
  return {
    id: "membro-1",
    usuarioId: "facade-1",
    entidadeId: "entidade-1",
    papel: "MEMBRO",
    cargoId: null,
    startedAt: new Date("2024-01-01"),
    endedAt: null,
    ...overrides,
  };
}

function makeDeps(
  facadeUser: UsuarioWithRelations | null = makeUsuario({ id: "facade-1", eFacade: true }),
  realUser: UsuarioWithRelations | null = makeUsuario({ id: "real-1", eFacade: false }),
  facadeMemberships: MembroRaw[] = [],
  realMemberships: MembroRaw[] = []
) {
  const findById = jest.fn().mockImplementation((id: string) => {
    if (id === "facade-1") {
      return Promise.resolve(facadeUser);
    }
    if (id === "real-1") {
      return Promise.resolve(realUser);
    }
    return Promise.resolve(null);
  });

  return {
    usuariosRepository: {
      findById,
      delete: jest.fn().mockResolvedValue(undefined),
    } as unknown as IUsuariosRepository,
    membrosRepository: {
      findRawByUsuarioId: jest.fn().mockImplementation((userId: string) => {
        if (userId === "facade-1") {
          return Promise.resolve(facadeMemberships);
        }
        if (userId === "real-1") {
          return Promise.resolve(realMemberships);
        }
        return Promise.resolve([]);
      }),
      create: jest.fn().mockResolvedValue({ id: "new-membro" }),
      deleteByUsuarioId: jest.fn().mockResolvedValue(1),
    } as unknown as IMembrosRepository,
  };
}

describe("mergeFacadeUser", () => {
  it("copies memberships from facade to real user and deletes facade", async () => {
    const facadeMemberships = [
      makeMembership({ id: "m1", entidadeId: "ent-1", papel: "ADMIN", cargoId: "cargo-1" }),
      makeMembership({ id: "m2", entidadeId: "ent-2", papel: "MEMBRO" }),
    ];
    const deps = makeDeps(undefined, undefined, facadeMemberships, []);

    const result = await mergeFacadeUser("facade-1", "real-1", true, deps);

    expect(result.success).toBe(true);
    expect(result.membershipsCopied).toBe(2);
    expect(result.conflicts).toBe(0);
    expect(result.facadeUserDeleted).toBe(true);

    // Verify memberships were created for real user
    expect(deps.membrosRepository.create).toHaveBeenCalledTimes(2);
    expect(deps.membrosRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: "real-1",
        entidadeId: "ent-1",
        papel: "ADMIN",
        cargoId: "cargo-1",
      })
    );
    expect(deps.membrosRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        usuarioId: "real-1",
        entidadeId: "ent-2",
        papel: "MEMBRO",
      })
    );

    // Verify facade cleanup
    expect(deps.membrosRepository.deleteByUsuarioId).toHaveBeenCalledWith("facade-1");
    expect(deps.usuariosRepository.delete).toHaveBeenCalledWith("facade-1");
  });

  it("detects conflicts when real user already has membership in same entity", async () => {
    const facadeMemberships = [
      makeMembership({ id: "m1", entidadeId: "ent-1" }),
      makeMembership({ id: "m2", entidadeId: "ent-2" }),
    ];
    const realMemberships = [
      makeMembership({ id: "m3", usuarioId: "real-1", entidadeId: "ent-1" }),
    ];
    const deps = makeDeps(undefined, undefined, facadeMemberships, realMemberships);

    const result = await mergeFacadeUser("facade-1", "real-1", true, deps);

    expect(result.success).toBe(true);
    expect(result.membershipsCopied).toBe(1); // only ent-2 copied
    expect(result.conflicts).toBe(1); // ent-1 was a conflict
    expect(deps.membrosRepository.create).toHaveBeenCalledTimes(1);
    expect(deps.membrosRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ entidadeId: "ent-2" })
    );
  });

  it("skips facade deletion when deleteFacade is false", async () => {
    const facadeMemberships = [makeMembership({ id: "m1", entidadeId: "ent-1" })];
    const deps = makeDeps(undefined, undefined, facadeMemberships, []);

    const result = await mergeFacadeUser("facade-1", "real-1", false, deps);

    expect(result.success).toBe(true);
    expect(result.facadeUserDeleted).toBe(false);
    expect(deps.membrosRepository.deleteByUsuarioId).not.toHaveBeenCalled();
    expect(deps.usuariosRepository.delete).not.toHaveBeenCalled();
  });

  it("returns error when facade user is not found", async () => {
    const deps = makeDeps(null);

    const result = await mergeFacadeUser("facade-1", "real-1", true, deps);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Facade user not found");
  });

  it("returns error when user is not a facade", async () => {
    const nonFacade = makeUsuario({ id: "facade-1", eFacade: false });
    const deps = makeDeps(nonFacade);

    const result = await mergeFacadeUser("facade-1", "real-1", true, deps);

    expect(result.success).toBe(false);
    expect(result.error).toBe("User is not a facade user");
  });

  it("returns error when real user is not found", async () => {
    const deps = makeDeps(undefined, null);

    const result = await mergeFacadeUser("facade-1", "real-1", true, deps);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Real user not found");
  });

  it("returns error when target user is also a facade", async () => {
    const alsoFacade = makeUsuario({ id: "real-1", eFacade: true });
    const deps = makeDeps(undefined, alsoFacade);

    const result = await mergeFacadeUser("facade-1", "real-1", true, deps);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Target user is a facade user");
  });

  it("handles merge with no memberships to copy", async () => {
    const deps = makeDeps(undefined, undefined, [], []);

    const result = await mergeFacadeUser("facade-1", "real-1", true, deps);

    expect(result.success).toBe(true);
    expect(result.membershipsCopied).toBe(0);
    expect(result.conflicts).toBe(0);
    expect(result.facadeUserDeleted).toBe(true);
    expect(deps.membrosRepository.create).not.toHaveBeenCalled();
  });

  it("preserves startedAt and endedAt when copying memberships", async () => {
    const startDate = new Date("2023-06-15");
    const endDate = new Date("2024-01-15");
    const facadeMemberships = [
      makeMembership({ entidadeId: "ent-1", startedAt: startDate, endedAt: endDate }),
    ];
    const deps = makeDeps(undefined, undefined, facadeMemberships, []);

    await mergeFacadeUser("facade-1", "real-1", true, deps);

    expect(deps.membrosRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        startedAt: startDate,
        endedAt: endDate,
      })
    );
  });

  it("handles all memberships being conflicts", async () => {
    const facadeMemberships = [
      makeMembership({ entidadeId: "ent-1" }),
      makeMembership({ entidadeId: "ent-2" }),
    ];
    const realMemberships = [
      makeMembership({ usuarioId: "real-1", entidadeId: "ent-1" }),
      makeMembership({ usuarioId: "real-1", entidadeId: "ent-2" }),
    ];
    const deps = makeDeps(undefined, undefined, facadeMemberships, realMemberships);

    const result = await mergeFacadeUser("facade-1", "real-1", true, deps);

    expect(result.success).toBe(true);
    expect(result.membershipsCopied).toBe(0);
    expect(result.conflicts).toBe(2);
    expect(deps.membrosRepository.create).not.toHaveBeenCalled();
  });

  it("catches unexpected errors and returns them gracefully", async () => {
    const deps = makeDeps();
    (deps.membrosRepository.findRawByUsuarioId as jest.Mock).mockRejectedValue(
      new Error("DB connection lost")
    );

    const result = await mergeFacadeUser("facade-1", "real-1", true, deps);

    expect(result.success).toBe(false);
    expect(result.error).toBe("DB connection lost");
  });

  it("deletes facade memberships before deleting user (FK constraint)", async () => {
    const facadeMemberships = [makeMembership({ entidadeId: "ent-1" })];
    const deps = makeDeps(undefined, undefined, facadeMemberships, []);

    await mergeFacadeUser("facade-1", "real-1", true, deps);

    // deleteByUsuarioId must be called before delete
    const deleteByUserCall = (deps.membrosRepository.deleteByUsuarioId as jest.Mock).mock
      .invocationCallOrder[0];
    const deleteUserCall = (deps.usuariosRepository.delete as jest.Mock).mock
      .invocationCallOrder[0];
    expect(deleteByUserCall).toBeLessThan(deleteUserCall);
  });
});
