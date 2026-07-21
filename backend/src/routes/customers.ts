import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { verifyAdminOrMcpService } from '../middleware/auth';
import { customerService } from '../services/customer-service';
import {
  asyncHandler,
  NotFoundError,
  ConflictError,
} from '../middleware/error-handler';
import {
  successResponse,
  paginatedResponse,
  HttpStatus,
} from '../utils/api-response';
import { serializeCustomer } from '../utils/safe-user';

const customersRouter = new Hono();

// Validation schemas
const UpdateCustomerSchema = z.object({
  first_name: z.string().min(1, 'First name is required').optional(),
  last_name: z.string().min(1, 'Last name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
});

// Apply admin authentication to all routes
customersRouter.use('*', verifyAdminOrMcpService);

// Get all customers with pagination and filters
customersRouter.get(
  '/',
  asyncHandler(async (c) => {
    const filters = c.req.query();
    const page = filters.page ? parseInt(filters.page) : 1;
    const limit = filters.limit ? parseInt(filters.limit) : 20;

    const result = await customerService.list({
      page,
      limit,
      search: filters.search,
      has_account: filters.has_account,
    });

    const total = result.pagination?.total || 0;

    return paginatedResponse(
      c,
      result.customers,
      {
        offset: (page - 1) * limit,
        limit,
        total,
      },
      'Customers retrieved successfully'
    );
  })
);

// BUG-008 FIX: Stats route MUST be before /:id to avoid being caught by the param route
// Get customer statistics
customersRouter.get(
  '/stats/overview',
  asyncHandler(async (c) => {
    const stats = await customerService.getStats();
    return successResponse(
      c,
      stats,
      'Customer statistics retrieved successfully'
    );
  })
);

// Get single customer details
customersRouter.get(
  '/:id',
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const customerData = await customerService.getById(id);

    if (!customerData) {
      throw new NotFoundError('Customer not found');
    }

    return successResponse(
      c,
      customerData,
      'Customer details retrieved successfully'
    );
  })
);

// Get customer orders
customersRouter.get(
  '/:id/orders',
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const page = c.req.query('page') ? parseInt(c.req.query('page')!) : 1;
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 10;

    const result = await customerService.getOrders(id, page, limit);

    const total = result.pagination?.total || 0;

    return paginatedResponse(
      c,
      result.orders,
      {
        offset: (page - 1) * limit,
        limit,
        total,
      },
      'Customer orders retrieved successfully'
    );
  })
);

// Update customer details
customersRouter.put(
  '/:id',
  zValidator('json', UpdateCustomerSchema),
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const body = (c.req as any).valid('json');

    const updated = await customerService.update(id, body);
    if (!updated) throw new NotFoundError('Customer not found');

    // 🔒 FIX-007: Use serializeCustomer utility
    const safeCustomer = serializeCustomer(updated as any);

    return successResponse(
      c,
      { customer: safeCustomer },
      'Customer updated successfully'
    );
  })
);

// Delete customer
customersRouter.delete(
  '/:id',
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    try {
      await customerService.delete(id);
      return successResponse(c, { message: 'Customer deleted successfully' });
    } catch (error: any) {
      if (error.message.includes('Cannot delete')) {
        throw new ConflictError(error.message);
      }
      throw error;
    }
  })
);

export default customersRouter;
