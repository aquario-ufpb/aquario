import { Router } from 'express';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { ensureAdmin } from '../middlewares/ensureAdmin';
import { CriarVagaController } from '../controllers/CriarVagaController';
import { ListarVagasController } from '../controllers/ListarVagasController';
import { EditarVagaController } from '../controllers/EditarVagaController';
import { DeletarVagaController } from '../controllers/DeletarVagaController';
import { BuscarVagaPorIdController } from '../controllers/BuscarVagaPorIdController';

const vagasRouter = Router();

const criarVagaController = new CriarVagaController();
const listarVagasController = new ListarVagasController();
const editarVagaController = new EditarVagaController();
const deletarVagaController = new DeletarVagaController();
const buscarVagaPorIdController = new BuscarVagaPorIdController();

vagasRouter.get('/', listarVagasController.handle);
vagasRouter.get('/:id', buscarVagaPorIdController.handle);
vagasRouter.post('/', ensureAuthenticated, ensureAdmin, criarVagaController.handle);
vagasRouter.put('/:id', ensureAuthenticated, editarVagaController.handle);
vagasRouter.delete('/:id', ensureAuthenticated, deletarVagaController.handle);

export { vagasRouter };
