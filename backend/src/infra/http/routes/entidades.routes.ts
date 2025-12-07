import { Router } from 'express';
import { ListarEntidadesController } from '../controllers/ListarEntidadesController';
import { BuscarEntidadePorIdController } from '../controllers/BuscarEntidadePorIdController';
import { BuscarEntidadePorSlugController } from '../controllers/BuscarEntidadePorSlugController';

const entidadesRouter = Router();

const listarEntidadesController = new ListarEntidadesController();
const buscarEntidadePorIdController = new BuscarEntidadePorIdController();
const buscarEntidadePorSlugController = new BuscarEntidadePorSlugController();

entidadesRouter.get('/', listarEntidadesController.handle);
entidadesRouter.get('/slug/:slug', buscarEntidadePorSlugController.handle);
entidadesRouter.get('/:id', buscarEntidadePorIdController.handle);

export { entidadesRouter };
