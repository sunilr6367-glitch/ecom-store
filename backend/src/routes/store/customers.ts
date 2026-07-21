import { Hono } from 'hono';
import { verifyCustomer } from '../../middleware/customer-auth';
import { db } from '../../db/client';
import { customers, orders, addresses, studio_inquiries, studio_inquiry_messages } from '../../db/schema';
import { eq, desc, and, asc } from 'drizzle-orm';
import { z } from 'zod';
import { serializeCustomer } from '../../utils/safe-user';
import { broadcastStudioMessage } from '../../services/socket';
import { buildWorkflowSummary } from '../../utils/order-workflow';

const AddressSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  company: z.string().max(200).optional(),
  address_1: z.string().min(1, 'Address is required'),
  address_2: z.string().max(200).optional(),
  city: z.string().min(1, 'City is required'),
  province: z.string().max(100).optional(),
  postal_code: z.string().min(1, 'Postal code is required'),
  country_code: z.string().length(2, 'Country code must be 2 characters'),
  phone: z.string().max(20).optional(),
});

const storeCustomersRouter = new Hono();

function applyWorkflowSummary<T extends Record<string, any>>(order: T) {
  const workflow = buildWorkflowSummary(order);

  return {
    ...order,
    raw_status: order.status,
    status: workflow.status,
    workflow,
  };
}

// Get Current Customer Profile
storeCustomersRouter.get('/me', verifyCustomer, async (c) => {
  const payload = c.get('customer' as any) as any;
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, payload.sub),
  });

  if (!customer) return c.json({ error: 'Customer not found' }, 404);

  // 🔒 FIX-007: Use serializeCustomer utility
  const safeCustomer = serializeCustomer(customer);
  return c.json({ customer: safeCustomer });
});

// BUG-016 FIX: Added Zod validation for profile update

const UpdateProfileSchema = z.object({
  first_name: z.string().min(1).max(100).optional(),
  last_name: z.string().min(1).max(100).optional(),
  phone: z.string().min(1).max(20).optional(),
});

// Update Current Customer Profile
storeCustomersRouter.put('/me', verifyCustomer, async (c) => {
  const payload = c.get('customer' as any) as any;
  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400);
  }

  // Validate input
  const parseResult = UpdateProfileSchema.safeParse(body);
  if (!parseResult.success) {
    return c.json(
      { error: 'Validation failed', details: parseResult.error.errors },
      400
    );
  }

  const allowedUpdates = parseResult.data;

  try {
    const updated = await db
      .update(customers)
      .set({ ...allowedUpdates, updated_at: new Date() })
      .where(eq(customers.id, payload.sub))
      .returning();

    // 🔒 FIX-007: Use serializeCustomer utility
    const safeCustomer = serializeCustomer(updated[0]);
    return c.json({ customer: safeCustomer });
  } catch (error: unknown) {
    console.error('Error updating profile:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Get Customer Orders
storeCustomersRouter.get('/me/orders', verifyCustomer, async (c) => {
  const payload = c.get('customer' as any) as any;

  const customerOrders = await db.query.orders.findMany({
    where: eq(orders.customer_id, payload.sub),
    orderBy: [desc(orders.created_at)],
    with: {
      items: true,
      shipping_address: true,
    },
  });

  return c.json({ orders: customerOrders.map((order) => applyWorkflowSummary(order)) });
});

// Get Single Order
storeCustomersRouter.get('/me/orders/:id', verifyCustomer, async (c) => {
  const payload = c.get('customer' as any) as any;
  const orderId = c.req.param('id');

  const order = await db.query.orders.findFirst({
    where: (orders, { and, eq }) =>
      and(eq(orders.id, orderId), eq(orders.customer_id, payload.sub)),
    with: {
      items: true,
      shipping_address: true,
      region: true,
    },
  });

  if (!order) return c.json({ error: 'Order not found' }, 404);

  return c.json({ order: applyWorkflowSummary(order) });
});

// Get Customer Studio Messages
storeCustomersRouter.get('/me/studio-inquiries', verifyCustomer, async (c) => {
  const payload = c.get('customer' as any) as any;
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, payload.sub),
  });

  if (!customer?.email) return c.json({ inquiries: [] });

  const inquiries = await db
    .select({
      id: studio_inquiries.id,
      product_title: studio_inquiries.product_title,
      product_handle: studio_inquiries.product_handle,
      product_url: studio_inquiries.product_url,
      inquiry_type: studio_inquiries.inquiry_type,
      status: studio_inquiries.status,
      last_message_at: studio_inquiries.last_message_at,
      unread_by_customer: studio_inquiries.unread_by_customer,
      created_at: studio_inquiries.created_at,
    })
    .from(studio_inquiries)
    .where(eq(studio_inquiries.email, customer.email.toLowerCase()))
    .orderBy(desc(studio_inquiries.last_message_at))
    .limit(100);

  return c.json({ inquiries });
});

