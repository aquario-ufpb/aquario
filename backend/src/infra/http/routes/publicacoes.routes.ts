import { Router } from 'express';
import { CriarPublicacaoController } from '../controllers/publicacoes/CriarPublicacaoController';
import { ListarPublicacoesController } from '../controllers/publicacoes/ListarPublicacoesController';
import { BuscarPublicacaoPorIdController } from '../controllers/publicacoes/BuscarPublicacaoPorIdController';
import { EditarPublicacaoController } from '../controllers/publicacoes/EditarPublicacaoController';
import { DeletarPublicacaoController } from '../controllers/publicacoes/DeletarPublicacaoController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';

const publicacoesRouter = Router();

const criarPublicacaoController = new CriarPublicacaoController();
const listarPublicacoesController = new ListarPublicacoesController();
const buscarPublicacaoPorIdController = new BuscarPublicacaoPorIdController();
const editarPublicacaoController = new EditarPublicacaoController();
const deletarPublicacaoController = new DeletarPublicacaoController();

// Rotas Públicas
publicacoesRouter.get('/', listarPublicacoesController.handle);
publicacoesRouter.get('/:id', buscarPublicacaoPorIdController.handle);

// Rotas Protegidas
publicacoesRouter.post('/', ensureAuthenticated, criarPublicacaoController.handle);
publicacoesRouter.put('/:id', ensureAuthenticated, editarPublicacaoController.handle);
publicacoesRouter.delete('/:id', ensureAuthenticated, deletarPublicacaoController.handle);

export { publicacoesRouter };
