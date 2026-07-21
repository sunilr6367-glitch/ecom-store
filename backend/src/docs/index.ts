import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';

const app = new OpenAPIHono();

// Define API Info
app.doc('/doc', {
  openapi: '3.0.0',
  info: {
    version: '1.0.0',
    title: 'Odhvica API',
    description: `
# Odhvica E-Commerce Platform API

Welcome to the Odhvica API documentation. This API provides endpoints for managing products, categories, orders, customers, and more.

## Authentication

All protected endpoints require a JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <your-token>
\`\`\`

## Rate Limiting

- 100 requests per minute for authenticated endpoints
- 20 requests per minute for unauthenticated endpoints

## Response Format

All responses follow a consistent format:
\`\`\`json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
\`\`\`

## Error Format

Errors return a consistent format:
\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": [ ... ]
  }
}
\`\`\`
    `,
  },
  servers: [
    {
      url: 'http://localhost:4000',
      description: 'Local Server',
    },
    {
      url: 'https://api.odhvica.com',
      description: 'Production Server',
    },
  ],
});

// Mount Scalar UI
app.get(
  '/reference',
  apiReference({
    spec: {
      url: '/docs/doc',
    },
    pageTitle: 'Odhvica API Documentation',
  })
);

// Health check endpoint
const healthRoute = createRoute({
  method: 'get',
  path: '/health-check',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            status: z.string(),
            message: z.string(),
          }),
        },
      },
      description: 'Health check endpoint',
    },
  },
});

app.openapi(healthRoute, (c) => {
  return c.json({
    status: 'ok',
    message: 'API is running',
  });
});

// Export the OpenAPI spec generator
export function getOpenAPISpec() {
  return {
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'Odhvica API',
      description: 'E-commerce Platform API Documentation',
    },
    servers: [
      { url: 'http://localhost:4000', description: 'Local Server' },
      { url: 'https://api.odhvica.com', description: 'Production Server' },
    ],
    paths: {
      '/health-check': {
        get: {
          summary: 'Health Check',
          description: 'Check if the API is running',
          responses: {
            200: {
              description: 'API is healthy',
            },
          },
        },
      },
      '/products': {
        get: {
          summary: 'List Products',
          description: 'Retrieve a paginated list of products',
          tags: ['Products'],
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'string' } },
            { name: 'offset', in: 'query', schema: { type: 'string' } },
            { name: 'status', in: 'query', schema: { type: 'string' } },
            { name: 'category_id', in: 'query', schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Products retrieved successfully' },
          },
        },
        post: {
          summary: 'Create Product',
          description: 'Create a new product',
          tags: ['Products'],
          security: [{ bearerAuth: [] }],
          responses: {
            201: { description: 'Product created successfully' },
          },
        },
      },
      '/products/{id}': {
        get: {
          summary: 'Get Product',
          description: 'Get a product by ID',
          tags: ['Products'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: { description: 'Product retrieved successfully' },
            404: { description: 'Product not found' },
          },
        },
        put: {
          summary: 'Update Product',
          description: 'Update a product',
          tags: ['Products'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: { description: 'Product updated successfully' },
          },
        },
        delete: {
          summary: 'Delete Product',
          description: 'Delete a product',
          tags: ['Products'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: { description: 'Product deleted successfully' },
          },
        },
      },
      '/categories': {
        get: {
          summary: 'List Categories',
          description: 'Retrieve all categories',
          tags: ['Categories'],
          responses: {
            200: { description: 'Categories retrieved successfully' },
          },
        },
        post: {
          summary: 'Create Category',
          description: 'Create a new category',
          tags: ['Categories'],
          security: [{ bearerAuth: [] }],
          responses: {
            201: { description: 'Category created successfully' },
          },
        },
      },
      '/categories/{id}': {
        get: {
          summary: 'Get Category',
          description: 'Get a category by ID',
          tags: ['Categories'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: { description: 'Category retrieved successfully' },
          },
        },
        put: {
          summary: 'Update Category',
          description: 'Update a category',
          tags: ['Categories'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: { description: 'Category updated successfully' },
          },
        },
        delete: {
          summary: 'Delete Category',
          description: 'Delete a category',
          tags: ['Categories'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: { description: 'Category deleted successfully' },
          },
        },
      },
      '/auth/login': {
        post: {
          summary: 'Login',
          description: 'Authenticate and receive a JWT token',
          tags: ['Authentication'],
          requestBody: {
            content: {
              'application/json': {
                schema: z.object({
                  email: z.string().email(),
                  password: z.string(),
                }),
              },
            },
          },
          responses: {
            200: { description: 'Login successful' },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/auth/register': {
        post: {
          summary: 'Register',
          description: 'Create a new customer account',
          tags: ['Authentication'],
          requestBody: {
            content: {
              'application/json': {
                schema: z.object({
                  email: z.string().email(),
                  password: z.string().min(8),
                  first_name: z.string(),
                  last_name: z.string(),
                }),
              },
            },
          },
          responses: {
            201: { description: 'Registration successful' },
            400: { description: 'Validation error' },
          },
        },
      },
      '/orders': {
        get: {
          summary: 'List Orders',
          description: 'Retrieve customer orders',
          tags: ['Orders'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Orders retrieved successfully' },
          },
        },
        post: {
          summary: 'Create Order',
          description: 'Create a new order from cart',
          tags: ['Orders'],
          security: [{ bearerAuth: [] }],
          responses: {
            201: { description: 'Order created successfully' },
          },
        },
      },
      '/orders/{id}': {
        get: {
          summary: 'Get Order',
          description: 'Get order details',
          tags: ['Orders'],
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            200: { description: 'Order retrieved successfully' },
            404: { description: 'Order not found' },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: [
      { name: 'Products', description: 'Product management endpoints' },
      { name: 'Categories', description: 'Category management endpoints' },
      {
        name: 'Authentication',
        description: 'Authentication and authorization endpoints',
      },
      { name: 'Orders', description: 'Order management endpoints' },
      { name: 'Customers', description: 'Customer management endpoints' },
      { name: 'Storefront', description: 'Public storefront endpoints' },
    ],
  };
}

export default app;
