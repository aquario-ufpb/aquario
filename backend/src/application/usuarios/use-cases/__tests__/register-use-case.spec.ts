import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { RegisterUseCase } from '../RegisterUseCase';
import {
  InMemoryUsuariosRepository,
  InMemoryCentrosRepository,
  InMemoryCursosRepository,
  InMemoryTokenVerificacaoRepository,
} from './in-memory-repositories';
import { TestEmailService } from './mock-email-service';
import { Centro, Curso } from '@prisma/client';

// Mock env module
const originalEnv = process.env;

describe('RegisterUseCase', () => {
  let usuariosRepository: InMemoryUsuariosRepository;
  let centrosRepository: InMemoryCentrosRepository;
  let cursosRepository: InMemoryCursosRepository;
  let tokenRepository: InMemoryTokenVerificacaoRepository;
  let emailService: TestEmailService;
  let sut: RegisterUseCase;

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

  beforeEach(() => {
    // Reset env
    process.env = { ...originalEnv };
    process.env.MASTER_ADMIN_EMAILS = 'admin@aquario.com,aquarioufpb@gmail.com';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.EMAIL_MOCK_MODE = 'true';

    usuariosRepository = new InMemoryUsuariosRepository();
    centrosRepository = new InMemoryCentrosRepository([mockCentro]);
    cursosRepository = new InMemoryCursosRepository([mockCurso]);
    tokenRepository = new InMemoryTokenVerificacaoRepository();
    emailService = new TestEmailService();

    sut = new RegisterUseCase(
      usuariosRepository,
      centrosRepository,
      cursosRepository,
      tokenRepository,
      emailService
    );
  });

  it('should register user with valid academic email', async () => {
    const result = await sut.execute({
      nome: 'Test User',
      email: 'test@academico.ufpb.br',
      senha: 'password123',
      centroId: mockCentro.id,
      cursoId: mockCurso.id,
    });

    assert.ok(result.usuarioId);
    assert.strictEqual(typeof result.autoVerificado, 'boolean');
    assert.strictEqual(usuariosRepository.items.length, 1);
    assert.strictEqual(usuariosRepository.items[0].props.email, 'test@academico.ufpb.br');
  });

  it('should reject non-academic email', async () => {
    await assert.rejects(
      async () => {
        await sut.execute({
          nome: 'Test User',
          email: 'test@gmail.com',
          senha: 'password123',
          centroId: mockCentro.id,
          cursoId: mockCurso.id,
        });
      },
      {
        message: 'Apenas emails acadêmicos (@academico.ufpb.br) são permitidos.',
      }
    );
  });

  it('should allow MASTER_ADMIN emails regardless of domain', async () => {
    const result = await sut.execute({
      nome: 'Admin User',
      email: 'aquarioufpb@gmail.com',
      senha: 'password123',
      centroId: mockCentro.id,
      cursoId: mockCurso.id,
    });

    assert.ok(result.usuarioId);
    assert.strictEqual(usuariosRepository.items[0].props.papelPlataforma, 'MASTER_ADMIN');
  });

  it('should auto-assign MASTER_ADMIN role for configured emails', async () => {
    await sut.execute({
      nome: 'Admin User',
      email: 'admin@aquario.com',
      senha: 'password123',
      centroId: mockCentro.id,
      cursoId: mockCurso.id,
    });

    assert.strictEqual(usuariosRepository.items[0].props.papelPlataforma, 'MASTER_ADMIN');
  });

  it('should auto-verify user when EMAIL_MOCK_MODE is true', async () => {
    // EMAIL_MOCK_MODE=true is set in beforeEach
    const result = await sut.execute({
      nome: 'Test User',
      email: 'test@academico.ufpb.br',
      senha: 'password123',
      centroId: mockCentro.id,
      cursoId: mockCurso.id,
    });

    assert.strictEqual(result.autoVerificado, true);
    assert.strictEqual(usuariosRepository.items[0].props.eVerificado, true);
    // No verification email sent, no token created
    assert.strictEqual(emailService.sentEmails.length, 0);
    assert.strictEqual(tokenRepository.items.length, 0);
  });

  it('should send verification email when EMAIL_MOCK_MODE is false', async () => {
    // Disable mock mode for this test
    process.env.EMAIL_MOCK_MODE = 'false';

    const result = await sut.execute({
      nome: 'Test User',
      email: 'test2@academico.ufpb.br',
      senha: 'password123',
      centroId: mockCentro.id,
      cursoId: mockCurso.id,
    });

    assert.strictEqual(result.autoVerificado, false);
    assert.strictEqual(usuariosRepository.items[0].props.eVerificado, false);
    assert.ok(emailService.wasVerificationEmailSentTo('test2@academico.ufpb.br'));
    assert.strictEqual(tokenRepository.items.length, 1);
    assert.strictEqual(tokenRepository.items[0].tipo, 'VERIFICACAO_EMAIL');
  });

  it('should hash password with bcrypt', async () => {
    await sut.execute({
      nome: 'Test User',
      email: 'test@academico.ufpb.br',
      senha: 'password123',
      centroId: mockCentro.id,
      cursoId: mockCurso.id,
    });

    const user = usuariosRepository.items[0];
    assert.ok(user.props.senhaHash !== 'password123');
    assert.ok(user.props.senhaHash.startsWith('$2'));
  });

  it('should reject duplicate emails', async () => {
    await sut.execute({
      nome: 'Test User 1',
      email: 'test@academico.ufpb.br',
      senha: 'password123',
      centroId: mockCentro.id,
      cursoId: mockCurso.id,
    });

    await assert.rejects(
      async () => {
        await sut.execute({
          nome: 'Test User 2',
          email: 'test@academico.ufpb.br',
          senha: 'password456',
          centroId: mockCentro.id,
          cursoId: mockCurso.id,
        });
      },
      {
        message: 'Este e-mail já está em uso.',
      }
    );
  });

  it('should reject non-existent centro', async () => {
    await assert.rejects(
      async () => {
        await sut.execute({
          nome: 'Test User',
          email: 'test@academico.ufpb.br',
          senha: 'password123',
          centroId: 'non-existent',
          cursoId: mockCurso.id,
        });
      },
      {
        message: 'Centro não encontrado.',
      }
    );
  });

  it('should reject non-existent curso', async () => {
    await assert.rejects(
      async () => {
        await sut.execute({
          nome: 'Test User',
          email: 'test@academico.ufpb.br',
          senha: 'password123',
          centroId: mockCentro.id,
          cursoId: 'non-existent',
        });
      },
      {
        message: 'Curso não encontrado.',
      }
    );
  });

  it('should reject curso from different centro', async () => {
    // Add a curso from a different centro
    const outroCurso: Curso = {
      id: 'curso-2',
      nome: 'Engenharia Civil',
      centroId: 'centro-2', // Different centro
    };
    cursosRepository.addCurso(outroCurso);

    await assert.rejects(
      async () => {
        await sut.execute({
          nome: 'Test User',
          email: 'test@academico.ufpb.br',
          senha: 'password123',
          centroId: mockCentro.id,
          cursoId: outroCurso.id,
        });
      },
      {
        message: 'O curso selecionado não pertence ao centro informado.',
      }
    );
  });

  it('should normalize email to lowercase', async () => {
    await sut.execute({
      nome: 'Test User',
      email: 'TEST@ACADEMICO.UFPB.BR',
      senha: 'password123',
      centroId: mockCentro.id,
      cursoId: mockCurso.id,
    });

    assert.strictEqual(usuariosRepository.items[0].props.email, 'test@academico.ufpb.br');
  });
});
