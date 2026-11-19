import { randomUUID } from "node:crypto";
import { compare } from "bcryptjs";
import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/server/db/prisma";
import { resetPassword } from "@/lib/server/services/auth/reset-password";
import { PrismaTokenVerificacaoRepository } from "../prisma-token-verificacao-repository";
import { PrismaUsuariosRepository } from "../prisma-usuarios-repository";
import { assertDisposableSigaaDatabase } from "./sigaa-test-database-guard";

const databaseUrl = process.env.DATABASE_URL;

describe.skipIf(!databaseUrl)("password reset in PostgreSQL", () => {
  it.each(["the same link", "two outstanding links"])(
    "commits a single password and session generation when requests use %s",
    async scenario => {
      assertDisposableSigaaDatabase(databaseUrl);
      const suffix = randomUUID();
      const fixture = await prisma.campus.create({
        data: {
          nome: suffix,
          centros: {
            create: { nome: suffix, sigla: suffix, cursos: { create: { nome: suffix } } },
          },
        },
        include: { centros: { include: { cursos: true } } },
      });
      const centro = fixture.centros[0];
      const curso = centro.cursos[0];
      const usuarioId = randomUUID();
      const passwords = ["synthetic-password-A", "synthetic-password-B"];
      const tokens = [randomUUID(), randomUUID()];
      const deps = {
        usuariosRepository: new PrismaUsuariosRepository(),
        tokenVerificacaoRepository: new PrismaTokenVerificacaoRepository(),
      };
      try {
        await prisma.usuario.create({
          data: {
            id: usuarioId,
            nome: "Fixture",
            centroId: centro.id,
            cursoId: curso.id,
            tokensVerificacao: {
              create: tokens.map(token => ({
                token,
                tipo: "RESET_SENHA",
                expiraEm: new Date(Date.now() + 60_000),
              })),
            },
          },
        });
        const outcomes = await Promise.allSettled(
          passwords.map((novaSenha, index) =>
            resetPassword(
              { novaSenha, token: tokens[scenario === "the same link" ? 0 : index] },
              deps
            )
          )
        );
        expect(outcomes.filter(result => result.status === "fulfilled")).toHaveLength(1);
        const winner = outcomes.findIndex(result => result.status === "fulfilled");
        const user = await prisma.usuario.findUniqueOrThrow({ where: { id: usuarioId } });
        expect(user.sessionVersion).toBe(1);
        expect(await compare(passwords[winner], user.senhaHash ?? "")).toBe(true);
        expect(await prisma.tokenVerificacao.count({ where: { usuarioId, usadoEm: null } })).toBe(
          0
        );
      } finally {
        await prisma.$transaction([
          prisma.usuario.deleteMany({ where: { id: usuarioId } }),
          prisma.curso.delete({ where: { id: curso.id } }),
          prisma.centro.delete({ where: { id: centro.id } }),
          prisma.campus.delete({ where: { id: fixture.id } }),
        ]);
      }
    }
  );
});
