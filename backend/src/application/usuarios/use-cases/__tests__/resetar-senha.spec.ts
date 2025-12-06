import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { compare } from 'bcryptjs';
import { ResetarSenhaUseCase } from '../ResetarSenhaUseCase';
import {
  InMemoryUsuariosRepository,
  InMemoryTokenVerificacaoRepository,
} from './in-memory-repositories';
import { Usuario } from '@/domain/usuarios/entities/Usuario';
import { TokenVerificacao } from '@/domain/usuarios/entities/TokenVerificacao';
import { Centro, Curso } from '@prisma/client';

describe('ResetarSenhaUseCase', () => {
  let usuariosRepository: InMemoryUsuariosRepository;
  let tokenRepository: InMemoryTokenVerificacaoRepository;
  let sut: ResetarSenhaUseCase;

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
      eVerificado: true,
      centro: mockCentro,
      curso: mockCurso,
      ...overrides,
    });
  };

  beforeEach(() => {
    usuariosRepository = new InMemoryUsuariosRepository();
    tokenRepository = new InMemoryTokenVerificacaoRepository();
    sut = new ResetarSenhaUseCase(tokenRepository, usuariosRepository);
  });

  it('should reset password with valid token', async () => {
    const user = createUser();
    await usuariosRepository.create(user);

    const token = TokenVerificacao.createPasswordResetToken(user.id, 'valid-token');
    await tokenRepository.create(token);

    const result = await sut.execute({
      token: 'valid-token',
      novaSenha: 'newpassword123',
    });

    assert.strictEqual(result.success, true);
    assert.ok(result.message.includes('sucesso'));

    // Verify password was updated
    const updatedUser = await usuariosRepository.findById(user.id);
    const passwordMatches = await compare('newpassword123', updatedUser!.props.senhaHash);
    assert.strictEqual(passwordMatches, true);

    // Verify token is marked as used
    const usedToken = await tokenRepository.findByToken('valid-token');
    assert.ok(usedToken?.isUsed());
  });

  it('should reject invalid token', async () => {
    await assert.rejects(
      async () => {
        await sut.execute({
          token: 'invalid-token',
          novaSenha: 'newpassword123',
        });
      },
      {
        message: 'Token inválido ou expirado.',
      }
    );
  });

  it('should reject expired token', async () => {
    const user = createUser();
    await usuariosRepository.create(user);

    // Create expired token
    const expiredToken = TokenVerificacao.create({
      usuarioId: user.id,
      token: 'expired-token',
      tipo: 'RESET_SENHA',
      expiraEm: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
    });
    await tokenRepository.create(expiredToken);

    await assert.rejects(
      async () => {
        await sut.execute({
          token: 'expired-token',
          novaSenha: 'newpassword123',
        });
      },
      {
        message: 'Token expirado. Solicite um novo link de redefinição de senha.',
      }
    );
  });

  it('should reject already used token', async () => {
    const user = createUser();
    await usuariosRepository.create(user);

    const token = TokenVerificacao.createPasswordResetToken(user.id, 'used-token');
    token.markAsUsed();
    await tokenRepository.create(token);

    await assert.rejects(
      async () => {
        await sut.execute({
          token: 'used-token',
          novaSenha: 'newpassword123',
        });
      },
      {
        message: 'Este link já foi utilizado.',
      }
    );
  });

  it('should reject wrong token type (verification token)', async () => {
    const user = createUser();
    await usuariosRepository.create(user);

    const verificationToken = TokenVerificacao.createVerificationToken(user.id, 'verification-token');
    await tokenRepository.create(verificationToken);

    await assert.rejects(
      async () => {
        await sut.execute({
          token: 'verification-token',
          novaSenha: 'newpassword123',
        });
      },
      {
        message: 'Token inválido.',
      }
    );
  });

  it('should reject password shorter than 8 characters', async () => {
    const user = createUser();
    await usuariosRepository.create(user);

    const token = TokenVerificacao.createPasswordResetToken(user.id, 'valid-token');
    await tokenRepository.create(token);

    await assert.rejects(
      async () => {
        await sut.execute({
          token: 'valid-token',
          novaSenha: 'short',
        });
      },
      {
        message: 'A senha deve ter pelo menos 8 caracteres.',
      }
    );
  });

  it('should reject password longer than 128 characters', async () => {
    const user = createUser();
    await usuariosRepository.create(user);

    const token = TokenVerificacao.createPasswordResetToken(user.id, 'valid-token');
    await tokenRepository.create(token);

    const longPassword = 'a'.repeat(129);

    await assert.rejects(
      async () => {
        await sut.execute({
          token: 'valid-token',
          novaSenha: longPassword,
        });
      },
      {
        message: 'A senha deve ter no máximo 128 caracteres.',
      }
    );
  });
});
