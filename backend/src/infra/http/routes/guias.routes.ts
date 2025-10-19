import { Router } from 'express';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { ensureAdminOrDocente } from '../middlewares/ensureAdminOrDocente';
import { CriarGuiaController } from '../controllers/CriarGuiaController';
import { ListarGuiasController } from '../controllers/ListarGuiasController';
import { BuscarGuiaPorIdController } from '../controllers/BuscarGuiaPorIdController';
import { BuscarGuiaPorSlugController } from '../controllers/BuscarGuiaPorSlugController';
import { EditarGuiaController } from '../controllers/EditarGuiaController';
import { DeletarGuiaController } from '../controllers/DeletarGuiaController';
import { CriarSecaoGuiaController } from '../controllers/CriarSecaoGuiaController';
import { ListarSecoesGuiaController } from '../controllers/ListarSecoesGuiaController';
import { EditarSecaoGuiaController } from '../controllers/EditarSecaoGuiaController';
import { DeletarSecaoGuiaController } from '../controllers/DeletarSecaoGuiaController';
import { CriarSubSecaoGuiaController } from '../controllers/CriarSubSecaoGuiaController';
import { ListarSubSecoesGuiaController } from '../controllers/ListarSubSecoesGuiaController';
import { EditarSubSecaoGuiaController } from '../controllers/EditarSubSecaoGuiaController';
import { DeletarSubSecaoGuiaController } from '../controllers/DeletarSubSecaoGuiaController';

const guiasRouter = Router();

// Controller instances
const criarGuiaController = new CriarGuiaController();
const listarGuiasController = new ListarGuiasController();
const buscarGuiaPorIdController = new BuscarGuiaPorIdController();
const buscarGuiaPorSlugController = new BuscarGuiaPorSlugController();
const editarGuiaController = new EditarGuiaController();
const deletarGuiaController = new DeletarGuiaController();

const criarSecaoGuiaController = new CriarSecaoGuiaController();
const listarSecoesGuiaController = new ListarSecoesGuiaController();
const editarSecaoGuiaController = new EditarSecaoGuiaController();
const deletarSecaoGuiaController = new DeletarSecaoGuiaController();

const criarSubSecaoGuiaController = new CriarSubSecaoGuiaController();
const listarSubSecoesGuiaController = new ListarSubSecoesGuiaController();
const editarSubSecaoGuiaController = new EditarSubSecaoGuiaController();
const deletarSubSecaoGuiaController = new DeletarSubSecaoGuiaController();

// Public routes
guiasRouter.get('/', listarGuiasController.handle);
guiasRouter.get('/slug/:slug', buscarGuiaPorSlugController.handle);
guiasRouter.get('/:id', buscarGuiaPorIdController.handle);
guiasRouter.get('/:guiaId/secoes', listarSecoesGuiaController.handle);
guiasRouter.get('/secoes/:secaoId/subsecoes', listarSubSecoesGuiaController.handle);

// Protected routes (admin/docente only)
guiasRouter.post('/', ensureAuthenticated, ensureAdminOrDocente, criarGuiaController.handle);
guiasRouter.put('/:id', ensureAuthenticated, ensureAdminOrDocente, editarGuiaController.handle);
guiasRouter.delete('/:id', ensureAuthenticated, ensureAdminOrDocente, deletarGuiaController.handle);

// Section routes
guiasRouter.post(
  '/:guiaId/secoes',
  ensureAuthenticated,
  ensureAdminOrDocente,
  criarSecaoGuiaController.handle
);
guiasRouter.put(
  '/secoes/:id',
  ensureAuthenticated,
  ensureAdminOrDocente,
  editarSecaoGuiaController.handle
);
guiasRouter.delete(
  '/secoes/:id',
  ensureAuthenticated,
  ensureAdminOrDocente,
  deletarSecaoGuiaController.handle
);

// Subsection routes
guiasRouter.post(
  '/secoes/:secaoId/subsecoes',
  ensureAuthenticated,
  ensureAdminOrDocente,
  criarSubSecaoGuiaController.handle
);
guiasRouter.put(
  '/subsecoes/:id',
  ensureAuthenticated,
  ensureAdminOrDocente,
  editarSubSecaoGuiaController.handle
);
guiasRouter.delete(
  '/subsecoes/:id',
  ensureAuthenticated,
  ensureAdminOrDocente,
  deletarSubSecaoGuiaController.handle
);

export { guiasRouter };
