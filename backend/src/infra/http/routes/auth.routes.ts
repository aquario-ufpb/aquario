import { Router } from 'express';
import { AuthenticateController } from '../controllers/AuthenticateController';
import { RegisterController } from '../controllers/RegisterController';
import { MeuPerfilController } from '../controllers/MeuPerfilController';
import { VerificarEmailController } from '../controllers/VerificarEmailController';
import { ReenviarVerificacaoController } from '../controllers/ReenviarVerificacaoController';
import { EsqueciSenhaController } from '../controllers/EsqueciSenhaController';
import { ResetarSenhaController } from '../controllers/ResetarSenhaController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';

const authRouter = Router();

// Controllers
const loginController = new AuthenticateController();
const registerController = new RegisterController();
const meuPerfilController = new MeuPerfilController();
const verificarEmailController = new VerificarEmailController();
const reenviarVerificacaoController = new ReenviarVerificacaoController();
const esqueciSenhaController = new EsqueciSenhaController();
const resetarSenhaController = new ResetarSenhaController();

// Public routes
authRouter.post('/login', loginController.handle);
authRouter.post('/register', registerController.handle);
authRouter.post('/verificar-email', verificarEmailController.handle);
authRouter.post('/esqueci-senha', esqueciSenhaController.handle);
authRouter.post('/resetar-senha', resetarSenhaController.handle);

// Protected routes
authRouter.get('/me', ensureAuthenticated, meuPerfilController.handle);
authRouter.post('/reenviar-verificacao', ensureAuthenticated, reenviarVerificacaoController.handle);

export { authRouter };
