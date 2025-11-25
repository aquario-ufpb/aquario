import { hash } from 'bcryptjs';
import { IUsuariosRepository } from '@/domain/usuarios/repositories/IUsuariosRepository';
import { Usuario } from '@/domain/usuarios/entities/Usuario';
import { PapelUsuario, PapelPlataforma } from '@prisma/client';
import { ICentrosRepository } from '@/domain/centros/repositories/ICentrosRepository';
import { ICursosRepository } from '@/domain/cursos/repositories/ICursosRepository';
import { logger } from '@/infra/logger';

interface RegisterUseCaseRequest {
  nome: string;
  email: string;
  senha: string;
  papel: PapelUsuario;
  centroId: string;
  bio?: string;
  urlFotoPerfil?: string;
  cursoId?: string;
  periodo?: number;
}

interface RegisterUseCaseResponse {
  usuario: Usuario;
}

export class RegisterUseCase {
  private readonly log = logger.child('use-case:register');

  constructor(
    private usuariosRepository: IUsuariosRepository,
    private centrosRepository: ICentrosRepository,
    private cursosRepository: ICursosRepository
  ) {}

  async execute({
    nome,
    email,
    senha,
    papel,
    centroId,
    bio,
    urlFotoPerfil,
    cursoId,
    periodo,
  }: RegisterUseCaseRequest): Promise<RegisterUseCaseResponse> {
    const normalizedEmail = email.trim().toLowerCase();

    this.log.debug('Iniciando registro de usuário', {
      email: normalizedEmail,
      papel,
      centroId,
      cursoId,
    });

    if (papel === 'DISCENTE' && (!cursoId || !periodo)) {
      this.log.warn('Dados obrigatórios ausentes para discente', {
        email: normalizedEmail,
      });
      throw new Error('Discentes devem fornecer curso e período.');
    }

    const usuarioComMesmoEmail = await this.usuariosRepository.findByEmail(normalizedEmail);
    if (usuarioComMesmoEmail) {
      this.log.warn('E-mail já cadastrado', { email: normalizedEmail });
      throw new Error('Este e-mail já está em uso.');
    }

    const centro = await this.centrosRepository.findById(centroId);
    if (!centro) {
      this.log.warn('Centro não encontrado durante registro', { centroId });
      throw new Error('Centro não encontrado.');
    }

    let curso = null;
    if (papel === 'DISCENTE' && cursoId) {
      curso = await this.cursosRepository.findById(cursoId);
      if (!curso) {
        this.log.warn('Curso não encontrado durante registro', { cursoId });
        throw new Error('Curso não encontrado.');
      }
    }

    const senhaHash = await hash(senha, 10);

    const usuario = Usuario.create({
      nome,
      email: normalizedEmail,
      senhaHash,
      papel,
      permissoes: [],
      papelPlataforma: PapelPlataforma.USER,
      centro,
      curso,
      bio,
      urlFotoPerfil,
      periodo,
    });

    await this.usuariosRepository.create(usuario);

    this.log.info('Usuário registrado com sucesso', { usuarioId: usuario.id, email: normalizedEmail });
    
    return { usuario };
  }
}
