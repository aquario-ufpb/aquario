import { Router } from 'express';
import { ListarUsuariosController } from '../controllers/usuarios/ListarUsuariosController';
import { BuscarUsuarioPorIdController } from '../controllers/usuarios/BuscarUsuarioPorIdController';
import { AtualizarPapelPlataformaController } from '../controllers/usuarios/AtualizarPapelPlataformaController';
import { DeletarUsuarioController } from '../controllers/usuarios/DeletarUsuarioController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { ensureAdmin } from '../middlewares/ensureAdmin';

const usuariosRouter = Router();

const listarUsuariosController = new ListarUsuariosController();
const buscarUsuarioPorIdController = new BuscarUsuarioPorIdController();
const atualizarPapelPlataformaController = new AtualizarPapelPlataformaController();
const deletarUsuarioController = new DeletarUsuarioController();

usuariosRouter.get('/', listarUsuariosController.handle);
usuariosRouter.get('/:id', buscarUsuarioPorIdController.handle);
usuariosRouter.patch(
  '/:id/role',
  ensureAuthenticated,
  ensureAdmin,
  atualizarPapelPlataformaController.handle
);
usuariosRouter.delete('/:id', ensureAuthenticated, ensureAdmin, deletarUsuarioController.handle);

export { usuariosRouter };
