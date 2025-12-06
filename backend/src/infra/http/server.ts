import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from '@/config/env';
import { logger } from '@/infra/logger';
import { publicacoesRouter } from './routes/publicacoes.routes';
import { achadosEPerdidosRouter } from './routes/achados-e-perdidos.routes';
import { authRouter } from './routes/auth.routes';
import { vagasRouter } from './routes/vagas.routes';
import { projetosRouter } from './routes/projetos.routes';
import { centrosRouter } from './routes/centros.routes';
import { usuariosRouter } from './routes/usuarios.routes';
import { entidadesRouter } from './routes/entidades.routes';
import { feedRouter } from './routes/feed.routes';
import { searchRoutes } from './routes/search.routes';
import { guiasRouter } from './routes/guias.routes';
import { requestLogger } from './middlewares/requestLogger';

const app: Express = express();
const port = env.PORT;
const serverLogger = logger.child('http:server');

// ===========================================
// Security Middleware
// ===========================================

// Helmet - Security headers (XSS, clickjacking, MIME sniffing, etc.)
app.use(helmet());

// CORS - Restrict origins in production
app.use(
  cors({
    origin: env.NODE_ENV === 'production' ? env.FRONTEND_URL : true,
    credentials: true,
  })
);

// Request body size limit - Prevent payload attacks
app.use(express.json({ limit: '10kb' }));

// ===========================================
// Rate Limiting
// ===========================================

// Global rate limit (100 requests per 15 minutes per IP)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Muitas requisições. Tente novamente mais tarde.' },
  skip: () => env.NODE_ENV === 'test', // Skip in test environment
});

// Strict rate limit for sensitive auth routes (5 requests per 15 minutes per IP)
const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Muitas tentativas. Tente novamente em 15 minutos.' },
  skip: () => env.NODE_ENV === 'test', // Skip in test environment
});

// Moderate rate limit for general write operations (20 requests per 15 minutes per IP)
const writeOperationsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Muitas requisições de escrita. Tente novamente mais tarde.' },
  skip: () => env.NODE_ENV === 'test', // Skip in test environment
});

// Apply global rate limit
app.use(globalLimiter);

// Apply strict rate limit to sensitive auth routes
app.use('/login', strictAuthLimiter);
app.use('/register', strictAuthLimiter);
app.use('/esqueci-senha', strictAuthLimiter);
app.use('/resetar-senha', strictAuthLimiter);

// Apply write operations limiter to POST/PUT/DELETE routes
app.use('/publicacoes', writeOperationsLimiter);
app.use('/achados-e-perdidos', writeOperationsLimiter);
app.use('/vagas', writeOperationsLimiter);
app.use('/projetos', writeOperationsLimiter);
app.use('/guias', writeOperationsLimiter);

// ===========================================
// Request Logging
// ===========================================
app.use(requestLogger);

// ===========================================
// Routes
// ===========================================
app.use('/publicacoes', publicacoesRouter);
app.use('/achados-e-perdidos', achadosEPerdidosRouter);
app.use('/vagas', vagasRouter);
app.use('/projetos', projetosRouter);
app.use('/centros', centrosRouter);
app.use('/usuarios', usuariosRouter);
app.use('/entidades', entidadesRouter);
app.use('/feed', feedRouter);
app.use('/search', searchRoutes);
app.use('/guias', guiasRouter);
app.use(authRouter);

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.send('Backend do Aquário está no ar!');
});

// ===========================================
// Server Startup
// ===========================================
app.listen(port, () => {
  serverLogger.info('Servidor iniciado', {
    port,
    nodeEnv: env.NODE_ENV,
    emailMockMode: env.EMAIL_MOCK_MODE,
  });
});

// ===========================================
// Error Handlers
// ===========================================
process.on('unhandledRejection', reason => {
  serverLogger.error('Unhandled rejection detected', reason);
});

process.on('uncaughtException', error => {
  serverLogger.error('Uncaught exception detected', error);
});
