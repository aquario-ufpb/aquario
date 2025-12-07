import { Router } from 'express';
import { AuthenticateController } from '../controllers/auth/AuthenticateController';
import { RegisterController } from '../controllers/auth/RegisterController';
import { MeuPerfilController } from '../controllers/auth/MeuPerfilController';
import { VerificarEmailController } from '../controllers/auth/VerificarEmailController';
import { ReenviarVerificacaoController } from '../controllers/auth/ReenviarVerificacaoController';
import { SolicitarReenvioVerificacaoController } from '../controllers/auth/SolicitarReenvioVerificacaoController';
import { EsqueciSenhaController } from '../controllers/auth/EsqueciSenhaController';
import { ResetarSenhaController } from '../controllers/auth/ResetarSenhaController';
import { RefreshTokenController } from '../controllers/auth/RefreshTokenController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';

const authRouter = Router();

// Controllers
const loginController = new AuthenticateController();
const registerController = new RegisterController();
const meuPerfilController = new MeuPerfilController();
const verificarEmailController = new VerificarEmailController();
const reenviarVerificacaoController = new ReenviarVerificacaoController();
const solicitarReenvioVerificacaoController = new SolicitarReenvioVerificacaoController();
const esqueciSenhaController = new EsqueciSenhaController();
const resetarSenhaController = new ResetarSenhaController();
const refreshTokenController = new RefreshTokenController();

// Public routes
authRouter.post('/login', loginController.handle);
authRouter.post('/register', registerController.handle);
authRouter.post('/verificar-email', verificarEmailController.handle);
authRouter.post('/solicitar-reenvio-verificacao', solicitarReenvioVerificacaoController.handle);
authRouter.post('/esqueci-senha', esqueciSenhaController.handle);
authRouter.post('/resetar-senha', resetarSenhaController.handle);
authRouter.post('/refresh', refreshTokenController.handle);

// Protected routes
authRouter.get('/me', ensureAuthenticated, meuPerfilController.handle);
authRouter.post('/reenviar-verificacao', ensureAuthenticated, reenviarVerificacaoController.handle);

export { authRouter };
