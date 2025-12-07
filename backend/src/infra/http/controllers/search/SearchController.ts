import { Request, Response } from 'express';
import { SearchUseCase } from '@/application/search/use-cases/SearchUseCase';

class SearchController {
  async handle(request: Request, response: Response): Promise<Response> {
    const { q } = request.query;
    const searchUseCase = new SearchUseCase();

    const results = await searchUseCase.execute(q as string);

    return response.json(results);
  }
}

export { SearchController };