storeCustomersRouter.get('/me/studio-inquiries/:id', verifyCustomer, async (c) => {
  const payload = c.get('customer' as any) as any;
  const id = c.req.param('id');
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, payload.sub),
  });

  if (!customer?.email) return c.json({ error: 'Customer not found' }, 404);

  const [inquiry] = await db
    .select({
      id: studio_inquiries.id,
      product_title: studio_inquiries.product_title,
      product_handle: studio_inquiries.product_handle,
      product_url: studio_inquiries.product_url,
      inquiry_type: studio_inquiries.inquiry_type,
      status: studio_inquiries.status,
      last_message_at: studio_inquiries.last_message_at,
      unread_by_customer: studio_inquiries.unread_by_customer,
      created_at: studio_inquiries.created_at,
    })
    .from(studio_inquiries)
    .where(and(eq(studio_inquiries.id, id), eq(studio_inquiries.email, customer.email.toLowerCase())))
    .limit(1);

  if (!inquiry) return c.json({ error: 'Conversation not found' }, 404);

  const messages = await db
    .select({
      id: studio_inquiry_messages.id,
      sender_type: studio_inquiry_messages.sender_type,
      sender_name: studio_inquiry_messages.sender_name,
      sender_email: studio_inquiry_messages.sender_email,
      message: studio_inquiry_messages.message,
      created_at: studio_inquiry_messages.created_at,
    })
    .from(studio_inquiry_messages)
    .where(eq(studio_inquiry_messages.inquiry_id, id))
    .orderBy(asc(studio_inquiry_messages.created_at));

  await db
    .update(studio_inquiries)
    .set({ unread_by_customer: false, updated_at: new Date() })
    .where(eq(studio_inquiries.id, id));

  return c.json({ inquiry, messages });
});

