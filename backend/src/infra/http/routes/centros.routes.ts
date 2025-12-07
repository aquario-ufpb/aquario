import { Router } from 'express';
import { ListarCentrosController } from '../controllers/centros/ListarCentrosController';
import { ListarCursosPorCentroController } from '../controllers/centros/ListarCursosPorCentroController';

const centrosRouter = Router();

const listarCentrosController = new ListarCentrosController();
const listarCursosPorCentroController = new ListarCursosPorCentroController();

centrosRouter.get('/', listarCentrosController.handle);
centrosRouter.get('/:id/cursos', listarCursosPorCentroController.handle);

export { centrosRouter };
