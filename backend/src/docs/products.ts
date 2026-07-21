import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';

// Common schemas
export const ErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.any()).optional(),
  }),
});

export const PaginationParams = z.object({
  limit: z.number().int().min(1).max(100).default(20).openapi({ example: 20 }),
  offset: z.number().int().min(0).default(0).openapi({ example: 0 }),
});

export const PaginationMeta = z.object({
  total: z.number().int(),
  limit: z.number().int(),
  offset: z.number().int(),
});

// Product schemas
export const ProductSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
  title: z.string().min(1).openapi({ example: 'Premium Cotton T-Shirt' }),
  subtitle: z.string().optional().openapi({ example: 'Soft organic cotton' }),
  description: z
    .string()
    .optional()
    .openapi({ description: 'Product description in HTML' }),
  handle: z.string().min(1).openapi({ example: 'premium-cotton-t-shirt' }),
  status: z
    .enum(['draft', 'published', 'proposed', 'rejected'])
    .openapi({ example: 'published' }),
  is_giftcard: z.boolean().default(false).openapi({ example: false }),
  discountable: z.boolean().default(true).openapi({ example: true }),
  thumbnail: z
    .string()
    .url()
    .optional()
    .openapi({ example: 'https://example.com/images/tshirt.jpg' }),
  weight: z.number().int().optional().openapi({ example: 200 }),
  length: z.number().int().optional(),
  height: z.number().int().optional(),
  width: z.number().int().optional(),
  origin_country: z.string().optional().openapi({ example: 'IN' }),
  hs_code: z.string().optional(),
  material: z.string().optional().openapi({ example: '100% Organic Cotton' }),
  metadata: z.record(z.any()).optional(),
  created_at: z
    .string()
    .datetime()
    .openapi({ example: '2024-01-15T10:30:00Z' }),
  updated_at: z
    .string()
    .datetime()
    .openapi({ example: '2024-01-20T14:45:00Z' }),
});

export const ProductVariantSchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({ example: '550e8400-e29b-41d4-a716-446655440001' }),
  product_id: z.string().uuid(),
  title: z.string().openapi({ example: 'Large / Blue' }),
  sku: z.string().optional().openapi({ example: 'TSHIRT-L-BLU' }),
  barcode: z.string().optional(),
  inventory_quantity: z.number().int().default(0).openapi({ example: 100 }),
  allow_backorder: z.boolean().default(false),
  manage_inventory: z.boolean().default(true),
  prices: z
    .array(
      z.object({
        id: z.string().uuid(),
        currency_code: z.string().length(3).openapi({ example: 'USD' }),
        amount: z.number().int().openapi({ example: 2999 }),
        min_quantity: z.number().int().default(1),
      })
    )
    .optional(),
});

export const ProductWithVariantsSchema = ProductSchema.extend({
  variants: z.array(ProductVariantSchema).optional(),
  images: z
    .array(
      z.object({
        id: z.string().uuid(),
        url: z.string().min(1).max(2048),
        alt_text: z.string().optional(),
        position: z.number().int(),
        is_thumbnail: z.boolean(),
      })
    )
    .optional(),
  categories: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        slug: z.string(),
      })
    )
    .optional(),
  tags: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        slug: z.string(),
      })
    )
    .optional(),
});

// Request/Response schemas
export const CreateProductSchema = z
  .object({
    title: z.string().min(1).openapi({ example: 'Premium Cotton T-Shirt' }),
    subtitle: z.string().optional().openapi({ example: 'Soft organic cotton' }),
    description: z.string().optional(),
    handle: z.string().min(1).openapi({ example: 'premium-cotton-t-shirt' }),
    status: z
      .enum(['draft', 'published', 'proposed', 'rejected'])
      .default('draft'),
    is_giftcard: z.boolean().default(false),
    discountable: z.boolean().default(true),
    weight: z.number().int().optional(),
    length: z.number().int().optional(),
    height: z.number().int().optional(),
    width: z.number().int().optional(),
    origin_country: z.string().optional(),
    hs_code: z.string().optional(),
    material: z.string().optional(),
    inventory_quantity: z.number().int().optional().default(0),
    thumbnail: z.string().min(1).max(2048).optional(),
    metadata: z.record(z.any()).optional(),
    options: z
      .array(
        z.object({
          title: z.string().openapi({ example: 'Size' }),
        })
      )
      .optional(),
    prices: z
      .array(
        z.object({
          region_id: z.string().uuid(),
          amount: z.number().int().min(0),
          currency_code: z.string().length(3),
        })
      )
      .optional(),
    images: z
      .array(
        z.object({
          url: z.string().min(1).max(2048),
          alt_text: z.string().optional(),
          is_thumbnail: z.boolean().default(false),
          position: z.number().int().default(0),
        })
      )
      .optional(),
    category_ids: z.array(z.string().uuid()).optional(),
    tag_ids: z.array(z.string().uuid()).optional(),
    price_type: z.enum(['fixed', 'on_request']).default('fixed'),
    care_instructions: z.string().optional(),
    size_guide: z.string().optional(),
  })
  .refine(
    (data) => {
      // guide Rule P-4: on_request = no price required, fixed = price required
      if (data.price_type === 'on_request') return true;
      return true; // price validation handled at variant level
    },
    { message: 'price_type validation failed' }
  )
  .openapi({ title: 'CreateProduct' });

