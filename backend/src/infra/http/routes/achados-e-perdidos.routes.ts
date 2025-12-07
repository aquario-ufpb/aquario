import { Router } from 'express';
import { CriarItemAchadoEPerdidoController } from '../controllers/achados-e-perdidos/CriarItemAchadoEPerdidoController';
import { ListarItensAchadosEPerdidosController } from '../controllers/achados-e-perdidos/ListarItensAchadosEPerdidosController';
import { BuscarItemAchadoEPerdidoPorIdController } from '../controllers/achados-e-perdidos/BuscarItemAchadoEPerdidoPorIdController';
import { AtualizarStatusItemAchadoEPerdidoController } from '../controllers/achados-e-perdidos/AtualizarStatusItemAchadoEPerdidoController';
import { DeletarItemAchadoEPerdidoController } from '../controllers/achados-e-perdidos/DeletarItemAchadoEPerdidoController';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated';

const achadosEPerdidosRouter = Router();

const criarItemController = new CriarItemAchadoEPerdidoController();
const listarItensController = new ListarItensAchadosEPerdidosController();
const buscarItemPorIdController = new BuscarItemAchadoEPerdidoPorIdController();
const atualizarStatusController = new AtualizarStatusItemAchadoEPerdidoController();
const deletarItemController = new DeletarItemAchadoEPerdidoController();

// Rotas Públicas
achadosEPerdidosRouter.get('/', listarItensController.handle);
achadosEPerdidosRouter.get('/:id', buscarItemPorIdController.handle);

// Rotas Protegidas
achadosEPerdidosRouter.post('/', ensureAuthenticated, criarItemController.handle);
achadosEPerdidosRouter.patch('/:id', ensureAuthenticated, atualizarStatusController.handle);
achadosEPerdidosRouter.delete('/:id', ensureAuthenticated, deletarItemController.handle);

export { achadosEPerdidosRouter };
