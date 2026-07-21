/**
 * Product Service Index
 * Re-exports all product services for convenient importing
 */

// Validators
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
} from './product-validator';

// Query Service
export {
  ProductQueryService,
  productQueryService,
} from './product-query-service';

// Mutation Service
export {
  ProductMutationService,
  productMutationService,
} from './product-mutation-service';

// Stats Service
export {
  ProductStatsService,
  productStatsService,
  type ProductStats,
} from './product-stats-service';