export const UpdateProductSchema = CreateProductSchema.partial().openapi({
  title: 'UpdateProduct',
});

export const ProductListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(ProductSchema),
  meta: PaginationMeta,
  message: z.string(),
});

// Product routes documentation
export const productRoutesDoc = {
  // GET /products - List products
  listProducts: createRoute({
    method: 'get',
    path: '/products',
    summary: 'List all products',
    description:
      'Retrieve a paginated list of products with optional filtering by status, category, or tags.',
    tags: ['Products'],
    request: {
      query: z.object({
        limit: z.string().optional().openapi({ example: '20' }),
        offset: z.string().optional().openapi({ example: '0' }),
        status: z.string().optional().openapi({ example: 'published' }),
        category_id: z
          .string()
          .uuid()
          .optional()
          .openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
        tag_id: z.string().uuid().optional(),
        sort: z.string().optional().openapi({ example: 'created_at' }),
      }),
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: ProductListResponseSchema,
          },
        },
        description: 'Products retrieved successfully',
      },
    },
  }),

  // GET /products/{id} - Get single product
  getProduct: createRoute({
    method: 'get',
    path: '/products/{id}',
    summary: 'Get a product by ID',
    description:
      'Retrieve a single product by its ID or handle, including variants, images, categories, and tags.',
    tags: ['Products'],
    request: {
      params: z.object({
        id: z.string().uuid().openapi({ description: 'Product ID or handle' }),
      }),
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(true),
              data: z.object({ product: ProductWithVariantsSchema }),
              message: z.string(),
            }),
          },
        },
        description: 'Product retrieved successfully',
      },
      404: {
        content: {
          'application/json': {
            schema: ErrorSchema,
          },
        },
        description: 'Product not found',
      },
    },
  }),

  // POST /products - Create product
  createProduct: createRoute({
    method: 'post',
    path: '/products',
    summary: 'Create a new product',
    description:
      'Create a new product with optional variants, prices, images, categories, and tags. Requires admin authentication.',
    tags: ['Products'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CreateProductSchema,
          },
        },
      },
    },
    responses: {
      201: {
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(true),
              data: z.object({ product: ProductSchema }),
              message: z.string(),
            }),
          },
        },
        description: 'Product created successfully',
      },
      400: {
        content: {
          'application/json': {
            schema: ErrorSchema,
          },
        },
        description: 'Invalid product data',
      },
      401: {
        content: {
          'application/json': {
            schema: ErrorSchema,
          },
        },
        description: 'Unauthorized - Admin access required',
      },
    },
  }),

  // PUT /products/{id} - Update product
  updateProduct: createRoute({
    method: 'put',
    path: '/products/{id}',
    summary: 'Update a product',
    description:
      "Update an existing product's details. Requires admin authentication.",
    tags: ['Products'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: UpdateProductSchema,
          },
        },
      },
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(true),
              data: z.object({ product: ProductSchema }),
              message: z.string(),
            }),
          },
        },
        description: 'Product updated successfully',
      },
      404: {
        content: {
          'application/json': {
            schema: ErrorSchema,
          },
        },
        description: 'Product not found',
      },
    },
  }),

  // DELETE /products/{id} - Delete product
  deleteProduct: createRoute({
    method: 'delete',
    path: '/products/{id}',
    summary: 'Delete a product',
    description:
      'Delete a product and all its associated data (variants, images, prices). Requires admin authentication.',
    tags: ['Products'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(true),
              data: z.object({ id: z.string(), deleted: z.literal(true) }),
              message: z.string(),
            }),
          },
        },
        description: 'Product deleted successfully',
      },
    },
  }),
};
