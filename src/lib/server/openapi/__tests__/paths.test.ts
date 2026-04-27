/**
 * @jest-environment node
 *
 * See the note in generator.test.ts — importing the generator pulls in
 * Next.js route handlers that require the Node `Request`/`Response` globals.
 */
import { describe, it, expect, beforeEach } from "@jest/globals";

import { __resetOpenApiCacheForTests, getOpenApiDocument } from "../generator";

/**
 * Sanity-check suite that asserts each resource group registers the operations
 * we expect. This catches the "removed an endpoint but forgot to update docs"
 * class of bugs for the code introduced in THIS PR. It does NOT enforce
 * sync between src/app/api/**\/route.ts and src/lib/server/openapi/paths/** —
 * that decision belongs to the maintainers (see the "Follow-up suggestions"
 * section in the PR description).
 */

type OperationKey = `${"get" | "post" | "put" | "patch" | "delete"} ${string}`;

function collectRegisteredOperations(): Set<OperationKey> {
  const doc = getOpenApiDocument();
  const collected = new Set<OperationKey>();

  for (const [path, pathItem] of Object.entries(doc.paths ?? {})) {
    const methods = ["get", "post", "put", "patch", "delete"] as const;
    for (const method of methods) {
      if (pathItem[method]) {
        collected.add(`${method} ${path}` as OperationKey);
      }
    }
  }

  return collected;
}

