import { Hono } from 'hono';
import { verifyAdminOrMcpService } from '../middleware/auth';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { generateInvoice } from '../services/pdf-service';
import { orderService } from '../services/order-service';
import type { CarrierProvider } from '../services/carrier-service';
import {
  asyncHandler,
  NotFoundError,
  ValidationError,
} from '../middleware/error-handler';
import { successResponse, paginatedResponse } from '../utils/api-response';
import { releaseInventoryReservation } from '../utils/inventory-reservation';
import { db } from '../db';
import { orders, order_status_history } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';

const ordersRouter = new Hono();

// Apply admin authentication to all routes
ordersRouter.use('*', verifyAdminOrMcpService);

// GET /orders - List all orders with filters
ordersRouter.get(
  '/',
  asyncHandler(async (c) => {
    const filters = c.req.query();
    const page = filters.page ? parseInt(filters.page) : 1;
    const limit = filters.limit ? parseInt(filters.limit) : 20;

    const result = await orderService.listOrders({
      page,
      limit,
      search: filters.search,
      status: filters.status,
      queue: filters.queue as 'open' | 'completed' | 'issues' | 'all',
      workflow_filter: filters.workflow_filter as
        | 'new'
        | 'processing'
        | 'due_today'
        | 'ready_to_ship'
        | 'missing_tracking'
        | 'all',
      date_from: filters.date_from,
      date_to: filters.date_to,
      sort_by: filters.sort_by,
      sort_order: filters.sort_order as 'asc' | 'desc',
    });

    // Fix: Access total from result.pagination.total
    const total = result.pagination?.total || 0;

    return paginatedResponse(
      c,
      result.orders,
      {
        offset: (page - 1) * limit,
        limit,
        total,
      },
      'Orders retrieved successfully'
    );
  })
);

// GET /orders/stats/overview - Get order statistics
ordersRouter.get(
  '/stats/overview',
  asyncHandler(async (c) => {
    const stats = await orderService.getStatsOverview();
    return successResponse(c, stats, 'Order statistics retrieved successfully');
  })
);

// GET /orders/stats/fulfillment - Operational fulfillment metrics
ordersRouter.get(
  '/stats/fulfillment',
  asyncHandler(async (c) => {
    const stats = await orderService.getFulfillmentMetrics();
    return successResponse(
      c,
      stats,
      'Fulfillment metrics retrieved successfully'
    );
  })
);

// GET /orders/stats/chart - Revenue chart data for dashboard
ordersRouter.get(
  '/stats/chart',
  asyncHandler(async (c) => {
    const rangeMap: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
    const range = c.req.query('range') || '30d';
    const days = rangeMap[range] || 30;
    const data = await orderService.getChartData(days);
    return successResponse(c, data, 'Chart data retrieved successfully');
  })
);

