// @vitest-environment node
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/server/db/prisma";
import {
  InvalidImageError,
  readImageUpload,
  retireOwnedImage,
  uploadManagedImage,
} from "@/lib/server/services/blob/managed-images";
import { PrismaProjetosRepository } from "../prisma-projetos-repository";
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

async function runWhileLocked<T>(
  hold: (tx: Prisma.TransactionClient) => Promise<unknown>,
  compete: () => Promise<T>
): Promise<T> {
  let pending!: Promise<T>;
  try {
    await prisma.$transaction(async tx => {
      await hold(tx);
      pending = compete();
      await Promise.race([
        waitForBlockedWrite(tx),
        pending.then(() => {
          throw new Error("The competing write finished without waiting for the lock");
        }),
      ]);
    });
  } finally {
    // The transaction has released its locks; drain even if the probe or write failed.
    await Promise.allSettled([pending]);
  }
  return pending;
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
  it("rejects APNG before losing the animation", async () => {
    const apng = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACGFjVEwAAAACAAAAAPONk3AAAAAaZmNUTAAAAAAAAAABAAAAAQAAAAAAAAAAAMgD6AAABqkRWgAAAAxJREFUeJxj+M/AAAADAQEAyf6S7wAAABpmY1RMAAAAAQAAAAEAAAABAAAAAAAAAAAAyAPoAACd2vuOAAAAEGZkQVQAAAACeJxjYGD4DwABAwEAaL/t9AAAAABJRU5ErkJggg==",
      "base64"
    );
    const file = new File([new Uint8Array(apng)], "animated.png", { type: "image/png" });
    const blobs = storage();
    await expect(uploadManagedImage(blobs, "user", "projetos", file)).rejects.toThrow(/APNG/);
    expect(blobs.upload).not.toHaveBeenCalled();
  });

  it("reads the multipart file and limits actual bytes even without Content-Length", async () => {
    const form = new FormData();
    form.append("file", new File(["fixture"], "small.png", { type: "image/png" }));
    const request = new Request("http://localhost/upload", { method: "POST", body: form });
    expect(await readImageUpload(request)).toMatchObject({ name: "small.png", size: 7 });
    const payload = new FormData();
    payload.append("file", new Blob([new Uint8Array(6 * 1024 * 1024)]), "large.png");
    const large = new Request(request.url, { method: "POST", body: payload });
    expect(large.headers.has("content-length")).toBe(false);
    await expect(readImageUpload(large)).rejects.toThrow(/muito grande/);
  });

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

      expect(
        await runWhileLocked(
          tx =>
            tx.projeto.create({ data: { slug: identifier, titulo: "Fixture", urlImagem: url } }),
          () => retireOwnedImage(blobs, owner, url)
        )
      ).toBe(false);
      const projects = new PrismaProjetosRepository();
      await projects.update(identifier, { urlImagem: null, textContent: `![](${url}#preview)` });
      expect(await retireOwnedImage(blobs, owner, url)).toBe(false);
      const escaped = url.replaceAll("-", "\\-");
      await projects.update(identifier, { textContent: `![image][ref]\n\n[ref]: ${escaped}` });
      expect(await retireOwnedImage(blobs, owner, url)).toBe(false);
      for (const field of ["urlOutro", "urlDemo", "urlRepositorio"] as const) {
        await projects.update(identifier, {
          textContent: null,
          urlOutro: null,
          urlDemo: null,
          urlRepositorio: null,
          [field]: url,
        });
        expect(await retireOwnedImage(blobs, owner, url)).toBe(false);
      }
      await projects.update(identifier, {
        urlRepositorio: null,
        textContent: `A literal in code: \`![](${url})\``,
      });
      expect(blobs.delete).not.toHaveBeenCalled();
      blobs.delete.mockRejectedValueOnce(new Error("Storage unavailable"));
      await expect(retireOwnedImage(blobs, owner, url)).rejects.toThrow("Storage unavailable");
      expect(await retireOwnedImage(blobs, owner, url)).toBe(true);
      expect(blobs.delete).toHaveBeenCalledWith(url);
      await expect(
        projects.create(
          { slug: randomUUID(), titulo: "Stale draft", textContent: `![](${url})` },
          []
        )
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
      expect(
        await runWhileLocked(
          tx => tx.membroEntidade.update({ where: { id: row.id }, data: { endedAt: new Date() } }),
          () => repository.updateOwn(row.id, user.id, { endedAt: null })
        )
      ).toBeNull();
      expect(
        await repository.updateAsEntityAdmin(row.id, entity.id, user.id, { endedAt: null })
      ).toBeNull();
      const active = await prisma.membroEntidade.create({
        data: { papel: "ADMIN", entidadeId: entity.id, usuarioId: user.id },
      });
      expect(
        await repository.updateAsEntityAdmin(row.id, entity.id, user.id, { papel: "MEMBRO" })
      ).toMatchObject({ papel: "MEMBRO" });
      expect(
        await runWhileLocked(
          tx =>
            tx.membroEntidade.update({ where: { id: active.id }, data: { endedAt: new Date() } }),
          () => repository.updateAsEntityAdmin(row.id, entity.id, user.id, { papel: "ADMIN" })
        )
      ).toBeNull();
      expect(await repository.updateOwn(row.id, user.id, { endedAt: null })).toMatchObject({
        endedAt: null,
      });
    } finally {
      await prisma.$transaction([
        prisma.membroEntidade.deleteMany({ where: { usuarioId: user.id, entidadeId: entity.id } }),
        prisma.entidade.delete({ where: { id: entity.id } }),
        prisma.usuario.delete({ where: { id: user.id } }),
        prisma.curso.delete({ where: { id: centro.cursos[0].id } }),
        prisma.centro.delete({ where: { id: centro.id } }),
        prisma.campus.delete({ where: { id: campus.id } }),
      ]);
    }
  });
});