describe("paths registry sanity checks", () => {
  let operations: Set<OperationKey>;

  beforeEach(() => {
    __resetOpenApiCacheForTests();
    operations = collectRegisteredOperations();
  });

  describe("auth", () => {
    it("registers all auth operations", () => {
      const expected: OperationKey[] = [
        "post /auth/login",
        "post /auth/register",
        "get /auth/me",
        "post /auth/refresh",
        "post /auth/verificar-email",
        "post /auth/esqueci-senha",
        "post /auth/resetar-senha",
        "post /auth/reenviar-verificacao",
        "post /auth/solicitar-reenvio-verificacao",
      ];
      for (const op of expected) {
        expect(operations.has(op)).toBe(true);
      }
    });
  });

  describe("usuarios", () => {
    it("registers the three admin endpoints", () => {
      expect(operations.has("delete /usuarios/{id}")).toBe(true);
      expect(operations.has("post /usuarios/facade")).toBe(true);
      expect(operations.has("post /usuarios/merge-facade")).toBe(true);
    });

    it("registers the multi-method /usuarios/me/* endpoints", () => {
      const expected: OperationKey[] = [
        "get /usuarios/me/disciplinas",
        "put /usuarios/me/disciplinas",
        "get /usuarios/me/membros",
        "post /usuarios/me/membros",
        "put /usuarios/me/membros/{membroId}",
        "delete /usuarios/me/membros/{membroId}",
        "get /usuarios/me/onboarding",
        "patch /usuarios/me/onboarding",
        "patch /usuarios/me/photo",
        "delete /usuarios/me/photo",
      ];
      for (const op of expected) {
        expect(operations.has(op)).toBe(true);
      }
    });

    it("registers the semester-scoped endpoints (including the UUID|'ativo' params)", () => {
      expect(operations.has("get /usuarios/me/semestres/{semestreId}/disciplinas")).toBe(true);
      expect(operations.has("put /usuarios/me/semestres/{semestreId}/disciplinas")).toBe(true);
      expect(
        operations.has(
          "patch /usuarios/me/semestres/{semestreId}/disciplinas/{disciplinaSemestreId}"
        )
      ).toBe(true);
    });
  });

  describe("entidades", () => {
    it("registers the core entidades operations", () => {
      const expected: OperationKey[] = [
        "get /entidades",
        "get /entidades/slug/{slug}",
        "put /entidades/{id}",
        "post /entidades/{id}/membros",
        "put /entidades/{id}/membros/{membroId}",
        "delete /entidades/{id}/membros/{membroId}",
      ];
      for (const op of expected) {
        expect(operations.has(op)).toBe(true);
      }
    });

    it("registers all four cargos methods on the shared /cargos path", () => {
      expect(operations.has("get /entidades/{id}/cargos")).toBe(true);
      expect(operations.has("post /entidades/{id}/cargos")).toBe(true);
      expect(operations.has("put /entidades/{id}/cargos")).toBe(true);
      expect(operations.has("delete /entidades/{id}/cargos")).toBe(true);
    });
  });

  describe("vagas", () => {
    it("registers list, create, detail and delete", () => {
      expect(operations.has("get /vagas")).toBe(true);
      expect(operations.has("post /vagas")).toBe(true);
      expect(operations.has("get /vagas/{id}")).toBe(true);
      expect(operations.has("delete /vagas/{id}")).toBe(true);
    });
  });

  describe("guias", () => {
    it("registers all three guides endpoints", () => {
      expect(operations.has("get /guias")).toBe(true);
      expect(operations.has("get /guias/{id}/secoes")).toBe(true);
      expect(operations.has("get /guias/secoes/{id}/subsecoes")).toBe(true);
    });
  });

  describe("cursos, centros and campus (admin CRUD)", () => {
    it("registers cursos CRUD plus centros /{id}/cursos", () => {
      expect(operations.has("get /cursos")).toBe(true);
      expect(operations.has("post /cursos")).toBe(true);
      expect(operations.has("put /cursos/{id}")).toBe(true);
      expect(operations.has("delete /cursos/{id}")).toBe(true);
      expect(operations.has("get /centros/{id}/cursos")).toBe(true);
    });

    it("registers centros CRUD", () => {
      expect(operations.has("get /centros")).toBe(true);
      expect(operations.has("post /centros")).toBe(true);
      expect(operations.has("put /centros/{id}")).toBe(true);
      expect(operations.has("delete /centros/{id}")).toBe(true);
    });

    it("registers campus CRUD", () => {
      expect(operations.has("get /campus")).toBe(true);
      expect(operations.has("post /campus")).toBe(true);
      expect(operations.has("put /campus/{id}")).toBe(true);
      expect(operations.has("delete /campus/{id}")).toBe(true);
    });
  });

  describe("disciplinas and curriculos", () => {
    it("registers disciplinas search", () => {
      expect(operations.has("get /disciplinas/search")).toBe(true);
    });

    it("registers curriculos grade", () => {
      expect(operations.has("get /curriculos/grade")).toBe(true);
    });
  });

  describe("calendario-academico", () => {
    it("registers semester CRUD", () => {
      expect(operations.has("get /calendario-academico")).toBe(true);
      expect(operations.has("post /calendario-academico")).toBe(true);
      expect(operations.has("get /calendario-academico/{id}")).toBe(true);
      expect(operations.has("put /calendario-academico/{id}")).toBe(true);
      expect(operations.has("delete /calendario-academico/{id}")).toBe(true);
    });

    it("registers events CRUD and batch", () => {
      expect(operations.has("get /calendario-academico/{id}/eventos")).toBe(true);
      expect(operations.has("post /calendario-academico/{id}/eventos")).toBe(true);
      expect(operations.has("put /calendario-academico/{id}/eventos/{eventoId}")).toBe(true);
      expect(operations.has("delete /calendario-academico/{id}/eventos/{eventoId}")).toBe(true);
      expect(operations.has("post /calendario-academico/{id}/eventos/batch")).toBe(true);
    });
  });

  describe("misc (search, health, upload, content-images)", () => {
    it("registers search, health, upload and content-images", () => {
      expect(operations.has("get /search")).toBe(true);
      expect(operations.has("get /health")).toBe(true);
      expect(operations.has("post /upload/photo")).toBe(true);
      expect(operations.has("get /content-images/{path}")).toBe(true);
    });
  });
});
