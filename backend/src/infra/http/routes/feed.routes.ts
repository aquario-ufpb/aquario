import { Router } from 'express';
import { GerarFeedController } from '../controllers/feed/GerarFeedController';

const feedRouter = Router();

const gerarFeedController = new GerarFeedController();

feedRouter.get('/', gerarFeedController.handle);

export { feedRouter };
