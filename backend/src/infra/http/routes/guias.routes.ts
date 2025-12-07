import { Router } from 'express';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { ensureAdmin } from '../middlewares/ensureAdmin';
import { CriarGuiaController } from '../controllers/guias/CriarGuiaController';
import { ListarGuiasController } from '../controllers/guias/ListarGuiasController';
import { BuscarGuiaPorIdController } from '../controllers/guias/BuscarGuiaPorIdController';
import { BuscarGuiaPorSlugController } from '../controllers/guias/BuscarGuiaPorSlugController';
import { EditarGuiaController } from '../controllers/guias/EditarGuiaController';
import { DeletarGuiaController } from '../controllers/guias/DeletarGuiaController';
import { CriarSecaoGuiaController } from '../controllers/guias/CriarSecaoGuiaController';
import { ListarSecoesGuiaController } from '../controllers/guias/ListarSecoesGuiaController';
import { EditarSecaoGuiaController } from '../controllers/guias/EditarSecaoGuiaController';
import { DeletarSecaoGuiaController } from '../controllers/guias/DeletarSecaoGuiaController';
import { CriarSubSecaoGuiaController } from '../controllers/guias/CriarSubSecaoGuiaController';
import { ListarSubSecoesGuiaController } from '../controllers/guias/ListarSubSecoesGuiaController';
import { EditarSubSecaoGuiaController } from '../controllers/guias/EditarSubSecaoGuiaController';
import { DeletarSubSecaoGuiaController } from '../controllers/guias/DeletarSubSecaoGuiaController';

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
guiasRouter.post('/', ensureAuthenticated, ensureAdmin, criarGuiaController.handle);
guiasRouter.put('/:id', ensureAuthenticated, ensureAdmin, editarGuiaController.handle);
guiasRouter.delete('/:id', ensureAuthenticated, ensureAdmin, deletarGuiaController.handle);

// Section routes
guiasRouter.post(
  '/:guiaId/secoes',
  ensureAuthenticated,
  ensureAdmin,
  criarSecaoGuiaController.handle
);
guiasRouter.put(
  '/secoes/:id',
  ensureAuthenticated,
  ensureAdmin,
  editarSecaoGuiaController.handle
);
guiasRouter.delete(
  '/secoes/:id',
  ensureAuthenticated,
  ensureAdmin,
  deletarSecaoGuiaController.handle
);

// Subsection routes
guiasRouter.post(
  '/secoes/:secaoId/subsecoes',
  ensureAuthenticated,
  ensureAdmin,
  criarSubSecaoGuiaController.handle
);
guiasRouter.put(
  '/subsecoes/:id',
  ensureAuthenticated,
  ensureAdmin,
  editarSubSecaoGuiaController.handle
);
guiasRouter.delete(
  '/subsecoes/:id',
  ensureAuthenticated,
  ensureAdmin,
  deletarSubSecaoGuiaController.handle
);

export { guiasRouter };
