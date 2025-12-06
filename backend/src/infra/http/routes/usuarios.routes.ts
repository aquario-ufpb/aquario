import { Router } from 'express';
import { ListarUsuariosController } from '../controllers/ListarUsuariosController';
import { BuscarUsuarioPorIdController } from '../controllers/BuscarUsuarioPorIdController';
import { AtualizarPapelPlataformaController } from '../controllers/AtualizarPapelPlataformaController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { ensureAdmin } from '../middlewares/ensureAdmin';

const usuariosRouter = Router();

const listarUsuariosController = new ListarUsuariosController();
const buscarUsuarioPorIdController = new BuscarUsuarioPorIdController();
const atualizarPapelPlataformaController = new AtualizarPapelPlataformaController();

usuariosRouter.get('/', listarUsuariosController.handle);
usuariosRouter.get('/:id', buscarUsuarioPorIdController.handle);
usuariosRouter.patch(
  '/:id/role',
  ensureAuthenticated,
  ensureAdmin,
  atualizarPapelPlataformaController.handle
);

export { usuariosRouter };