// GET /orders/export - Export orders to CSV
ordersRouter.get(
  '/export',
  asyncHandler(async (c) => {
    const { search = '', status = '' } = c.req.query();
    const rows = await orderService.getExportData({ search, status });

    const header = 'Order#,Date,Customer Name,Email,Status,Currency,Subtotal,Tax,Shipping,Total';
    const lines = rows.map((o: any) => {
      const name = [o.customer_first_name, o.customer_last_name].filter(Boolean).join(' ') || 'Guest';
      const date = o.created_at ? new Date(o.created_at).toISOString().split('T')[0] : '';
      const fmt = (v: number) => ((v || 0) / 100).toFixed(2);
      return [
        o.order_number,
        date,
        `"${name}"`,
        o.email,
        o.status,
        o.currency_code,
        fmt(o.subtotal),
        fmt(o.tax_total),
        fmt(o.shipping_total),
        fmt(o.total),
      ].join(',');
    });

    const csv = [header, ...lines].join('\n');
    const filename = `orders-export-${new Date().toISOString().split('T')[0]}.csv`;

    return c.body(csv as any, 200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
  })
);

// GET /orders/:id/invoice - Download invoice PDF
ordersRouter.get(
  '/:id/invoice',
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const data = await orderService.getInvoiceData(id);

    if (!data) throw new NotFoundError('Order not found');

    const pdfBuffer = await generateInvoice(data.order, data.items);

    return c.body(pdfBuffer as any, 200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="invoice-${data.order.order_number}.pdf"`,
    });
  })
);

// GET /orders/:id - Get single order details
ordersRouter.get(
  '/:id',
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const data = await orderService.getOrder(id);

    if (!data) throw new NotFoundError('Order not found');

    return successResponse(c, data, 'Order details retrieved successfully');
  })
);

// PUT /orders/:id/status - Update order status
const UpdateStatusSchema = z.object({
  status: z.enum([
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ]),
});

ordersRouter.put(
  '/:id/status',
  zValidator('json', UpdateStatusSchema),
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const { status } = (c.req as any).valid('json');

    if (status === 'refunded') {
      throw new ValidationError(
        'Refunds must be processed via the Returns workflow, not by manually changing order status.'
      );
    }

    const [existingOrder] = await db
      .select({ status: orders.status })
      .from(orders)
      .where(eq(orders.id, id));

    if (!existingOrder) throw new NotFoundError('Order not found');

    const updated = await orderService.updateStatus(id, status);

    if (status === 'cancelled') {
      await releaseInventoryReservation(id, 'admin_cancelled');
    }

    const user = c.get('user') as any;
    if (existingOrder.status !== status) {
      await db.insert(order_status_history).values({
        order_id: id,
        from_status: existingOrder.status,
        to_status: status,
        changed_by: 'admin',
        changed_by_id: user?.id,
      });
    }

    return successResponse(
      c,
      { order: updated },
      `Order status updated to ${status}`
    );
  })
);

// POST /orders/:id/tracking - Add tracking details
const AddTrackingSchema = z.object({
  tracking_number: z.string().min(1, 'Tracking number is required'),
  shipping_carrier: z.string().optional(),
  tracking_link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  ship_date: z.string().nullable().optional(),
  customer_note: z.string().max(2000).nullable().optional(),
  internal_note: z.string().max(2000).nullable().optional(),
  notify_buyer: z.boolean().default(true),
});

const CompleteOrderSchema = z.object({
  ship_date: z.string().nullable().optional(),
  shipping_carrier: z.string().nullable().optional(),
  shipping_service: z.string().nullable().optional(),
  tracking_number: z.string().nullable().optional(),
  tracking_link: z.string().url('Must be a valid URL').nullable().optional().or(z.literal('')),
  no_tracking: z.boolean().default(false),
  no_tracking_reason: z.string().max(500).nullable().optional(),
  customer_note: z.string().max(2000).nullable().optional(),
  internal_note: z.string().max(2000).nullable().optional(),
  notify_buyer: z.boolean().default(true),
  send_admin_copy: z.boolean().default(false),
});

const PackageSchema = z.object({
  ship_date: z.string().nullable().optional(),
  shipping_carrier: z.string().nullable().optional(),
  shipping_service: z.string().nullable().optional(),
  tracking_number: z.string().nullable().optional(),
  tracking_link: z.string().url('Must be a valid URL').nullable().optional().or(z.literal('')),
  no_tracking: z.boolean().default(false),
  no_tracking_reason: z.string().max(500).nullable().optional(),
  notify_buyer: z.boolean().default(true),
});

const UpdatePackageSchema = z.object({
  ship_date: z.string().nullable().optional(),
  shipping_carrier: z.string().nullable().optional(),
  shipping_service: z.string().nullable().optional(),
  tracking_number: z.string().nullable().optional(),
  tracking_link: z.string().url('Must be a valid URL').nullable().optional().or(z.literal('')),
  no_tracking: z.boolean().optional(),
  no_tracking_reason: z.string().max(500).nullable().optional(),
  notify_buyer: z.boolean().optional(),
  label_url: z.string().url('Must be a valid URL').nullable().optional().or(z.literal('')),
  label_file_name: z.string().max(255).nullable().optional(),
  label_state: z
    .enum(['draft', 'created', 'purchased', 'printed', 'voided', 'refunded'])
    .optional(),
  label_cost: z.number().int().nonnegative().nullable().optional(),
  label_currency: z.string().trim().min(3).max(3).nullable().optional(),
  package_weight_grams: z.number().int().nonnegative().nullable().optional(),
  package_length_cm: z.number().int().nonnegative().nullable().optional(),
  package_width_cm: z.number().int().nonnegative().nullable().optional(),
  package_height_cm: z.number().int().nonnegative().nullable().optional(),
  carrier_service: z.string().max(255).nullable().optional(),
  delivered_at: z.string().nullable().optional(),
});

const UpdateWorkflowSchema = z.object({
  ship_by_date: z.string().nullable().optional(),
  estimated_delivery_start: z.string().nullable().optional(),
  estimated_delivery_end: z.string().nullable().optional(),
  customer_note: z.string().max(2000).nullable().optional(),
  internal_note: z.string().max(2000).nullable().optional(),
});

const UpdateLabelSchema = z.object({
  label_status: z
    .enum(['draft', 'created', 'purchased', 'printed', 'voided', 'refunded'])
    .optional(),
  label_url: z
    .string()
    .url('Must be a valid URL')
    .nullable()
    .optional()
    .or(z.literal('')),
  label_file_name: z.string().max(255).nullable().optional(),
  label_cost: z.number().int().nonnegative().nullable().optional(),
  label_currency: z.string().trim().min(3).max(3).nullable().optional(),
  package_weight_grams: z.number().int().nonnegative().nullable().optional(),
  package_length_cm: z.number().int().nonnegative().nullable().optional(),
  package_width_cm: z.number().int().nonnegative().nullable().optional(),
  package_height_cm: z.number().int().nonnegative().nullable().optional(),
  carrier_service: z.string().max(255).nullable().optional(),
});

const CarrierProviderSchema = z.enum([
  'shiprocket',
  'delhivery',
  'easypost',
  'shippo',
]);

const OptionalPackageIdSchema = z
  .union([z.string().trim().min(1), z.literal('')])
  .nullable()
  .optional();

const CarrierRatesSchema = z.object({
  provider: CarrierProviderSchema.nullable().optional(),
  package_id: OptionalPackageIdSchema,
});

const CarrierPurchaseSchema = z.object({
  provider: CarrierProviderSchema.nullable().optional(),
  package_id: OptionalPackageIdSchema,
  courier_id: z.union([z.string().min(1), z.number().int().positive()]),
});

const BuyerUpdateSchema = z.object({
  template: z.enum([
    'order_received',
    'processing_started',
    'packed_with_care',
    'shipped',
    'delayed',
    'delivered_followup',
    'review_request',
    'return_refund_update',
    'custom',
  ]),
  subject: z.string().trim().min(3).max(180),
  message: z.string().trim().min(3).max(3000),
  include_tracking: z.boolean().default(true),
});

const PackagingChecklistSchema = z.object({
  product_quality_checked: z.boolean().default(false),
  size_color_verified: z.boolean().default(false),
  care_card_included: z.boolean().default(false),
  thank_you_note_included: z.boolean().default(false),
  gift_wrap_applied: z.boolean().default(false),
  invoice_included: z.boolean().default(false),
  checked_by: z.string().max(120).nullable().optional(),
});

ordersRouter.post(
  '/:id/tracking',
  zValidator('json', AddTrackingSchema),
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const data = (c.req as any).valid('json');

    const updated = await orderService.addTracking(id, data);

    return successResponse(
      c,
      { order: updated },
      'Tracking information added successfully'
    );
  })
);

ordersRouter.post(
  '/:id/complete-order',
  zValidator('json', CompleteOrderSchema),
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const data = (c.req as any).valid('json');

    const updated = await orderService.completeOrder(id, {
      ...data,
      tracking_link: data.tracking_link === '' ? null : data.tracking_link,
    });

    return successResponse(c, { order: updated }, 'Order completed successfully');
  })
);

ordersRouter.post(
  '/:id/packages',
  zValidator('json', PackageSchema),
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const data = (c.req as any).valid('json');

    const updated = await orderService.addPackage(id, {
      ...data,
      tracking_link: data.tracking_link === '' ? null : data.tracking_link,
    });

    return successResponse(c, { order: updated }, 'Package added successfully');
  })
);

ordersRouter.patch(
  '/:id/packages/:packageId',
  zValidator('json', UpdatePackageSchema),
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const packageId = c.req.param('packageId');
    const data = (c.req as any).valid('json');

    const updated = await orderService.updatePackage(id, packageId, {
      ...data,
      tracking_link: data.tracking_link === '' ? null : data.tracking_link,
      label_url: data.label_url === '' ? null : data.label_url,
    });

    return successResponse(c, { order: updated }, 'Package updated successfully');
  })
);

// PATCH /orders/:id/workflow - Update ETA, notes, and ship-by metadata
ordersRouter.patch(
  '/:id/workflow',
  zValidator('json', UpdateWorkflowSchema),
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const data = (c.req as any).valid('json');

    const updated = await orderService.updateWorkflow(id, data);

    return successResponse(
      c,
      { order: updated },
      'Order workflow updated successfully'
    );
  })
);

// PATCH /orders/:id/label - Save manual shipping label metadata
ordersRouter.patch(
  '/:id/label',
  zValidator('json', UpdateLabelSchema),
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const data = (c.req as any).valid('json');

    const updated = await orderService.updateLabel(id, {
      ...data,
      label_url: data.label_url === '' ? null : data.label_url,
    });

    return successResponse(
      c,
      { order: updated },
      'Order label workflow updated successfully'
    );
  })
);

// GET /orders/:id/carrier/readiness - Validate carrier integration readiness
ordersRouter.get(
  '/:id/carrier/readiness',
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const readiness = await orderService.getCarrierReadiness(id, {
      provider: (c.req.query('provider') || null) as
        | CarrierProvider
        | null,
      package_id: c.req.query('package_id') || null,
    });

    if (!readiness) throw new NotFoundError('Order not found');

    return successResponse(
      c,
      { readiness },
      'Carrier readiness checked successfully'
    );
  })
);

// POST /orders/:id/carrier/rates - Fetch carrier rate readiness/results
ordersRouter.post(
  '/:id/carrier/rates',
  zValidator('json', CarrierRatesSchema),
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const data = (c.req as any).valid('json');
    const result = await orderService.getCarrierRates(id, {
      provider: data.provider,
      package_id: data.package_id === '' ? null : data.package_id,
    });

    if (!result) throw new NotFoundError('Order not found');

    return successResponse(
      c,
      result,
      'Carrier rate request completed successfully'
    );
  })
);

// POST /orders/:id/carrier/purchase-label - Buy a live carrier label for a package
ordersRouter.post(
  '/:id/carrier/purchase-label',
  zValidator('json', CarrierPurchaseSchema),
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const data = (c.req as any).valid('json');
    const result = await orderService.purchaseCarrierLabel(id, {
      provider: data.provider,
      package_id: data.package_id === '' ? null : data.package_id,
      courier_id: data.courier_id,
    });

    if (!result) throw new NotFoundError('Order not found');

    return successResponse(
      c,
      result,
      'Carrier label purchased successfully'
    );
  })
);

// POST /orders/:id/buyer-update - Send a templated buyer communication
ordersRouter.post(
  '/:id/buyer-update',
  zValidator('json', BuyerUpdateSchema),
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const data = (c.req as any).valid('json');
    const updated = await orderService.sendBuyerUpdate(id, data);

    return successResponse(
      c,
      { order: updated },
      'Buyer update sent successfully'
    );
  })
);

// PATCH /orders/:id/packaging-checklist - Save personal brand fulfillment checks
ordersRouter.patch(
  '/:id/packaging-checklist',
  zValidator('json', PackagingChecklistSchema),
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const data = (c.req as any).valid('json');
    const updated = await orderService.updatePackagingChecklist(id, data);

    return successResponse(
      c,
      { order: updated },
      'Packaging checklist updated successfully'
    );
  })
);

// POST /orders/bulk-update-status - Bulk update order status
const BulkUpdateStatusSchema = z.object({
  order_ids: z.array(z.string()),
  status: z.enum([
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded',
  ]),
});

ordersRouter.post(
  '/bulk-update-status',
  zValidator('json', BulkUpdateStatusSchema),
  asyncHandler(async (c) => {
    const { order_ids, status } = (c.req as any).valid('json');

    if (status === 'refunded') {
      throw new ValidationError(
        'Refunds must be processed via the Returns workflow, not by manually changing order status.'
      );
    }

    const existingOrders = await db
      .select({ id: orders.id, status: orders.status })
      .from(orders)
      .where(inArray(orders.id, order_ids));

    const count = await orderService.bulkUpdateStatus(order_ids, status);

    if (status === 'cancelled') {
      await Promise.all(
        order_ids.map((id: string) => releaseInventoryReservation(id, 'admin_cancelled'))
      );
    }

    const user = c.get('user') as any;
    if (existingOrders.length > 0) {
      const historyRecords = existingOrders
        .filter(o => o.status !== status)
        .map(o => ({
          order_id: o.id,
          from_status: o.status,
          to_status: status,
          changed_by: 'admin',
          changed_by_id: user?.id,
        }));
      
      if (historyRecords.length > 0) {
        await db.insert(order_status_history).values(historyRecords);
      }
    }

    return successResponse(
      c,
      {
        updated_count: count,
        order_ids,
      },
      `${count} orders updated to ${status}`
    );
  })
);

// DELETE /orders/:id - Delete order
ordersRouter.delete(
  '/:id',
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    await orderService.deleteOrder(id);
    return successResponse(
      c,
      { id, deleted: true },
      'Order deleted successfully'
    );
  })
);

export default ordersRouter;
