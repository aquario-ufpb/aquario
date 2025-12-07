import { Router } from 'express';
import { SearchController } from '../controllers/search/SearchController';

const searchRoutes = Router();
const searchController = new SearchController();

searchRoutes.get('/', searchController.handle);

export { searchRoutes };
