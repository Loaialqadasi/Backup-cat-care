import { NotFoundError } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/errors.js';
import { buildPagination, parsePagination } from '../Mohamed_Abdelgawwad-CCU-S1-04-Foundation/utils.js';
import { catsRepository } from './cats.repository.js';
import { Cat, CatListQuery, CatListResult, CreateCatInput } from './cats.types.js';

export const catsService = {
  async createCat(input: CreateCatInput): Promise<Cat> {
    return catsRepository.create(input);
  },

  async listCats(query: CatListQuery): Promise<CatListResult> {
    const { page, pageSize, offset } = parsePagination(query.page, query.pageSize);
    const [items, totalItems] = await Promise.all([
      catsRepository.list(query.search, query.healthStatus, pageSize, offset),
      catsRepository.count(query.search, query.healthStatus)
    ]);
    return {
      items,
      pagination: buildPagination(page, pageSize, totalItems)
    };
  },

  async getCatById(id: number): Promise<Cat> {
    const cat = await catsRepository.findById(id);
    if (!cat) {
      throw new NotFoundError('Cat not found');
    }
    return cat;
  }
};
