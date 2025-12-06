import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { SolicitarResetSenhaUseCase } from '../SolicitarResetSenhaUseCase';
import {
  InMemoryUsuariosRepository,
  InMemoryTokenVerificacaoRepository,
} from './in-memory-repositories';
import { TestEmailService } from './mock-email-service';
import { Usuario } from '@/domain/usuarios/entities/Usuario';
import { TokenVerificacao } from '@/domain/usuarios/entities/TokenVerificacao';
import { Centro, Curso } from '@prisma/client';

describe('SolicitarResetSenhaUseCase', () => {
  let usuariosRepository: InMemoryUsuariosRepository;
  let tokenRepository: InMemoryTokenVerificacaoRepository;
  let emailService: TestEmailService;
  let sut: SolicitarResetSenhaUseCase;

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
    emailService = new TestEmailService();
    sut = new SolicitarResetSenhaUseCase(usuariosRepository, tokenRepository, emailService);
  });

  it('should send password reset email for existing user', async () => {
    const user = createUser();
    await usuariosRepository.create(user);

    const result = await sut.execute({ email: 'test@academico.ufpb.br' });

    assert.strictEqual(result.success, true);
    assert.ok(emailService.wasPasswordResetEmailSentTo('test@academico.ufpb.br'));
    assert.strictEqual(tokenRepository.items.length, 1);
    assert.strictEqual(tokenRepository.items[0].tipo, 'RESET_SENHA');
  });

  it('should return success even for non-existent email (security)', async () => {
    const result = await sut.execute({ email: 'nonexistent@academico.ufpb.br' });

    // Should still return success to prevent email enumeration
    assert.strictEqual(result.success, true);
    assert.strictEqual(emailService.sentEmails.length, 0);
    assert.strictEqual(tokenRepository.items.length, 0);
  });

  it('should delete old tokens before creating new one', async () => {
    const user = createUser();
    await usuariosRepository.create(user);

    // Create old token
    const oldToken = TokenVerificacao.createPasswordResetToken(user.id, 'old-token');
    // Simulate old token by manually adjusting criadoEm
    oldToken.props.criadoEm = new Date(Date.now() - 2 * 60 * 1000); // 2 minutes ago
    await tokenRepository.create(oldToken);

    await sut.execute({ email: 'test@academico.ufpb.br' });

    // Should only have the new token
    assert.strictEqual(tokenRepository.items.length, 1);
    assert.notStrictEqual(tokenRepository.items[0].token, 'old-token');
  });

  it('should normalize email to lowercase', async () => {
    const user = createUser();
    await usuariosRepository.create(user);

    await sut.execute({ email: 'TEST@ACADEMICO.UFPB.BR' });

    assert.ok(emailService.wasPasswordResetEmailSentTo('test@academico.ufpb.br'));
  });

  it('should handle email service failure gracefully', async () => {
    const user = createUser();
    await usuariosRepository.create(user);

    emailService.simulateFailure();

    // Should not throw, just return success (security)
    const result = await sut.execute({ email: 'test@academico.ufpb.br' });

    assert.strictEqual(result.success, true);
  });
});
