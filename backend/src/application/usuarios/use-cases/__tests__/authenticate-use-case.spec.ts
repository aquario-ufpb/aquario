import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { hash } from 'bcryptjs';
import { AuthenticateUseCase } from '../AuthenticateUseCase';
import { InMemoryUsuariosRepository } from './in-memory-repositories';
import { Usuario } from '@/domain/usuarios/entities/Usuario';
import { Centro, Curso } from '@prisma/client';

describe('AuthenticateUseCase', () => {
  let usuariosRepository: InMemoryUsuariosRepository;
  let sut: AuthenticateUseCase;

  const mockCentro: Centro = {
    id: 'centro-1',
    nome: 'Centro de Informática',
    sigla: 'CI',
    descricao: 'Centro de Informática da UFPB',
    campusId: 'campus-1',
  };

  const mockCurso: Curso = {
    id: 'curso-1',
    nome: 'Ciência da Computação',
    centroId: 'centro-1',
  };

  const createUser = async (overrides = {}) => {
    const senhaHash = await hash('password123', 10);
    return Usuario.create({
      nome: 'Test User',
      email: 'test@academico.ufpb.br',
      senhaHash,
      permissoes: [],
      papelPlataforma: 'USER',
      eVerificado: true,
      centro: mockCentro,
      curso: mockCurso,
      ...overrides,
    });
  };

  beforeEach(() => {
    usuariosRepository = new InMemoryUsuariosRepository();
    sut = new AuthenticateUseCase(usuariosRepository);
  });

  it('should authenticate user with valid credentials', async () => {
    const user = await createUser();
    await usuariosRepository.create(user);

    const result = await sut.execute({
      email: 'test@academico.ufpb.br',
      senha: 'password123',
    });

    assert.strictEqual(result.usuario.id, user.id);
  });

  it('should reject invalid email', async () => {
    const user = await createUser();
    await usuariosRepository.create(user);

    await assert.rejects(
      async () => {
        await sut.execute({
          email: 'wrong@academico.ufpb.br',
          senha: 'password123',
        });
      },
      {
        message: 'EMAIL_NAO_ENCONTRADO',
      }
    );
  });

  it('should reject invalid password', async () => {
    const user = await createUser();
    await usuariosRepository.create(user);

    await assert.rejects(
      async () => {
        await sut.execute({
          email: 'test@academico.ufpb.br',
          senha: 'wrongpassword',
        });
      },
      {
        message: 'SENHA_INVALIDA',
      }
    );
  });

  it('should block unverified users', async () => {
    const user = await createUser({ eVerificado: false });
    await usuariosRepository.create(user);

    await assert.rejects(
      async () => {
        await sut.execute({
          email: 'test@academico.ufpb.br',
          senha: 'password123',
        });
      },
      {
        message:
          'Email não verificado. Verifique sua caixa de entrada ou solicite um novo email de verificação.',
      }
    );
  });

  it('should normalize email to lowercase', async () => {
    const user = await createUser();
    await usuariosRepository.create(user);

    const result = await sut.execute({
      email: 'TEST@ACADEMICO.UFPB.BR',
      senha: 'password123',
    });

    assert.strictEqual(result.usuario.id, user.id);
  });

  it('should trim whitespace from email', async () => {
    const user = await createUser();
    await usuariosRepository.create(user);

    const result = await sut.execute({
      email: '  test@academico.ufpb.br  ',
      senha: 'password123',
    });

    assert.strictEqual(result.usuario.id, user.id);
  });
});
