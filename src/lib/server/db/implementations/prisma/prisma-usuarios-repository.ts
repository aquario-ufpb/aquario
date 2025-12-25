import { prisma } from "@/lib/server/db/prisma";
import type { IUsuariosRepository } from "@/lib/server/db/interfaces/usuarios-repository.interface";
import type {
  UsuarioWithRelations,
  UsuarioCreateInput,
  PapelPlataforma,
} from "@/lib/server/db/interfaces/types";

export class PrismaUsuariosRepository implements IUsuariosRepository {
  async create(data: UsuarioCreateInput): Promise<UsuarioWithRelations> {
    const usuario = await prisma.usuario.create({
      data: {
        nome: data.nome,
        email: data.email ? data.email.toLowerCase().trim() : null,
        senhaHash: data.senhaHash ?? null,
        centroId: data.centroId,
        cursoId: data.cursoId,
        permissoes: data.permissoes ?? [],
        papelPlataforma: data.papelPlataforma ?? "USER",
        eVerificado: data.eVerificado ?? false,
        eFacade: data.eFacade ?? false,
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

  async findManyPaginated(options: {
    page?: number;
    limit?: number;
  }): Promise<{ users: UsuarioWithRelations[]; total: number }> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 25;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.usuario.findMany({
        include: {
          centro: true,
          curso: true,
        },
        orderBy: {
          nome: "asc",
        },
        skip,
        take: limit,
      }),
      prisma.usuario.count(),
    ]);

    return { users, total };
  }

  async search(options: { query: string; limit?: number }): Promise<UsuarioWithRelations[]> {
    const limit = options.limit ?? 10;
    const searchQuery = options.query.trim();

    if (!searchQuery) {
      return [];
    }

    // Normalize query for accent-insensitive search
    const normalizedQuery = searchQuery
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const usuarios = await prisma.usuario.findMany({
      where: {
        OR: [
          {
            nome: {
              contains: normalizedQuery,
              mode: "insensitive",
            },
          },
          {
            email: {
              contains: normalizedQuery,
              mode: "insensitive",
            },
          },
          {
            centro: {
              OR: [
                {
                  nome: {
                    contains: normalizedQuery,
                    mode: "insensitive",
                  },
                },
                {
                  sigla: {
                    contains: normalizedQuery,
                    mode: "insensitive",
                  },
                },
              ],
            },
          },
          {
            curso: {
              nome: {
                contains: normalizedQuery,
                mode: "insensitive",
              },
            },
          },
        ],
      },
      include: {
        centro: true,
        curso: true,
      },
      orderBy: {
        nome: "asc",
      },
      take: limit,
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

  async updateFotoPerfil(id: string, urlFotoPerfil: string | null): Promise<void> {
    await prisma.usuario.update({
      where: { id },
      data: { urlFotoPerfil },
    });
  }

  async updateCentro(id: string, centroId: string): Promise<void> {
    await prisma.usuario.update({
      where: { id },
      data: { centroId },
    });
  }

  async updateCurso(id: string, cursoId: string): Promise<void> {
    await prisma.usuario.update({
      where: { id },
      data: { cursoId },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.usuario.delete({
      where: { id },
    });
  }
}
