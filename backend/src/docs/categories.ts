import { createRoute, z } from '@hono/zod-openapi';

// Category schemas
export const CategorySchema = z.object({
  id: z
    .string()
    .uuid()
    .openapi({ example: '550e8400-e29b-41d4-a716-446655440000' }),
  name: z.string().min(1).openapi({ example: "Men's Clothing" }),
  slug: z.string().min(1).openapi({ example: 'mens-clothing' }),
  description: z
    .string()
    .optional()
    .openapi({ example: "All men's clothing items" }),
  image: z
    .string()
    .url()
    .optional()
    .openapi({ example: 'https://example.com/images/mens.jpg' }),
  is_active: z.boolean().default(true).openapi({ example: true }),
  parent_id: z
    .string()
    .uuid()
    .optional()
    .openapi({ description: 'Parent category ID for nested categories' }),
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

// Category routes documentation
export const categoryRoutesDoc = {
  // GET /categories - List categories
  listCategories: createRoute({
    method: 'get',
    path: '/categories',
    summary: 'List all categories',
    description:
      'Retrieve a list of all categories. Supports nested hierarchy when parent_id is provided.',
    tags: ['Categories'],
    request: {
      query: z.object({
        parent_id: z
          .string()
          .uuid()
          .optional()
          .openapi({ description: 'Filter by parent category ID' }),
        is_active: z
          .boolean()
          .optional()
          .openapi({ description: 'Filter by active status' }),
      }),
    },
    responses: {
      200: {
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(true),
              data: z.array(CategorySchema),
              message: z.string(),
            }),
          },
        },
        description: 'Categories retrieved successfully',
      },
    },
  }),

  // GET /categories/tree - Get category tree
  getCategoryTree: createRoute({
    method: 'get',
    path: '/categories/tree',
    summary: 'Get category tree',
    description: 'Retrieve all categories in a hierarchical tree structure.',
    tags: ['Categories'],
    responses: {
      200: {
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(true),
              data: z.array(z.any()),
              message: z.string(),
            }),
          },
        },
        description: 'Category tree retrieved successfully',
      },
    },
  }),

  // GET /categories/{id} - Get single category
  getCategory: createRoute({
    method: 'get',
    path: '/categories/{id}',
    summary: 'Get a category by ID',
    tags: ['Categories'],
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
              data: z.object({ category: CategorySchema }),
              message: z.string(),
            }),
          },
        },
        description: 'Category retrieved successfully',
      },
      404: {
        content: {
          'application/json': {
            schema: z.object({
              success: z.literal(false),
              error: z.object({
                code: z.string(),
                message: z.string(),
              }),
            }),
          },
        },
        description: 'Category not found',
      },
    },
  }),

  // POST /categories - Create category
  createCategory: createRoute({
    method: 'post',
    path: '/categories',
    summary: 'Create a new category',
    description:
      'Create a new category. Supports nested categories via parent_id. Requires admin authentication.',
    tags: ['Categories'],
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({
              name: z.string().min(1).openapi({ example: 'New Category' }),
              slug: z.string().min(1).openapi({ example: 'new-category' }),
              description: z.string().optional(),
              image: z.string().url().optional(),
              is_active: z.boolean().default(true),
              parent_id: z.string().uuid().optional(),
              metadata: z.record(z.any()).optional(),
            }),
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
              data: z.object({ category: CategorySchema }),
              message: z.string(),
            }),
          },
        },
        description: 'Category created successfully',
      },
    },
  }),

  // PUT /categories/{id} - Update category
  updateCategory: createRoute({
    method: 'put',
    path: '/categories/{id}',
    summary: 'Update a category',
    tags: ['Categories'],
    security: [{ bearerAuth: [] }],
    request: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: {
        content: {
          'application/json': {
            schema: CategorySchema.partial(),
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
              data: z.object({ category: CategorySchema }),
              message: z.string(),
            }),
          },
        },
        description: 'Category updated successfully',
      },
    },
  }),

  // DELETE /categories/{id} - Delete category
  deleteCategory: createRoute({
    method: 'delete',
    path: '/categories/{id}',
    summary: 'Delete a category',
    description:
      'Delete a category. If the category has child categories or products, it may fail or require force delete.',
    tags: ['Categories'],
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
        description: 'Category deleted successfully',
      },
    },
  }),
};
