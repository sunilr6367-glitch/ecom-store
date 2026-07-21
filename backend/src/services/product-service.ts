/**
 * Product Service - Backward Compatibility Re-export
 *
 * This file re-exports all functionality from the new modular product service.
 * Existing imports will continue to work without modification.
 *
 * New imports should use: import { ... } from "./services/product"
 */

// Re-export all validators
export {
  CreateProductSchema,
  UpdateProductSchema,
  PriceSchema,
  ImageSchema,
  ProductFilterSchema,
  ProductSearchSchema,
  type CreateProductInput,
  type UpdateProductInput,
  type ProductFilter,
  type ProductSearch,
} from './product';

// Re-export query service
export { ProductQueryService, productQueryService } from './product';

// Re-export mutation service
export { ProductMutationService, productMutationService } from './product';

// Re-export stats service
export {
  ProductStatsService,
  productStatsService,
  type ProductStats,
} from './product';

/**
 * ProductService - Legacy class for backward compatibility
 *
 * This class combines all service methods for backward compatibility.
 *
 * @deprecated Use productQueryService, productMutationService,
 *             or productStatsService directly instead
 */
// Import from the re-exported modules
import { ProductQueryService } from './product';
import { ProductMutationService } from './product';
import { ProductStatsService } from './product';

// Create instances
const queryService = new ProductQueryService();
const mutationService = new ProductMutationService();
const statsService = new ProductStatsService();

// Combined legacy service class
export class ProductService {
  // Query methods
  async listDetailed(filters: Parameters<typeof queryService.listDetailed>[0]) {
    return queryService.listDetailed(filters);
  }

  async list(limit?: number, offset?: number) {
    return queryService.list(limit, offset);
  }

  async retrieve(idOrHandle: string) {
    return queryService.retrieve(idOrHandle);
  }

  async retrieveMany(ids: string[]) {
    return queryService.retrieveMany(ids);
  }

  async search(
    query: string,
    filters?: Parameters<typeof queryService.search>[1]
  ) {
    return queryService.search(query, filters);
  }

  async getSuggestions(query: string, limit?: number) {
    return queryService.getSuggestions(query, limit);
  }

  // Mutation methods
  async create(data: Parameters<typeof mutationService.create>[0]) {
    return mutationService.create(data);
  }

  async update(id: string, data: Parameters<typeof mutationService.update>[1]) {
    return mutationService.update(id, data);
  }

  async delete(id: string) {
    return mutationService.delete(id);
  }

  // Stats methods
  async getStats() {
    return statsService.getStats();
  }
}

/**
 * Legacy singleton export - maintains backward compatibility
 *
 * @deprecated Use productQueryService, productMutationService,
 *             or productStatsService instead
 */
export const productService = new ProductService();