storeCustomersRouter.post('/me/studio-inquiries/:id/messages', verifyCustomer, async (c) => {
  const payload = c.get('customer' as any) as any;
  const id = c.req.param('id');
  const customer = await db.query.customers.findFirst({
    where: eq(customers.id, payload.sub),
  });

  if (!customer?.email) return c.json({ error: 'Customer not found' }, 404);

  const body = await c.req.json().catch(() => ({}));
  const parsed = z.object({ message: z.string().min(2).max(2000) }).safeParse(body);
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);

  const [inquiry] = await db
    .select({
      id: studio_inquiries.id,
      product_title: studio_inquiries.product_title,
      product_handle: studio_inquiries.product_handle,
      inquiry_type: studio_inquiries.inquiry_type,
      customer_name: studio_inquiries.customer_name,
      email: studio_inquiries.email,
      phone: studio_inquiries.phone,
      unread_by_customer: studio_inquiries.unread_by_customer,
      created_at: studio_inquiries.created_at,
    })
    .from(studio_inquiries)
    .where(and(eq(studio_inquiries.id, id), eq(studio_inquiries.email, customer.email.toLowerCase())))
    .limit(1);

  if (!inquiry) return c.json({ error: 'Conversation not found' }, 404);

  const [message] = await db
    .insert(studio_inquiry_messages)
    .values({
      inquiry_id: id,
      sender_type: 'customer',
      sender_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email,
      sender_email: customer.email.toLowerCase(),
      message: parsed.data.message,
    })
    .returning({
      id: studio_inquiry_messages.id,
      sender_type: studio_inquiry_messages.sender_type,
      sender_name: studio_inquiry_messages.sender_name,
      sender_email: studio_inquiry_messages.sender_email,
      message: studio_inquiry_messages.message,
      created_at: studio_inquiry_messages.created_at,
    });

  await db
    .update(studio_inquiries)
    .set({
      status: 'in_progress',
      message: parsed.data.message,
      last_message_at: new Date(),
      unread_by_admin: true,
      updated_at: new Date(),
    })
    .where(eq(studio_inquiries.id, id));

  broadcastStudioMessage(id, message, {
    id,
    product_title: inquiry.product_title,
    product_handle: inquiry.product_handle,
    inquiry_type: inquiry.inquiry_type,
    status: 'in_progress',
    customer_name: inquiry.customer_name,
    email: inquiry.email,
    phone: inquiry.phone,
    message: parsed.data.message,
    last_message_at: new Date(),
    unread_by_admin: true,
    unread_by_customer: inquiry.unread_by_customer,
    created_at: inquiry.created_at,
  });

  return c.json({ success: true, message });
});

// --- ADDRESS ROUTES ---

// GET /store/customers/me/addresses
storeCustomersRouter.get('/me/addresses', verifyCustomer, async (c) => {
  const payload = c.get('customer' as any) as any;
  try {
    const list = await db
      .select()
      .from(addresses)
      .where(eq(addresses.customer_id, payload.sub))
      .orderBy(desc(addresses.created_at));
    return c.json({ addresses: list });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return c.json({ error: 'Failed to fetch addresses' }, 500);
  }
});

// POST /store/customers/me/addresses
storeCustomersRouter.post('/me/addresses', verifyCustomer, async (c) => {
  const payload = c.get('customer' as any) as any;
  let body;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const parsed = AddressSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);

  try {
    const [address] = await db
      .insert(addresses)
      .values({ ...parsed.data, customer_id: payload.sub })
      .returning();
    return c.json({ address }, 201);
  } catch (error) {
    console.error('Error creating address:', error);
    return c.json({ error: 'Failed to create address' }, 500);
  }
});

// PUT /store/customers/me/addresses/:id
storeCustomersRouter.put('/me/addresses/:id', verifyCustomer, async (c) => {
  const payload = c.get('customer' as any) as any;
  const id = c.req.param('id');
  let body;
  try { body = await c.req.json(); } catch { return c.json({ error: 'Invalid JSON' }, 400); }

  const parsed = AddressSchema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400);

  try {
    const [updated] = await db
      .update(addresses)
      .set({ ...parsed.data, updated_at: new Date() })
      .where(and(eq(addresses.id, id), eq(addresses.customer_id, payload.sub)))
      .returning();
    if (!updated) return c.json({ error: 'Address not found' }, 404);
    return c.json({ address: updated });
  } catch (error) {
    console.error('Error updating address:', error);
    return c.json({ error: 'Failed to update address' }, 500);
  }
});

// DELETE /store/customers/me/addresses/:id
storeCustomersRouter.delete('/me/addresses/:id', verifyCustomer, async (c) => {
  const payload = c.get('customer' as any) as any;
  const id = c.req.param('id');
  try {
    const deleted = await db
      .delete(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.customer_id, payload.sub)))
      .returning({ id: addresses.id });
    if (!deleted.length) return c.json({ error: 'Address not found' }, 404);
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting address:', error);
    return c.json({ error: 'Failed to delete address' }, 500);
  }
});

export default storeCustomersRouter;
