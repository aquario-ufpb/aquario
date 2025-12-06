import { Usuario } from '@/domain/usuarios/entities/Usuario';
import { IUsuariosRepository } from '@/domain/usuarios/repositories/IUsuariosRepository';
import { prisma } from '..';
import { logger } from '@/infra/logger';

const log = logger.child('repository:usuarios');

export class PrismaUsuariosRepository implements IUsuariosRepository {
  async findMany(): Promise<Usuario[]> {
    log.debug('Listando usuários');

    const usuarios = await prisma.usuario.findMany({
      include: {
        centro: true,
        curso: true,
      },
      orderBy: {
        nome: 'asc',
      },
    });

    return usuarios
      .filter(usuario => usuario.centro && usuario.curso)
      .map(usuario =>
        Usuario.create(
          {
            nome: usuario.nome,
            email: usuario.email,
            senhaHash: usuario.senhaHash,
            permissoes: usuario.permissoes,
            centro: usuario.centro!,
            curso: usuario.curso!,
            bio: usuario.bio,
            urlFotoPerfil: usuario.urlFotoPerfil,
            papelPlataforma: usuario.papelPlataforma,
            eVerificado: usuario.eVerificado,
          },
          usuario.id
        )
      );
  }

  async create(usuario: Usuario): Promise<void> {
    log.info('Criando usuário', {
      id: usuario.id,
      email: usuario.props.email,
      centroId: usuario.props.centro.id,
      cursoId: usuario.props.curso.id,
    });

    await prisma.usuario.create({
      data: {
        id: usuario.id,
        nome: usuario.props.nome,
        email: usuario.props.email,
        senhaHash: usuario.props.senhaHash,
        permissoes: usuario.props.permissoes,
        papelPlataforma: usuario.props.papelPlataforma,
        eVerificado: usuario.props.eVerificado ?? false,
        centroId: usuario.props.centro.id,
        cursoId: usuario.props.curso.id,
        bio: usuario.props.bio,
        urlFotoPerfil: usuario.props.urlFotoPerfil,
      },
    });
  }

  async findById(id: string): Promise<Usuario | null> {
    log.debug('Buscando usuário por ID', { id });

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      include: {
        centro: true,
        curso: true,
      },
    });

    if (!usuario || !usuario.centro || !usuario.curso) {
      log.warn('Usuário não encontrado por ID ou sem centro/curso', { id });
      return null;
    }

    return Usuario.create(
      {
        nome: usuario.nome,
        email: usuario.email,
        senhaHash: usuario.senhaHash,
        permissoes: usuario.permissoes,
        papelPlataforma: usuario.papelPlataforma,
        eVerificado: usuario.eVerificado,
        centro: usuario.centro,
        curso: usuario.curso,
        bio: usuario.bio,
        urlFotoPerfil: usuario.urlFotoPerfil,
      },
      usuario.id
    );
  }

  async findByEmail(email: string): Promise<Usuario | null> {
    const normalizedEmail = email.trim().toLowerCase();

    log.debug('Buscando usuário por e-mail', { email: normalizedEmail });

    const usuario = await prisma.usuario.findUnique({
      where: { email: normalizedEmail },
      include: {
        centro: true,
        curso: true,
      },
    });

    if (!usuario || !usuario.centro || !usuario.curso) {
      log.warn('Usuário não encontrado por e-mail ou sem centro/curso', { email: normalizedEmail });
      return null;
    }

    return Usuario.create(
      {
        nome: usuario.nome,
        email: usuario.email,
        senhaHash: usuario.senhaHash,
        permissoes: usuario.permissoes,
        papelPlataforma: usuario.papelPlataforma,
        eVerificado: usuario.eVerificado,
        centro: usuario.centro,
        curso: usuario.curso,
        bio: usuario.bio,
        urlFotoPerfil: usuario.urlFotoPerfil,
      },
      usuario.id
    );
  }

  async markAsVerified(id: string): Promise<void> {
    log.debug('Marcando usuário como verificado', { id });

    await prisma.usuario.update({
      where: { id },
      data: { eVerificado: true },
    });

    log.info('Usuário marcado como verificado', { id });
  }

  async updatePassword(id: string, senhaHash: string): Promise<void> {
    log.debug('Atualizando senha do usuário', { id });

    await prisma.usuario.update({
      where: { id },
      data: { senhaHash },
    });

    log.info('Senha do usuário atualizada', { id });
  }
}
