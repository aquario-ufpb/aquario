import { prisma } from "@/lib/server/db/prisma";
import type { IUsuariosRepository } from "@/lib/server/db/interfaces/usuarios-repository.interface";
import type { UsuarioWithRelations, UsuarioCreateInput, PapelPlataforma } from "@/lib/server/db/interfaces/types";

export class PrismaUsuariosRepository implements IUsuariosRepository {
  async create(data: UsuarioCreateInput): Promise<UsuarioWithRelations> {
    const usuario = await prisma.usuario.create({
      data: {
        nome: data.nome,
        email: data.email.toLowerCase().trim(),
        senhaHash: data.senhaHash,
        centroId: data.centroId,
        cursoId: data.cursoId,
        permissoes: data.permissoes ?? [],
        papelPlataforma: data.papelPlataforma ?? "USER",
        eVerificado: data.eVerificado ?? false,
        urlFotoPerfil: data.urlFotoPerfil,
        matricula: data.matricula,
      },
      include: {
        centro: true,
        curso: true,
      },
    });

    return usuario;
  }

  async findById(id: string): Promise<UsuarioWithRelations | null> {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: {
        centro: true,
        curso: true,
      },
    });

    return usuario;
  }

  async findByEmail(email: string): Promise<UsuarioWithRelations | null> {
    const normalizedEmail = email.toLowerCase().trim();

    const usuario = await prisma.usuario.findUnique({
      where: { email: normalizedEmail },
      include: {
        centro: true,
        curso: true,
      },
    });

    return usuario;
  }

  async findMany(): Promise<UsuarioWithRelations[]> {
    const usuarios = await prisma.usuario.findMany({
      include: {
        centro: true,
        curso: true,
      },
      orderBy: {
        nome: "asc",
      },
    });

    return usuarios;
  }

  async markAsVerified(id: string): Promise<void> {
    await prisma.usuario.update({
      where: { id },
      data: { eVerificado: true },
    });
  }

  async updatePassword(id: string, senhaHash: string): Promise<void> {
    await prisma.usuario.update({
      where: { id },
      data: { senhaHash },
    });
  }

  async updatePapelPlataforma(id: string, papelPlataforma: PapelPlataforma): Promise<void> {
    await prisma.usuario.update({
      where: { id },
      data: { papelPlataforma },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.usuario.delete({
      where: { id },
    });
  }
}

