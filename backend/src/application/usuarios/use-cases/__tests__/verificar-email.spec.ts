import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { VerificarEmailUseCase } from '../VerificarEmailUseCase';
import {
  InMemoryUsuariosRepository,
  InMemoryTokenVerificacaoRepository,
} from './in-memory-repositories';
import { Usuario } from '@/domain/usuarios/entities/Usuario';
import { TokenVerificacao } from '@/domain/usuarios/entities/TokenVerificacao';
import { Centro, Curso } from '@prisma/client';

describe('VerificarEmailUseCase', () => {
  let usuariosRepository: InMemoryUsuariosRepository;
  let tokenRepository: InMemoryTokenVerificacaoRepository;
  let sut: VerificarEmailUseCase;

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

  const createUser = (overrides = {}) => {
    return Usuario.create({
      nome: 'Test User',
      email: 'test@academico.ufpb.br',
      senhaHash: '$2a$10$xxxxx',
      permissoes: [],
      papelPlataforma: 'USER',
      eVerificado: false,
      centro: mockCentro,
      curso: mockCurso,
      ...overrides,
    });
  };

  beforeEach(() => {
    usuariosRepository = new InMemoryUsuariosRepository();
    tokenRepository = new InMemoryTokenVerificacaoRepository();
    sut = new VerificarEmailUseCase(tokenRepository, usuariosRepository);
  });

  it('should verify email with valid token', async () => {
    const user = createUser();
    await usuariosRepository.create(user);

    const token = TokenVerificacao.createVerificationToken(user.id, 'valid-token');
    await tokenRepository.create(token);

    const result = await sut.execute({ token: 'valid-token' });

    assert.strictEqual(result.success, true);
    assert.ok(result.message.includes('sucesso'));

    // Check user is marked as verified
    const updatedUser = await usuariosRepository.findById(user.id);
    assert.strictEqual(updatedUser?.eVerificado, true);

    // Check token is marked as used
    const usedToken = await tokenRepository.findByToken('valid-token');
    assert.ok(usedToken?.isUsed());
  });

  it('should reject invalid token', async () => {
    await assert.rejects(
      async () => {
        await sut.execute({ token: 'invalid-token' });
      },
      {
        message: 'Token inválido ou expirado.',
      }
    );
  });

  it('should reject expired token', async () => {
    const user = createUser();
    await usuariosRepository.create(user);

    // Create expired token (1 hour ago)
    const expiredToken = TokenVerificacao.create({
      usuarioId: user.id,
      token: 'expired-token',
      tipo: 'VERIFICACAO_EMAIL',
      expiraEm: new Date(Date.now() - 60 * 60 * 1000),
    });
    await tokenRepository.create(expiredToken);

    await assert.rejects(
      async () => {
        await sut.execute({ token: 'expired-token' });
      },
      {
        message: 'Token expirado. Solicite um novo email de verificação.',
      }
    );
  });

  it('should reject already used token', async () => {
    const user = createUser();
    await usuariosRepository.create(user);

    const token = TokenVerificacao.createVerificationToken(user.id, 'used-token');
    token.markAsUsed();
    await tokenRepository.create(token);

    await assert.rejects(
      async () => {
        await sut.execute({ token: 'used-token' });
      },
      {
        message: 'Este link já foi utilizado.',
      }
    );
  });

  it('should return success if user is already verified', async () => {
    const user = createUser({ eVerificado: true });
    await usuariosRepository.create(user);

    const token = TokenVerificacao.createVerificationToken(user.id, 'valid-token');
    await tokenRepository.create(token);

    const result = await sut.execute({ token: 'valid-token' });

    assert.strictEqual(result.success, true);
    assert.ok(result.message.includes('já verificado'));
  });

  it('should reject wrong token type (password reset token)', async () => {
    const user = createUser();
    await usuariosRepository.create(user);

    const resetToken = TokenVerificacao.createPasswordResetToken(user.id, 'reset-token');
    await tokenRepository.create(resetToken);

    await assert.rejects(
      async () => {
        await sut.execute({ token: 'reset-token' });
      },
      {
        message: 'Token inválido.',
      }
    );
  });
});
