import { Router } from 'express';
import { ListarEntidadesController } from '../controllers/entidades/ListarEntidadesController';
import { BuscarEntidadePorIdController } from '../controllers/entidades/BuscarEntidadePorIdController';
import { BuscarEntidadePorSlugController } from '../controllers/entidades/BuscarEntidadePorSlugController';
import { EditarEntidadeController } from '../controllers/entidades/EditarEntidadeController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';

const entidadesRouter = Router();

const listarEntidadesController = new ListarEntidadesController();
const buscarEntidadePorIdController = new BuscarEntidadePorIdController();
const buscarEntidadePorSlugController = new BuscarEntidadePorSlugController();
const editarEntidadeController = new EditarEntidadeController();

entidadesRouter.get('/', listarEntidadesController.handle);
entidadesRouter.get('/slug/:slug', buscarEntidadePorSlugController.handle);
entidadesRouter.get('/:id', buscarEntidadePorIdController.handle);
entidadesRouter.put('/:id', ensureAuthenticated, editarEntidadeController.handle);

export { entidadesRouter };
