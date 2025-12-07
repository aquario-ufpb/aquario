import { Router } from 'express';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';
import { ensureAdmin } from '../middlewares/ensureAdmin';
import { CriarVagaController } from '../controllers/vagas/CriarVagaController';
import { ListarVagasController } from '../controllers/vagas/ListarVagasController';
import { EditarVagaController } from '../controllers/vagas/EditarVagaController';
import { DeletarVagaController } from '../controllers/vagas/DeletarVagaController';
import { BuscarVagaPorIdController } from '../controllers/vagas/BuscarVagaPorIdController';

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
