// @vitest-environment node
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/server/db/prisma";
import {
  InvalidImageError,
  retireOwnedImage,
  uploadManagedImage,
} from "@/lib/server/services/blob/managed-images";
import { PrismaMembrosRepository } from "../prisma-membros-repository";
import { assertDisposableSigaaDatabase } from "./sigaa-test-database-guard";

const databaseUrl = process.env.DATABASE_URL;
const storage = () => ({
  upload: vi.fn((_file: Buffer | File, key: string, _type: string) =>
    Promise.resolve(`/uploads/${key}`)
  ),
  delete: vi.fn((_url: string) => Promise.resolve(true)),
  exists: vi.fn(() => Promise.resolve(true)),
});

async function waitForBlockedWrite(tx: Prisma.TransactionClient) {
  // Wait until the competing UPDATE actually reaches PostgreSQL and blocks on this transaction.
  for (let attempt = 0; attempt < 100; attempt++) {
    const waiting = await tx.$queryRaw<{ blocked: boolean }[]>`SELECT EXISTS (
            SELECT FROM pg_locks WHERE NOT granted AND
              pg_backend_pid() = ANY(pg_blocking_pids(pid))
          ) AS blocked`;
    if (waiting[0].blocked) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw new Error("The concurrent operation did not reach the locked row");
}

async function createUserAndEntity() {
  const key = randomUUID();
  const campus = await prisma.campus.create({
    data: {
      nome: key,
      centros: { create: { nome: key, sigla: key, cursos: { create: { nome: key } } } },
    },
    include: { centros: { include: { cursos: true } } },
  });
  const centro = campus.centros[0];
  const user = await prisma.usuario.create({
    data: { nome: key, centroId: centro.id, cursoId: centro.cursos[0].id },
  });
  const entity = await prisma.entidade.create({
    data: { nome: key, tipo: "GRUPO", centroId: centro.id },
  });
  return { campus, centro, user, entity };
}

describe("raster upload boundary", () => {
  it.each([
    new File(["fixture"], "fixture.png", { type: "image/png" }),
    new File(["GIF89a"], "fixture.gif", { type: "image/gif" }),
    new File(["<svg/>"], "fixture.png", { type: "image/png" }),
  ])("rejects an undecodable file before storage", async file => {
    const blobs = storage();
    await expect(uploadManagedImage(blobs, "user", "projetos", file)).rejects.toBeInstanceOf(
      InvalidImageError
    );
    expect(blobs.upload).not.toHaveBeenCalled();
  });
});

describe.skipIf(!databaseUrl)("media lifecycle and memberships on PostgreSQL", () => {
  it("canonicalizes uploads and retires only an owner's unreferenced file", async () => {
    assertDisposableSigaaDatabase(databaseUrl);
    const blobs = storage();
    const owner = randomUUID();
    const identifier = randomUUID();
    const source = await sharp({ create: { width: 2, height: 2, channels: 3, background: "red" } })
      .png()
      .toBuffer();
    const file = new File([new Uint8Array(source)], "provided-name.png", { type: "image/png" });
    const url = await uploadManagedImage(blobs, owner, "projetos", file);
    try {
      const [encoded, path, contentType] = blobs.upload.mock.calls[0];
      expect(path).toMatch(/^projetos\/aq-media-[0-9a-f-]{36}\.webp$/);
      expect(contentType).toBe("image/webp");
      expect(await sharp(encoded as Buffer).metadata()).toMatchObject({
        format: "webp",
        width: 2,
        height: 2,
      });
      expect(await retireOwnedImage(blobs, "someone-else", url)).toBe(false);
      expect(await retireOwnedImage(blobs, owner, "https://example.test/legacy")).toBe(false);

      let concurrentCancel: Promise<boolean> | undefined;
      const project = await prisma.$transaction(async tx => {
        const saved = await tx.projeto.create({
          data: {
            slug: identifier,
            titulo: "Fixture",
            urlImagem: url,
            textContent: `![](${url}#preview)`,
          },
        });
        concurrentCancel = retireOwnedImage(blobs, owner, url);
        await waitForBlockedWrite(tx);
        return saved;
      });
      expect(await concurrentCancel).toBe(false);
      expect(await retireOwnedImage(blobs, owner, url)).toBe(false);
      await prisma.projeto.update({ where: { id: project.id }, data: { urlImagem: null } });
      expect(await retireOwnedImage(blobs, owner, url)).toBe(false);
      expect(blobs.delete).not.toHaveBeenCalled();
      await prisma.projeto.delete({ where: { id: project.id } });
      expect(await retireOwnedImage(blobs, owner, url)).toBe(true);
      expect(blobs.delete).toHaveBeenCalledWith(url);
      await expect(
        prisma.projeto.create({
          data: { slug: identifier, titulo: "Stale draft", textContent: `![](${url})` },
        })
      ).rejects.toThrow();
    } finally {
      await prisma.projeto.deleteMany({ where: { slug: identifier } });
      await prisma.mediaUpload.delete({ where: { url } });
    }
  });

  it("keeps a detached profile photo while an entity still displays it", async () => {
    assertDisposableSigaaDatabase(databaseUrl);
    const { campus, centro, user, entity } = await createUserAndEntity();
    const id = randomUUID();
    const url = `/uploads/photos/aq-media-${id}.webp`;
    const blobs = storage();
    try {
      await prisma.mediaUpload.create({ data: { id, url, uploaderId: user.id } });
      await prisma.usuario.update({ where: { id: user.id }, data: { urlFotoPerfil: url } });
      await prisma.entidade.update({ where: { id: entity.id }, data: { urlFoto: url } });
      await prisma.usuario.update({ where: { id: user.id }, data: { urlFotoPerfil: null } });
      expect(await retireOwnedImage(blobs, user.id, url)).toBe(false);
      await prisma.entidade.update({ where: { id: entity.id }, data: { urlFoto: null } });
      expect(await retireOwnedImage(blobs, user.id, url)).toBe(true);
      expect(blobs.delete).toHaveBeenCalledWith(url);
    } finally {
      await prisma.$transaction([
        prisma.entidade.delete({ where: { id: entity.id } }),
        prisma.usuario.delete({ where: { id: user.id } }),
        prisma.curso.delete({ where: { id: centro.cursos[0].id } }),
        prisma.centro.delete({ where: { id: centro.id } }),
        prisma.campus.delete({ where: { id: campus.id } }),
        prisma.mediaUpload.deleteMany({ where: { id } }),
      ]);
    }
  });

  it("protects a concurrent admin revocation and still allows a member to reopen their term", async () => {
    assertDisposableSigaaDatabase(databaseUrl);
    const { campus, centro, user, entity } = await createUserAndEntity();
    const row = await prisma.membroEntidade.create({
      data: { papel: "ADMIN", entidadeId: entity.id, usuarioId: user.id },
    });
    const repository = new PrismaMembrosRepository();
    try {
      let concurrentReopen: ReturnType<typeof repository.updateOwn> | undefined;
      await prisma.$transaction(async tx => {
        await tx.membroEntidade.update({ where: { id: row.id }, data: { endedAt: new Date() } });
        concurrentReopen = repository.updateOwn(row.id, user.id, { endedAt: null }, "self");
        await waitForBlockedWrite(tx);
      });
      expect(await concurrentReopen).toBeNull();
      expect(
        await repository.updateOwn(row.id, user.id, { endedAt: null }, "entity-admin")
      ).toBeNull();
      await prisma.membroEntidade.update({ where: { id: row.id }, data: { papel: "MEMBRO" } });
      expect(await repository.updateOwn(row.id, user.id, { endedAt: null }, "self")).toMatchObject({
        endedAt: null,
      });
    } finally {
      await prisma.$transaction([
        prisma.membroEntidade.delete({ where: { id: row.id } }),
        prisma.entidade.delete({ where: { id: entity.id } }),
        prisma.usuario.delete({ where: { id: user.id } }),
        prisma.curso.delete({ where: { id: centro.cursos[0].id } }),
        prisma.centro.delete({ where: { id: centro.id } }),
        prisma.campus.delete({ where: { id: campus.id } }),
      ]);
    }
  });
});
