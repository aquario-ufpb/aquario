import { Router } from 'express';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { CriarProjetoController } from '../controllers/projetos/CriarProjetoController';
import { ListarProjetosController } from '../controllers/projetos/ListarProjetosController';
import { EditarProjetoController } from '../controllers/projetos/EditarProjetoController';
import { DeletarProjetoController } from '../controllers/projetos/DeletarProjetoController';
import { BuscarProjetoPorIdController } from '../controllers/projetos/BuscarProjetoPorIdController';

const projetosRouter = Router();

const criarProjetoController = new CriarProjetoController();
const listarProjetosController = new ListarProjetosController();
const editarProjetoController = new EditarProjetoController();
const deletarProjetoController = new DeletarProjetoController();
const buscarProjetoPorIdController = new BuscarProjetoPorIdController();

projetosRouter.get('/', listarProjetosController.handle);
projetosRouter.get('/:id', buscarProjetoPorIdController.handle);
projetosRouter.post('/', ensureAuthenticated, criarProjetoController.handle);
projetosRouter.put('/:id', ensureAuthenticated, editarProjetoController.handle);
projetosRouter.delete('/:id', ensureAuthenticated, deletarProjetoController.handle);

export { projetosRouter };
