import { db } from '../db/client';
import {
  orders,
  line_items,
  customers,
  products,
  product_variants,
  addresses,
} from '../db/schema';
import {
  eq,
  desc,
  like,
  ilike,
  or,
  sql,
  and,
  gte,
  lte,
  inArray,
  asc,
} from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { generateInvoice } from '../services/pdf-service';
import { carrierService } from '../services/carrier-service';
import { settingService } from '../services/setting-service';
import {
  buildWorkflowSummary,
  deriveWorkflowStatus,
  getWorkflowMetadata,
  getWorkflowPackages,
  mergeWorkflowMetadata,
} from '../utils/order-workflow';
import type {
  LabelStatus,
  WorkflowMetadata,
  WorkflowPackage,
} from '../utils/order-workflow';
import type { CarrierProvider } from '../services/carrier-service';

// --- TYPES ---
export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export interface OrderFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  queue?: 'open' | 'completed' | 'issues' | 'all';
  workflow_filter?:
    | 'new'
    | 'processing'
    | 'due_today'
    | 'ready_to_ship'
    | 'missing_tracking'
    | 'all';
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// --- CONSTANTS ---
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled', 'refunded'],
  shipped: ['delivered', 'refunded', 'cancelled'],
  delivered: ['refunded'],
  cancelled: [],
  refunded: [],
};

// Aliases
const shippingAddr = alias(addresses, 'shipping_address');
const billingAddr = alias(addresses, 'billing_address');

function sanitizeOrderSearchInput(input: string, maxLen = 100): string {
  return String(input)
    .replace(/[%_\\]/g, '')
    .replace(/[;]/g, '')
    .trim()
    .substring(0, maxLen);
}

function sortPackages(packages: WorkflowPackage[]) {
  return [...packages].sort((left, right) => left.sequence - right.sequence);
}

function getPrimaryPackage(packages: WorkflowPackage[]) {
  if (!packages.length) return null;

  return (
    [...packages]
      .filter(
        (pkg) => !!pkg.ship_date || !!pkg.tracking_number || pkg.no_tracking === true
      )
      .sort((left, right) => right.sequence - left.sequence)[0] || packages[0]
  );
}

function deriveLegacyTrackingFields(packages: WorkflowPackage[]) {
  const primaryPackage = getPrimaryPackage(packages);

  return {
    tracking_number: primaryPackage?.tracking_number || null,
    shipping_carrier: primaryPackage?.carrier || null,
    tracking_link: primaryPackage?.tracking_url || null,
  };
}

function toTimestamp(value: string | number | Date | null | undefined) {
  if (!value) return 0;
  return new Date(value).getTime();
}

function toMetadataRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizePackageSequence(packages: WorkflowPackage[]) {
  return packages.map((pkg, index) => ({
    ...pkg,
    sequence: index + 1,
    id: pkg.id || `pkg_${index + 1}`,
  }));
}

type PackageUpsertInput = {
  package_id?: string;
  ship_date?: string | null;
  carrier?: string | null;
  service?: string | null;
  label_provider?: string | null;
  tracking_number?: string | null;
  tracking_url?: string | null;
  label_url?: string | null;
  label_file_name?: string | null;
  label_state?: LabelStatus;
  label_cost?: number | null;
  label_currency?: string | null;
  package_weight_grams?: number | null;
  package_length_cm?: number | null;
  package_width_cm?: number | null;
  package_height_cm?: number | null;
  carrier_service?: string | null;
  provider_order_id?: string | null;
  provider_shipment_id?: string | null;
  provider_courier_id?: string | null;
  pickup_reference?: string | null;
  no_tracking?: boolean;
  no_tracking_reason?: string | null;
  notify_buyer?: boolean;
  notification_sent?: boolean;
  notification_sent_at?: string | null;
  delivered_at?: string | null;
};

function upsertWorkflowPackage(
  packages: WorkflowPackage[],
  input: PackageUpsertInput
) {
  const nextPackages = sortPackages(packages);
  const now = new Date().toISOString();
  const targetIndex =
    input.package_id
      ? nextPackages.findIndex((pkg) => pkg.id === input.package_id)
      : nextPackages.length > 0
        ? 0
        : -1;

  const existing =
    targetIndex >= 0 ? nextPackages[targetIndex] : null;
  const sequence =
    existing?.sequence || nextPackages.length + 1;
  const packageId = input.package_id || existing?.id || `pkg_${sequence}`;

  const nextPackage: WorkflowPackage = {
    id: packageId,
    sequence,
    ship_date:
      Object.prototype.hasOwnProperty.call(input, 'ship_date')
        ? input.ship_date ?? null
        : existing?.ship_date ?? null,
    carrier:
      Object.prototype.hasOwnProperty.call(input, 'carrier')
        ? input.carrier ?? null
        : existing?.carrier ?? null,
    service:
      Object.prototype.hasOwnProperty.call(input, 'service')
        ? input.service ?? null
        : existing?.service ?? null,
    label_provider:
      Object.prototype.hasOwnProperty.call(input, 'label_provider')
        ? input.label_provider ?? null
        : existing?.label_provider ?? null,
    tracking_number:
      Object.prototype.hasOwnProperty.call(input, 'tracking_number')
        ? input.tracking_number ?? null
        : existing?.tracking_number ?? null,
    tracking_url:
      Object.prototype.hasOwnProperty.call(input, 'tracking_url')
        ? input.tracking_url ?? null
        : existing?.tracking_url ?? null,
    label_url:
      Object.prototype.hasOwnProperty.call(input, 'label_url')
        ? input.label_url ?? null
        : existing?.label_url ?? null,
    label_file_name:
      Object.prototype.hasOwnProperty.call(input, 'label_file_name')
        ? input.label_file_name ?? null
        : existing?.label_file_name ?? null,
    label_state:
      Object.prototype.hasOwnProperty.call(input, 'label_state')
        ? input.label_state
        : existing?.label_state || 'draft',
    label_cost:
      Object.prototype.hasOwnProperty.call(input, 'label_cost')
        ? input.label_cost ?? null
        : existing?.label_cost ?? null,
    label_currency:
      Object.prototype.hasOwnProperty.call(input, 'label_currency')
        ? input.label_currency ?? null
        : existing?.label_currency ?? null,
    package_weight_grams:
      Object.prototype.hasOwnProperty.call(input, 'package_weight_grams')
        ? input.package_weight_grams ?? null
        : existing?.package_weight_grams ?? null,
    package_length_cm:
      Object.prototype.hasOwnProperty.call(input, 'package_length_cm')
        ? input.package_length_cm ?? null
        : existing?.package_length_cm ?? null,
    package_width_cm:
      Object.prototype.hasOwnProperty.call(input, 'package_width_cm')
        ? input.package_width_cm ?? null
        : existing?.package_width_cm ?? null,
    package_height_cm:
      Object.prototype.hasOwnProperty.call(input, 'package_height_cm')
        ? input.package_height_cm ?? null
        : existing?.package_height_cm ?? null,
    carrier_service:
      Object.prototype.hasOwnProperty.call(input, 'carrier_service')
        ? input.carrier_service ?? null
        : existing?.carrier_service ?? null,
    provider_order_id:
      Object.prototype.hasOwnProperty.call(input, 'provider_order_id')
        ? input.provider_order_id ?? null
        : existing?.provider_order_id ?? null,
    provider_shipment_id:
      Object.prototype.hasOwnProperty.call(input, 'provider_shipment_id')
        ? input.provider_shipment_id ?? null
        : existing?.provider_shipment_id ?? null,
    provider_courier_id:
      Object.prototype.hasOwnProperty.call(input, 'provider_courier_id')
        ? input.provider_courier_id ?? null
        : existing?.provider_courier_id ?? null,
    pickup_reference:
      Object.prototype.hasOwnProperty.call(input, 'pickup_reference')
        ? input.pickup_reference ?? null
        : existing?.pickup_reference ?? null,
    no_tracking:
      Object.prototype.hasOwnProperty.call(input, 'no_tracking')
        ? input.no_tracking === true
        : existing?.no_tracking === true,
    no_tracking_reason:
      Object.prototype.hasOwnProperty.call(input, 'no_tracking_reason')
        ? input.no_tracking_reason ?? null
        : existing?.no_tracking_reason ?? null,
    notify_buyer:
      Object.prototype.hasOwnProperty.call(input, 'notify_buyer')
        ? input.notify_buyer
        : existing?.notify_buyer,
    notification_sent:
      Object.prototype.hasOwnProperty.call(input, 'notification_sent')
        ? input.notification_sent === true
        : existing?.notification_sent === true,
    notification_sent_at:
      Object.prototype.hasOwnProperty.call(input, 'notification_sent_at')
        ? input.notification_sent_at ?? null
        : existing?.notification_sent_at ?? null,
    delivered_at:
      Object.prototype.hasOwnProperty.call(input, 'delivered_at')
        ? input.delivered_at ?? null
        : existing?.delivered_at ?? null,
    created_at: existing?.created_at || now,
    updated_at: now,
  };

  if (targetIndex >= 0) {
    nextPackages[targetIndex] = nextPackage;
  } else {
    nextPackages.push(nextPackage);
  }

  return normalizePackageSequence(nextPackages);
}

function applyWorkflowSummary<T extends Record<string, any>>(order: T) {
  const workflow = buildWorkflowSummary(order);

  return {
    ...order,
    raw_status: order.status,
    status: workflow.status,
    workflow,
  };
}

function buildCarrierContext(
  order: Record<string, any>,
  items: Record<string, any>[],
  packageId?: string | null
) {
  const packages = order.workflow?.packages || [];
  const explicitlySelectedPackage = packageId
    ? packages.find((pkg: WorkflowPackage) => pkg.id === packageId) || null
    : null;
  const primaryPackage = order.workflow?.primary_package || packages[0] || null;
  const selectedPackage = packageId ? explicitlySelectedPackage : primaryPackage;
  const workflowLabel = order.workflow?.label || {};
  const useWorkflowLabelFallback =
    !packageId ||
    (!!selectedPackage &&
      (selectedPackage.id === primaryPackage?.id ||
        selectedPackage.sequence === primaryPackage?.sequence));

  return {
    order: {
      ...order,
      shipping_address: {
        ...order.shipping_address,
        phone:
          order.shipping_address?.phone ||
          order.customer_phone ||
          order.customer?.phone ||
          null,
      },
      workflow: {
        ...order.workflow,
        label: {
          ...workflowLabel,
          package_weight_grams:
            selectedPackage?.package_weight_grams ??
            (useWorkflowLabelFallback ? workflowLabel.package_weight_grams : null) ??
            null,
          package_length_cm:
            selectedPackage?.package_length_cm ??
            (useWorkflowLabelFallback ? workflowLabel.package_length_cm : null) ??
            null,
          package_width_cm:
            selectedPackage?.package_width_cm ??
            (useWorkflowLabelFallback ? workflowLabel.package_width_cm : null) ??
            null,
          package_height_cm:
            selectedPackage?.package_height_cm ??
            (useWorkflowLabelFallback ? workflowLabel.package_height_cm : null) ??
            null,
          carrier_service:
            selectedPackage?.carrier_service ??
            (useWorkflowLabelFallback ? workflowLabel.carrier_service : null) ??
            null,
        },
      },
    },
    items,
    package: selectedPackage as WorkflowPackage | null,
  };
}

function sendStatusNotification(data: {
  email?: string | null;
  order_number?: string | number | null;
  total?: number | null;
  currency_code?: string | null;
  status: string;
  tracking_number?: string | null;
  shipping_carrier?: string | null;
  tracking_link?: string | null;
  send_admin_copy?: boolean;
}) {
  if (!data.email) return;
  const email = data.email;

  import('./email-service')
    .then(async ({ emailService }) => {
      const sendOrderEmail = async (recipient: string) => {
        if (data.status === 'shipped' && data.tracking_number) {
          return emailService.sendShippingNotification({
            email: recipient,
            order_number: data.order_number ?? '',
            tracking_number: data.tracking_number,
            shipping_carrier: data.shipping_carrier ?? undefined,
            tracking_link: data.tracking_link ?? undefined,
          });
        }

        return emailService.sendOrderStatusUpdate(
          {
            order_number: data.order_number ?? '',
            total: data.total || 0,
            currency_code: data.currency_code || 'INR',
            status: data.status,
          },
          recipient
        );
      };

      await sendOrderEmail(email);

      if (data.send_admin_copy !== true) return;

      const storeEmailSetting = await settingService.getByKey('store_email');
      const adminCopyEmail =
        typeof storeEmailSetting?.value === 'string' && storeEmailSetting.value.includes('@')
          ? storeEmailSetting.value.trim()
          : process.env.ADMIN_EMAIL?.trim() || null;

      if (
        adminCopyEmail &&
        adminCopyEmail.toLowerCase() !== email.toLowerCase()
      ) {
        await sendOrderEmail(adminCopyEmail);
      }
    })
    .catch((err) =>
      console.error('[OrderService] Failed to load email service:', err)
    );
}

function appendCommunicationEvent(
  metadata: Record<string, unknown> | null | undefined,
  event: {
    template: string;
    subject: string;
    message: string;
    channel?: string;
    status?: string;
    sent_at?: string;
  }
) {
  const baseMetadata =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? metadata
      : {};
  const existingEvents = Array.isArray(baseMetadata.communication_events)
    ? baseMetadata.communication_events
    : [];

  return {
    ...baseMetadata,
    communication_events: [
      ...existingEvents,
      {
        template: event.template,
        subject: event.subject,
        message: event.message,
        sent_at: event.sent_at || new Date().toISOString(),
        channel: event.channel || 'email',
        status: event.status || 'queued',
      },
    ],
  };
}

// --- SERVICE CLASS ---
class OrderService {
  async listOrders(filters: OrderFilters) {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      queue = 'all',
      workflow_filter = 'all',
      date_from = '',
      date_to = '',
      sort_by = 'created_at',
      sort_order = 'desc',
    } = filters;

    const offset = (page - 1) * limit;
    const conditions = [];

    if (search) {
      const sanitizedSearch = sanitizeOrderSearchInput(search);
      if (sanitizedSearch) {
        const pattern = `%${sanitizedSearch}%`;
        conditions.push(
          or(
            sql`CAST(${orders.display_id} AS TEXT) LIKE ${pattern}`,
            ilike(orders.email, pattern),
            ilike(customers.first_name, pattern),
            ilike(customers.last_name, pattern),
            sql`coalesce(${shippingAddr.first_name}, '') ilike ${pattern}`,
            sql`coalesce(${shippingAddr.last_name}, '') ilike ${pattern}`,
            sql`coalesce(${shippingAddr.address_1}, '') ilike ${pattern}`,
            sql`coalesce(${shippingAddr.city}, '') ilike ${pattern}`,
            sql`coalesce(${shippingAddr.postal_code}, '') ilike ${pattern}`,
            sql`coalesce(${orders.metadata}->>'customer_note', '') ilike ${pattern}`,
            sql`coalesce(${orders.metadata}->>'internal_note', '') ilike ${pattern}`,
            sql`exists (
              select 1
              from ${line_items}
              where ${line_items.order_id} = ${orders.id}
                and (
                  ${line_items.title} ilike ${pattern}
                  or coalesce(${line_items.description}, '') ilike ${pattern}
                )
            )`
          )
        );
      }
    }

    if (date_from) conditions.push(gte(orders.created_at, new Date(date_from)));
    if (date_to) conditions.push(lte(orders.created_at, new Date(date_to)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Fetch
    const ordersList = await db
      .select({
        id: orders.id,
        order_number: orders.display_id,
        status: orders.status,
        payment_status: orders.payment_status,
        fulfillment_status: orders.fulfillment_status,
        email: orders.email,
        subtotal: orders.subtotal,
        tax_total: orders.tax_total,
        shipping_total: orders.shipping_total,
        total: orders.total,
        currency_code: orders.currency_code,
        customer_id: orders.customer_id,
        created_at: orders.created_at,
        updated_at: orders.updated_at,
        tracking_number: orders.tracking_number,
        shipping_carrier: orders.shipping_carrier,
        tracking_link: orders.tracking_link,
        metadata: orders.metadata,
        customer_first_name: customers.first_name,
        customer_last_name: customers.last_name,
        shipping_first_name: shippingAddr.first_name,
        shipping_last_name: shippingAddr.last_name,
        shipping_city: shippingAddr.city,
        shipping_postal_code: shippingAddr.postal_code,
        shipping_country_code: shippingAddr.country_code,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customer_id, customers.id))
      .leftJoin(shippingAddr, eq(orders.shipping_address_id, shippingAddr.id))
      .where(whereClause)
      .orderBy(sort_order === 'asc' ? asc(orders.created_at) : desc(orders.created_at));

    const normalizedOrders = ordersList.map((order) => applyWorkflowSummary(order));

    const queueFilteredOrders = normalizedOrders.filter((order) => {
      if (queue === 'all') return true;
      if (queue === 'open') {
        return order.status === 'pending' || order.status === 'processing';
      }
      if (queue === 'completed') {
        return order.status === 'shipped' || order.status === 'delivered';
      }
      if (queue === 'issues') {
        return (
          order.status === 'cancelled' ||
          order.status === 'refunded' ||
          order.workflow?.needs_attention === true ||
          order.workflow?.overdue_tracking === true
        );
      }

      return true;
    });

    const workflowFilteredOrders = queueFilteredOrders.filter((order) => {
      if (workflow_filter === 'all') return true;

      const shipByDate = order.workflow?.ship_by_date
        ? new Date(order.workflow.ship_by_date)
        : null;
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      switch (workflow_filter) {
        case 'new':
          return order.status === 'pending';
        case 'processing':
          return order.status === 'processing';
        case 'due_today':
          return (
            order.status !== 'shipped' &&
            order.status !== 'delivered' &&
            !!shipByDate &&
            !Number.isNaN(shipByDate.getTime()) &&
            shipByDate >= todayStart &&
            shipByDate <= todayEnd
          );
        case 'ready_to_ship':
          return order.status === 'processing';
        case 'missing_tracking':
          return (
            (order.status === 'processing' || order.status === 'shipped') &&
            !order.workflow?.has_tracking &&
            order.workflow?.primary_package?.no_tracking !== true
          );
        default:
          return true;
      }
    });

    const statusFilteredOrders =
      status && status !== 'all'
        ? workflowFilteredOrders.filter((order) => order.status === status)
        : workflowFilteredOrders;

    const sortedOrders = [...statusFilteredOrders].sort((left, right) => {
      if (sort_by === 'ship_by') {
        const leftTime = left.workflow?.ship_by_date
          ? new Date(left.workflow.ship_by_date).getTime()
          : Number.MAX_SAFE_INTEGER;
        const rightTime = right.workflow?.ship_by_date
          ? new Date(right.workflow.ship_by_date).getTime()
          : Number.MAX_SAFE_INTEGER;
        return sort_order === 'asc' ? leftTime - rightTime : rightTime - leftTime;
      }

      if (sort_by === 'destination') {
        const leftDestination = [
          left.shipping_country_code,
          left.shipping_city,
          left.shipping_postal_code,
        ]
          .filter(Boolean)
          .join(' ');
        const rightDestination = [
          right.shipping_country_code,
          right.shipping_city,
          right.shipping_postal_code,
        ]
          .filter(Boolean)
          .join(' ');

        return sort_order === 'asc'
          ? leftDestination.localeCompare(rightDestination)
          : rightDestination.localeCompare(leftDestination);
      }

      if (sort_by === 'oldest') {
        return (
          toTimestamp(left.created_at) - toTimestamp(right.created_at)
        );
      }

      if (sort_by === 'newest') {
        return (
          toTimestamp(right.created_at) - toTimestamp(left.created_at)
        );
      }

      if (sort_by === 'order_number') {
        return sort_order === 'asc'
          ? Number(left.order_number) - Number(right.order_number)
          : Number(right.order_number) - Number(left.order_number);
      }

      return sort_order === 'asc'
        ? toTimestamp(left.created_at) - toTimestamp(right.created_at)
        : toTimestamp(right.created_at) - toTimestamp(left.created_at);
    });

    const paginatedOrders = sortedOrders.slice(offset, offset + limit);

    return {
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total: sortedOrders.length,
        total_pages: Math.ceil(sortedOrders.length / limit),
      },
    };
  }

  async getOrder(id: string) {
    const [order] = await db
      .select({
        id: orders.id,
        order_number: orders.display_id,
        status: orders.status,
        payment_status: orders.payment_status,
        fulfillment_status: orders.fulfillment_status,
        email: orders.email,
        subtotal: orders.subtotal,
        tax_total: orders.tax_total,
        shipping_total: orders.shipping_total,
        total: orders.total,
        currency_code: orders.currency_code,
        customer_id: orders.customer_id,
        created_at: orders.created_at,
        updated_at: orders.updated_at,
        tracking_number: orders.tracking_number,
        shipping_carrier: orders.shipping_carrier,
        tracking_link: orders.tracking_link,
        metadata: orders.metadata,
        customer_first_name: customers.first_name,
        customer_last_name: customers.last_name,
        customer_email: customers.email,
        customer_phone: customers.phone,
        shipping_address: shippingAddr,
        billing_address: billingAddr,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customer_id, customers.id))
      .leftJoin(shippingAddr, eq(orders.shipping_address_id, shippingAddr.id))
      .leftJoin(billingAddr, eq(orders.billing_address_id, billingAddr.id))
      .where(eq(orders.id, id));

    if (!order) return null;

    const items = await db
      .select({
        id: line_items.id,
        quantity: line_items.quantity,
        unit_price: line_items.unit_price,
        total: line_items.total_price,
        variant_id: line_items.variant_id,
        product_title: products.title,
        product_thumbnail: products.thumbnail,
        variant_title: product_variants.title,
        title: line_items.title,
        thumbnail: line_items.thumbnail,
      })
      .from(line_items)
      .leftJoin(
        product_variants,
        eq(line_items.variant_id, product_variants.id)
      )
      .leftJoin(products, eq(product_variants.product_id, products.id))
      .where(eq(line_items.order_id, id));

    return { order: applyWorkflowSummary(order), items };
  }

  async updateStatus(id: string, newStatus: string) {
    const [existingOrder] = await db
      .select({
        email: orders.email,
        order_number: orders.display_id,
        total: orders.total,
        currency_code: orders.currency_code,
        status: orders.status,
        payment_status: orders.payment_status,
        fulfillment_status: orders.fulfillment_status,
        tracking_number: orders.tracking_number,
        metadata: orders.metadata,
      })
      .from(orders)
      .where(eq(orders.id, id));
    if (!existingOrder) throw new Error('Order not found');

    const currentStatus = deriveWorkflowStatus(existingOrder);

    // Validate transition
    if (currentStatus !== newStatus) {
      const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
      if (!allowedTransitions.includes(newStatus)) {
        throw new Error(
          `Invalid status transition from '${currentStatus}' to '${newStatus}'`
        );
      }
    }

    const nextMetadata = mergeWorkflowMetadata(existingOrder.metadata, {
      workflow_status: newStatus as OrderStatus,
    });
    const nextFulfillmentStatus =
      newStatus === 'delivered'
        ? 'fulfilled'
        : newStatus === 'shipped'
          ? 'shipped'
          : newStatus === 'processing'
            ? 'not_fulfilled'
            : existingOrder.fulfillment_status;
    const nextPaymentStatus =
      newStatus === 'refunded' ? 'refunded' : existingOrder.payment_status;

    const [updated] = await db
      .update(orders)
      .set({
        status: newStatus as any,
        fulfillment_status: nextFulfillmentStatus as any,
        payment_status: nextPaymentStatus as any,
        metadata: nextMetadata,
        updated_at: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    sendStatusNotification({
      email: existingOrder.email,
      order_number: existingOrder.order_number,
      total: existingOrder.total,
      currency_code: existingOrder.currency_code,
      status: newStatus,
      tracking_number: existingOrder.tracking_number,
    });

    return applyWorkflowSummary(updated as Record<string, any>);
  }

  async bulkUpdateStatus(orderIds: string[], newStatus: string) {
    // Fetch current statuses
    const targets = await db
      .select({
        id: orders.id,
        email: orders.email,
        order_number: orders.display_id,
        total: orders.total,
        currency_code: orders.currency_code,
        status: orders.status,
        payment_status: orders.payment_status,
        fulfillment_status: orders.fulfillment_status,
        tracking_number: orders.tracking_number,
        metadata: orders.metadata,
      })
      .from(orders)
      .where(inArray(orders.id, orderIds));

    if (targets.length === 0) throw new Error('No valid orders found');

    const invalidIds: string[] = [];
    for (const order of targets) {
      const currentStatus = deriveWorkflowStatus(order);
      if (currentStatus === newStatus) continue;

      const allowed = VALID_TRANSITIONS[currentStatus] || [];
      if (!allowed.includes(newStatus)) {
        invalidIds.push(order.id);
      }
    }

    if (invalidIds.length > 0) {
      throw new Error(
        `Cannot update ${invalidIds.length} orders. Invalid status transition.`
      );
    }

    for (const order of targets) {
      const nextMetadata = mergeWorkflowMetadata(order.metadata, {
        workflow_status: newStatus as OrderStatus,
      });
      const nextFulfillmentStatus =
        newStatus === 'delivered'
          ? 'fulfilled'
          : newStatus === 'shipped'
            ? 'shipped'
            : newStatus === 'processing'
              ? 'not_fulfilled'
              : order.fulfillment_status;
      const nextPaymentStatus =
        newStatus === 'refunded' ? 'refunded' : order.payment_status;

      await db
        .update(orders)
        .set({
          status: newStatus as any,
          fulfillment_status: nextFulfillmentStatus as any,
          payment_status: nextPaymentStatus as any,
          metadata: nextMetadata,
          updated_at: new Date(),
        })
        .where(eq(orders.id, order.id));

      sendStatusNotification({
        email: order.email,
        order_number: order.order_number,
        total: order.total,
        currency_code: order.currency_code,
        status: newStatus,
        tracking_number: order.tracking_number,
      });
    }

    return targets.length;
  }

  async addTracking(
    id: string,
    data: {
      tracking_number: string;
      shipping_carrier?: string;
      tracking_link?: string;
      ship_date?: string | null;
      customer_note?: string | null;
      internal_note?: string | null;
      notify_buyer?: boolean;
    }
  ) {
    const [existingOrder] = await db
      .select({
        id: orders.id,
        email: orders.email,
        order_number: orders.display_id,
        metadata: orders.metadata,
        tracking_number: orders.tracking_number,
        shipping_carrier: orders.shipping_carrier,
        tracking_link: orders.tracking_link,
      })
      .from(orders)
      .where(eq(orders.id, id));

    if (!existingOrder) throw new Error('Order not found');

    const shipDate = data.ship_date ? new Date(data.ship_date) : new Date();
    const shippedAt = Number.isNaN(shipDate.getTime())
      ? new Date().toISOString()
      : shipDate.toISOString();
    const nextPackages = upsertWorkflowPackage(
      getWorkflowPackages(existingOrder),
      {
        package_id: 'pkg_1',
        ship_date: shippedAt,
        carrier: data.shipping_carrier ?? null,
        tracking_number: data.tracking_number,
        tracking_url: data.tracking_link ?? null,
        no_tracking: false,
        no_tracking_reason: null,
        notify_buyer: data.notify_buyer !== false,
        notification_sent: data.notify_buyer !== false,
        notification_sent_at:
          data.notify_buyer !== false ? new Date().toISOString() : null,
      }
    );

    const nextMetadata = mergeWorkflowMetadata(existingOrder.metadata, {
      workflow_status: 'shipped',
      shipped_at: shippedAt,
      customer_note: data.customer_note,
      internal_note: data.internal_note,
      packages: nextPackages,
    });
    const trackingFields = deriveLegacyTrackingFields(nextPackages);
    const addedPackage = nextPackages[nextPackages.length - 1] || null;

    const [updated] = await db
      .update(orders)
      .set({
        tracking_number: trackingFields.tracking_number,
        shipping_carrier: trackingFields.shipping_carrier,
        tracking_link: trackingFields.tracking_link,
        status: 'shipped',
        fulfillment_status: 'shipped',
        metadata: nextMetadata,
        updated_at: new Date()
      })
      .where(eq(orders.id, id))
      .returning();

    // Send shipping notification email (fire-and-forget)
    if (existingOrder.email && data.notify_buyer !== false) {
      import('./email-service').then(({ emailService }) => {
        emailService.sendShippingNotification({
          email: existingOrder.email!,
          order_number: existingOrder.order_number ?? id.slice(0, 8),
          tracking_number: data.tracking_number,
          shipping_carrier: data.shipping_carrier,
          tracking_link: data.tracking_link,
        }).catch(err => console.error('[OrderService] Failed to send shipping notification:', err));
      }).catch(err => console.error('[OrderService] Failed to load email service:', err));
    }

    return applyWorkflowSummary(updated as Record<string, any>);
  }

  async completeOrder(
    id: string,
    data: {
      ship_date?: string | null;
      shipping_carrier?: string | null;
      shipping_service?: string | null;
      tracking_number?: string | null;
      tracking_link?: string | null;
      no_tracking?: boolean;
      no_tracking_reason?: string | null;
      customer_note?: string | null;
      internal_note?: string | null;
      notify_buyer?: boolean;
      send_admin_copy?: boolean;
    }
  ) {
    const [existingOrder] = await db
      .select({
        id: orders.id,
        email: orders.email,
        order_number: orders.display_id,
        metadata: orders.metadata,
        total: orders.total,
        currency_code: orders.currency_code,
      })
      .from(orders)
      .where(eq(orders.id, id));

    if (!existingOrder) throw new Error('Order not found');

    if (data.no_tracking !== true && !data.tracking_number?.trim()) {
      throw new Error('Tracking number is required unless no-tracking is selected');
    }

    const shipDate = data.ship_date ? new Date(data.ship_date) : new Date();
    const shippedAt = Number.isNaN(shipDate.getTime())
      ? new Date().toISOString()
      : shipDate.toISOString();
    const nextPackages = upsertWorkflowPackage(
      getWorkflowPackages(existingOrder),
      {
        package_id: 'pkg_1',
        ship_date: shippedAt,
        carrier: data.shipping_carrier ?? null,
        service: data.shipping_service ?? null,
        tracking_number:
          data.no_tracking === true ? null : data.tracking_number?.trim() || null,
        tracking_url:
          data.no_tracking === true ? null : data.tracking_link ?? null,
        no_tracking: data.no_tracking === true,
        no_tracking_reason:
          data.no_tracking === true ? data.no_tracking_reason ?? null : null,
        notify_buyer: data.notify_buyer !== false,
        notification_sent: data.notify_buyer !== false,
        notification_sent_at:
          data.notify_buyer !== false ? new Date().toISOString() : null,
      }
    );
    const autoNotificationSubject = `Your Odhvica order #${
      existingOrder.order_number ?? id.slice(0, 8)
    } has shipped`;
    const autoNotificationMessage =
      data.no_tracking === true
        ? 'Your order is on its way. This shipment does not include a tracking number.'
        : 'Tracking details have been added to your order and your shipment is on its way.';
    const nextMetadata = mergeWorkflowMetadata(
      data.notify_buyer !== false
        ? appendCommunicationEvent(toMetadataRecord(existingOrder.metadata), {
            template: 'shipped',
            subject: autoNotificationSubject,
            message: autoNotificationMessage,
            status: 'queued',
          })
        : existingOrder.metadata,
      {
      workflow_status: 'shipped',
      shipped_at: shippedAt,
      customer_note: data.customer_note,
      internal_note: data.internal_note,
      packages: nextPackages,
      }
    );
    const trackingFields = deriveLegacyTrackingFields(nextPackages);
    const addedPackage = nextPackages[nextPackages.length - 1] || null;

    const [updated] = await db
      .update(orders)
      .set({
        tracking_number: trackingFields.tracking_number,
        shipping_carrier: trackingFields.shipping_carrier,
        tracking_link: trackingFields.tracking_link,
        status: 'shipped',
        fulfillment_status: 'shipped',
        metadata: nextMetadata,
        updated_at: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    if (existingOrder.email && data.notify_buyer !== false) {
      sendStatusNotification({
        email: existingOrder.email,
        order_number: existingOrder.order_number ?? id.slice(0, 8),
        total: existingOrder.total,
        currency_code: existingOrder.currency_code,
        status: 'shipped',
        tracking_number: trackingFields.tracking_number,
        shipping_carrier: trackingFields.shipping_carrier,
        tracking_link: trackingFields.tracking_link,
        send_admin_copy: (data as { send_admin_copy?: boolean }).send_admin_copy === true,
      });
    }

    return applyWorkflowSummary(updated as Record<string, any>);
  }

  async addPackage(
    id: string,
    data: {
      ship_date?: string | null;
      shipping_carrier?: string | null;
      shipping_service?: string | null;
      tracking_number?: string | null;
      tracking_link?: string | null;
      no_tracking?: boolean;
      no_tracking_reason?: string | null;
      notify_buyer?: boolean;
    }
  ) {
    const [existingOrder] = await db
      .select({
        id: orders.id,
        email: orders.email,
        order_number: orders.display_id,
        metadata: orders.metadata,
        tracking_number: orders.tracking_number,
        shipping_carrier: orders.shipping_carrier,
        tracking_link: orders.tracking_link,
        total: orders.total,
        currency_code: orders.currency_code,
      })
      .from(orders)
      .where(eq(orders.id, id));

    if (!existingOrder) throw new Error('Order not found');

    const shipDate = data.ship_date ? new Date(data.ship_date) : new Date();
    const shippedAt = Number.isNaN(shipDate.getTime())
      ? new Date().toISOString()
      : shipDate.toISOString();
    const nextPackages = upsertWorkflowPackage(
      getWorkflowPackages(existingOrder),
      {
        ship_date: shippedAt,
        carrier: data.shipping_carrier ?? null,
        service: data.shipping_service ?? null,
        tracking_number:
          data.no_tracking === true ? null : data.tracking_number?.trim() || null,
        tracking_url:
          data.no_tracking === true ? null : data.tracking_link ?? null,
        no_tracking: data.no_tracking === true,
        no_tracking_reason:
          data.no_tracking === true ? data.no_tracking_reason ?? null : null,
        notify_buyer: data.notify_buyer !== false,
        notification_sent: data.notify_buyer !== false,
        notification_sent_at:
          data.notify_buyer !== false ? new Date().toISOString() : null,
      }
    );
    const addPackageSubject = `Package update for your Odhvica order #${
      existingOrder.order_number ?? id.slice(0, 8)
    }`;
    const addPackageMessage =
      data.no_tracking === true
        ? 'A new package has been added to your shipment without a tracking number.'
        : 'A new package has been added to your order with updated shipping details.';
    const nextMetadata = mergeWorkflowMetadata(
      data.notify_buyer !== false
        ? appendCommunicationEvent(toMetadataRecord(existingOrder.metadata), {
            template: 'shipped',
            subject: addPackageSubject,
            message: addPackageMessage,
            status: 'queued',
          })
        : existingOrder.metadata,
      {
      workflow_status: 'shipped',
      shipped_at: getWorkflowMetadata(existingOrder.metadata).shipped_at || shippedAt,
      packages: nextPackages,
      }
    );
    const trackingFields = deriveLegacyTrackingFields(nextPackages);
    const addedPackage = nextPackages[nextPackages.length - 1] || null;

    const [updated] = await db
      .update(orders)
      .set({
        tracking_number: trackingFields.tracking_number,
        shipping_carrier: trackingFields.shipping_carrier,
        tracking_link: trackingFields.tracking_link,
        status: 'shipped',
        fulfillment_status: 'shipped',
        metadata: nextMetadata,
        updated_at: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    if (existingOrder.email && data.notify_buyer !== false) {
      sendStatusNotification({
        email: existingOrder.email,
        order_number: existingOrder.order_number ?? id.slice(0, 8),
        total: existingOrder.total,
        currency_code: existingOrder.currency_code,
        status: 'shipped',
        tracking_number: addedPackage?.tracking_number || trackingFields.tracking_number,
        shipping_carrier: addedPackage?.carrier || trackingFields.shipping_carrier,
        tracking_link: addedPackage?.tracking_url || trackingFields.tracking_link,
      });
    }

    return applyWorkflowSummary(updated as Record<string, any>);
  }

  async updatePackage(
    id: string,
    packageId: string,
    data: {
      ship_date?: string | null;
      shipping_carrier?: string | null;
      shipping_service?: string | null;
      tracking_number?: string | null;
      tracking_link?: string | null;
      no_tracking?: boolean;
      no_tracking_reason?: string | null;
      notify_buyer?: boolean;
      label_url?: string | null;
      label_file_name?: string | null;
      label_state?: LabelStatus;
      label_cost?: number | null;
      label_currency?: string | null;
      package_weight_grams?: number | null;
      package_length_cm?: number | null;
      package_width_cm?: number | null;
      package_height_cm?: number | null;
      carrier_service?: string | null;
      label_provider?: string | null;
      provider_order_id?: string | null;
      provider_shipment_id?: string | null;
      provider_courier_id?: string | null;
      pickup_reference?: string | null;
      delivered_at?: string | null;
    }
  ) {
    const [existingOrder] = await db
      .select({
        id: orders.id,
        email: orders.email,
        order_number: orders.display_id,
        metadata: orders.metadata,
        status: orders.status,
        payment_status: orders.payment_status,
        fulfillment_status: orders.fulfillment_status,
        tracking_number: orders.tracking_number,
        total: orders.total,
        currency_code: orders.currency_code,
      })
      .from(orders)
      .where(eq(orders.id, id));

    if (!existingOrder) throw new Error('Order not found');

    const existingPackages = getWorkflowPackages(existingOrder);
    if (!existingPackages.some((pkg) => pkg.id === packageId)) {
      throw new Error('Package not found');
    }

    const nextPackages = upsertWorkflowPackage(existingPackages, {
      package_id: packageId,
      ship_date: data.ship_date,
      carrier: data.shipping_carrier,
      service: data.shipping_service,
      tracking_number: data.tracking_number,
      tracking_url: data.tracking_link,
      no_tracking: data.no_tracking,
      no_tracking_reason: data.no_tracking_reason,
      notify_buyer: data.notify_buyer,
      notification_sent:
        Object.prototype.hasOwnProperty.call(data, 'notify_buyer')
          ? data.notify_buyer === true
          : undefined,
      notification_sent_at:
        Object.prototype.hasOwnProperty.call(data, 'notify_buyer')
          ? data.notify_buyer === true
            ? new Date().toISOString()
            : null
          : undefined,
      label_url: data.label_url,
      label_file_name: data.label_file_name,
      label_state: data.label_state,
      label_cost: data.label_cost,
      label_currency: data.label_currency,
      package_weight_grams: data.package_weight_grams,
      package_length_cm: data.package_length_cm,
      package_width_cm: data.package_width_cm,
      package_height_cm: data.package_height_cm,
      carrier_service: data.carrier_service,
      label_provider: data.label_provider,
      provider_order_id: data.provider_order_id,
      provider_shipment_id: data.provider_shipment_id,
      provider_courier_id: data.provider_courier_id,
      pickup_reference: data.pickup_reference,
      delivered_at: data.delivered_at,
    });
    const primaryPackage = getPrimaryPackage(nextPackages);
    const updatedPackage =
      nextPackages.find((pkg) => pkg.id === packageId) || primaryPackage;
    const updateStatus = data.delivered_at
      ? 'delivered'
      : updatedPackage?.ship_date
        ? 'shipped'
        : existingOrder.status;
    const updateSubject =
      updateStatus === 'delivered'
        ? `Your Odhvica order #${existingOrder.order_number ?? id.slice(0, 8)} was marked delivered`
        : `Shipping details updated for your Odhvica order #${existingOrder.order_number ?? id.slice(0, 8)}`;
    const updateMessage =
      updateStatus === 'delivered'
        ? 'Your order has been marked as delivered.'
        : data.no_tracking === true
          ? 'Shipping details were updated for your order. This package does not include tracking.'
          : 'Shipping details were updated for your order, including the latest tracking information.';
    const nextMetadata = mergeWorkflowMetadata(
      Object.prototype.hasOwnProperty.call(data, 'notify_buyer') &&
        data.notify_buyer !== false
        ? appendCommunicationEvent(toMetadataRecord(existingOrder.metadata), {
            template: updateStatus === 'delivered' ? 'order_update' : 'shipped',
            subject: updateSubject,
            message: updateMessage,
            status: 'queued',
          })
        : existingOrder.metadata,
      {
      workflow_status: data.delivered_at ? 'delivered' : undefined,
      shipped_at:
        getWorkflowMetadata(existingOrder.metadata).shipped_at ||
        primaryPackage?.ship_date ||
        null,
      delivered_at: data.delivered_at,
      packages: nextPackages,
      }
    );
    const trackingFields = deriveLegacyTrackingFields(nextPackages);

    const [updated] = await db
      .update(orders)
      .set({
        tracking_number: trackingFields.tracking_number,
        shipping_carrier: trackingFields.shipping_carrier,
        tracking_link: trackingFields.tracking_link,
        status:
          data.delivered_at
            ? 'delivered'
            : primaryPackage?.ship_date
              ? 'shipped'
              : existingOrder.status,
        fulfillment_status:
          data.delivered_at
            ? 'fulfilled'
            : primaryPackage?.ship_date
              ? 'shipped'
              : existingOrder.fulfillment_status,
        metadata: nextMetadata,
        updated_at: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    if (
      existingOrder.email &&
      Object.prototype.hasOwnProperty.call(data, 'notify_buyer') &&
      data.notify_buyer !== false
    ) {
      sendStatusNotification({
        email: existingOrder.email,
        order_number: existingOrder.order_number ?? id.slice(0, 8),
        total: existingOrder.total,
        currency_code: existingOrder.currency_code,
        status: data.delivered_at ? 'delivered' : 'shipped',
        tracking_number: updatedPackage?.tracking_number || trackingFields.tracking_number,
        shipping_carrier: updatedPackage?.carrier || trackingFields.shipping_carrier,
        tracking_link: updatedPackage?.tracking_url || trackingFields.tracking_link,
      });
    }

    return applyWorkflowSummary(updated as Record<string, any>);
  }

  async updateWorkflow(
    id: string,
    data: {
      ship_by_date?: string | null;
      estimated_delivery_start?: string | null;
      estimated_delivery_end?: string | null;
      customer_note?: string | null;
      internal_note?: string | null;
    }
  ) {
    const [existingOrder] = await db
      .select({
        id: orders.id,
        metadata: orders.metadata,
        status: orders.status,
        payment_status: orders.payment_status,
        fulfillment_status: orders.fulfillment_status,
        tracking_number: orders.tracking_number,
      })
      .from(orders)
      .where(eq(orders.id, id));

    if (!existingOrder) throw new Error('Order not found');

    const nextMetadata = mergeWorkflowMetadata(existingOrder.metadata, data);

    const [updated] = await db
      .update(orders)
      .set({
        metadata: nextMetadata,
        updated_at: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    return applyWorkflowSummary(updated as Record<string, any>);
  }

  async updateLabel(
    id: string,
    data: {
      label_status?: LabelStatus;
      label_url?: string | null;
      label_file_name?: string | null;
      label_cost?: number | null;
      label_currency?: string | null;
      package_weight_grams?: number | null;
      package_length_cm?: number | null;
      package_width_cm?: number | null;
      package_height_cm?: number | null;
      carrier_service?: string | null;
    }
  ) {
    const [existingOrder] = await db
      .select({
        id: orders.id,
        metadata: orders.metadata,
        status: orders.status,
        payment_status: orders.payment_status,
        fulfillment_status: orders.fulfillment_status,
        tracking_number: orders.tracking_number,
      })
      .from(orders)
      .where(eq(orders.id, id));

    if (!existingOrder) throw new Error('Order not found');

    const existingMetadata = getWorkflowMetadata(existingOrder.metadata);
    const existingPackages = getWorkflowPackages(existingOrder);
    const primaryPackage = getPrimaryPackage(existingPackages);
    const updates: Partial<WorkflowMetadata> = {};
    const copyNullable = <K extends keyof WorkflowMetadata>(
      sourceKey: keyof typeof data,
      metadataKey: K
    ) => {
      if (Object.prototype.hasOwnProperty.call(data, sourceKey)) {
        updates[metadataKey] = (data[sourceKey] ?? null) as WorkflowMetadata[K];
      }
    };

    copyNullable('label_url', 'label_url');
    copyNullable('label_file_name', 'label_file_name');
    copyNullable('label_cost', 'label_cost');
    copyNullable('package_weight_grams', 'package_weight_grams');
    copyNullable('package_length_cm', 'package_length_cm');
    copyNullable('package_width_cm', 'package_width_cm');
    copyNullable('package_height_cm', 'package_height_cm');
    copyNullable('carrier_service', 'carrier_service');

    if (Object.prototype.hasOwnProperty.call(data, 'label_currency')) {
      updates.label_currency = data.label_currency
        ? data.label_currency.toUpperCase()
        : null;
    }

    const nextStatus =
      data.label_status ||
      existingMetadata.label_status ||
      (data.label_url ? 'created' : 'draft');
    updates.label_status = nextStatus;

    const now = new Date().toISOString();
    const hasCreatedLabel =
      nextStatus === 'created' || nextStatus === 'printed';
    updates.label_created_at = hasCreatedLabel
      ? existingMetadata.label_created_at || now
      : existingMetadata.label_created_at || null;
    updates.label_printed_at =
      nextStatus === 'printed'
        ? existingMetadata.label_printed_at || now
        : existingMetadata.label_printed_at || null;

    updates.packages = upsertWorkflowPackage(existingPackages, {
      package_id: primaryPackage?.id || 'pkg_1',
      label_url:
        Object.prototype.hasOwnProperty.call(data, 'label_url')
          ? data.label_url ?? null
          : undefined,
      label_file_name:
        Object.prototype.hasOwnProperty.call(data, 'label_file_name')
          ? data.label_file_name ?? null
          : undefined,
      label_state: nextStatus,
      label_cost:
        Object.prototype.hasOwnProperty.call(data, 'label_cost')
          ? data.label_cost ?? null
          : undefined,
      label_currency:
        Object.prototype.hasOwnProperty.call(data, 'label_currency')
          ? (data.label_currency ? data.label_currency.toUpperCase() : null)
          : undefined,
      package_weight_grams:
        Object.prototype.hasOwnProperty.call(data, 'package_weight_grams')
          ? data.package_weight_grams ?? null
          : undefined,
      package_length_cm:
        Object.prototype.hasOwnProperty.call(data, 'package_length_cm')
          ? data.package_length_cm ?? null
          : undefined,
      package_width_cm:
        Object.prototype.hasOwnProperty.call(data, 'package_width_cm')
          ? data.package_width_cm ?? null
          : undefined,
      package_height_cm:
        Object.prototype.hasOwnProperty.call(data, 'package_height_cm')
          ? data.package_height_cm ?? null
          : undefined,
      carrier_service:
        Object.prototype.hasOwnProperty.call(data, 'carrier_service')
          ? data.carrier_service ?? null
          : undefined,
    });

    const nextMetadata = mergeWorkflowMetadata(
      existingOrder.metadata,
      updates
    );

    const [updated] = await db
      .update(orders)
      .set({
        metadata: nextMetadata,
        updated_at: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    return applyWorkflowSummary(updated as Record<string, any>);
  }

  async getCarrierReadiness(
    id: string,
    options: { provider?: CarrierProvider | null; package_id?: string | null } = {}
  ) {
    const data = await this.getOrder(id);
    if (!data) return null;

    const context = buildCarrierContext(data.order, data.items || [], options.package_id);
    return carrierService.getReadiness(context.order, {
      provider: options.provider,
    });
  }

  async getCarrierRates(
    id: string,
    options: { provider?: CarrierProvider | null; package_id?: string | null } = {}
  ) {
    const data = await this.getOrder(id);
    if (!data) return null;

    const context = buildCarrierContext(data.order, data.items || [], options.package_id);
    return carrierService.getRates(context.order, {
      provider: options.provider,
    });
  }

  async purchaseCarrierLabel(
    id: string,
    options: {
      provider?: CarrierProvider | null;
      package_id?: string | null;
      courier_id: string | number;
    }
  ) {
    const data = await this.getOrder(id);
    if (!data) return null;

    const context = buildCarrierContext(data.order, data.items || [], options.package_id);
    const targetPackageId = options.package_id || context.package?.id || 'pkg_1';
    const purchase = await carrierService.purchaseLabel(
      {
        order: context.order,
        items: context.items || [],
      },
      {
        provider: options.provider,
        package_id: targetPackageId,
        courier_id: options.courier_id,
      }
    );

    const updatedOrder = await this.updatePackage(id, targetPackageId, {
      label_provider: purchase.provider,
      shipping_carrier: purchase.shipping_carrier,
      tracking_number: purchase.tracking_number,
      tracking_link: purchase.tracking_url,
      label_state: purchase.label_status,
      label_url: purchase.label_url,
      label_file_name: purchase.label_file_name,
      label_cost: purchase.label_cost,
      label_currency: purchase.label_currency,
      package_weight_grams:
        context.order.workflow?.label?.package_weight_grams ?? null,
      package_length_cm: context.order.workflow?.label?.package_length_cm ?? null,
      package_width_cm: context.order.workflow?.label?.package_width_cm ?? null,
      package_height_cm: context.order.workflow?.label?.package_height_cm ?? null,
      carrier_service: purchase.carrier_service,
      provider_order_id:
        purchase.shiprocket_order_id != null
          ? String(purchase.shiprocket_order_id)
          : null,
      provider_shipment_id:
        purchase.shiprocket_shipment_id != null
          ? String(purchase.shiprocket_shipment_id)
          : null,
      provider_courier_id:
        purchase.shiprocket_courier_id != null
          ? String(purchase.shiprocket_courier_id)
          : null,
      pickup_reference:
        purchase.shiprocket_pickup_id != null
          ? String(purchase.shiprocket_pickup_id)
          : null,
      notify_buyer: false,
    });

    return {
      order: updatedOrder,
      purchase,
    };
  }

  async sendBuyerUpdate(
    id: string,
    data: {
      template: string;
      subject: string;
      message: string;
      include_tracking?: boolean;
    }
  ) {
    const [existingOrder] = await db
      .select({
        id: orders.id,
        email: orders.email,
        order_number: orders.display_id,
        metadata: orders.metadata,
      })
      .from(orders)
      .where(eq(orders.id, id));

    if (!existingOrder) throw new Error('Order not found');
    if (!existingOrder.email) throw new Error('Order email is missing');

    const primaryPackage = getPrimaryPackage(getWorkflowPackages(existingOrder));
    const sentAt = new Date().toISOString();

    const { emailService } = await import('./email-service');
    const sent = await emailService.sendBuyerOrderUpdate({
      email: existingOrder.email,
      order_number: existingOrder.order_number ?? id.slice(0, 8),
      subject: data.subject,
      message: data.message,
      tracking_number:
        data.include_tracking === false
          ? null
          : primaryPackage?.tracking_number || null,
      shipping_carrier:
        data.include_tracking === false ? null : primaryPackage?.carrier || null,
      tracking_link:
        data.include_tracking === false
          ? null
          : primaryPackage?.tracking_url || null,
    });

    const baseMetadata =
      existingOrder.metadata &&
      typeof existingOrder.metadata === 'object' &&
      !Array.isArray(existingOrder.metadata)
        ? (existingOrder.metadata as Record<string, unknown>)
        : {};
    const existingEvents = Array.isArray(baseMetadata.communication_events)
      ? baseMetadata.communication_events
      : [];
    const nextMetadata = {
      ...baseMetadata,
      communication_events: [
        ...existingEvents,
        {
          template: data.template,
          subject: data.subject,
          message: data.message,
          sent_at: sentAt,
          channel: 'email',
          status: sent === false ? 'failed' : 'sent',
        },
      ],
    };

    const [updated] = await db
      .update(orders)
      .set({
        metadata: nextMetadata,
        updated_at: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    return applyWorkflowSummary(updated as Record<string, any>);
  }

  async updatePackagingChecklist(
    id: string,
    data: {
      product_quality_checked?: boolean;
      size_color_verified?: boolean;
      care_card_included?: boolean;
      thank_you_note_included?: boolean;
      gift_wrap_applied?: boolean;
      invoice_included?: boolean;
      checked_by?: string | null;
    }
  ) {
    const [existingOrder] = await db
      .select({
        id: orders.id,
        metadata: orders.metadata,
      })
      .from(orders)
      .where(eq(orders.id, id));

    if (!existingOrder) throw new Error('Order not found');

    const metadata = getWorkflowMetadata(existingOrder.metadata);
    const checklist = {
      product_quality_checked: data.product_quality_checked === true,
      size_color_verified: data.size_color_verified === true,
      care_card_included: data.care_card_included === true,
      thank_you_note_included: data.thank_you_note_included === true,
      gift_wrap_applied: data.gift_wrap_applied === true,
      invoice_included: data.invoice_included === true,
      checked_at: new Date().toISOString(),
      checked_by: data.checked_by || metadata.packaging_checklist?.checked_by || null,
    };
    const nextMetadata = mergeWorkflowMetadata(existingOrder.metadata, {
      packaging_checklist: checklist,
    });

    const [updated] = await db
      .update(orders)
      .set({
        metadata: nextMetadata,
        updated_at: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    return applyWorkflowSummary(updated as Record<string, any>);
  }

  async deleteOrder(id: string) {
    // Delete line items
    try {
      await db.delete(line_items).where(eq(line_items.order_id, id));
    } catch (error: unknown) {
      console.warn(
        `[OrderService] Failed to delete line items for ${id}, assuming explicitly deleted.`,
        error
      );
    }
    // Delete order
    await db.delete(orders).where(eq(orders.id, id));
  }

  async getStatsOverview() {
    const orderRows = await db
      .select({
        id: orders.id,
        status: orders.status,
        payment_status: orders.payment_status,
        fulfillment_status: orders.fulfillment_status,
        tracking_number: orders.tracking_number,
        metadata: orders.metadata,
        total: orders.total,
      })
      .from(orders);

    const countByStatus: Record<string, number> = {};
    let totalRevenueNum = 0;

    for (const row of orderRows) {
      const workflowStatus = deriveWorkflowStatus(row);
      countByStatus[workflowStatus] = (countByStatus[workflowStatus] || 0) + 1;

      if (workflowStatus === 'completed' || workflowStatus === 'delivered') {
        totalRevenueNum += Number(row.total || 0);
      }
    }

    const totalOrdersNum = orderRows.length;

    return {
      total_orders: totalOrdersNum,
      total_revenue: totalRevenueNum,
      pending_orders: countByStatus['pending'] || 0,
      processing_orders: countByStatus['processing'] || 0,
      shipped_orders: countByStatus['shipped'] || 0,
      delivered_orders: countByStatus['delivered'] || 0,
      cancelled_orders: countByStatus['cancelled'] || 0,
      refunded_orders: countByStatus['refunded'] || 0,
      avg_order_value: totalOrdersNum > 0 ? Math.round(totalRevenueNum / totalOrdersNum) : 0,
    };
  }

  async getFulfillmentMetrics() {
    const orderRows = await db
      .select({
        id: orders.id,
        status: orders.status,
        payment_status: orders.payment_status,
        fulfillment_status: orders.fulfillment_status,
        tracking_number: orders.tracking_number,
        customer_id: orders.customer_id,
        email: orders.email,
        metadata: orders.metadata,
        created_at: orders.created_at,
        updated_at: orders.updated_at,
      })
      .from(orders);

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    let dueToday = 0;
    let overdue = 0;
    let missingTracking = 0;
    let deliveredAwaitingFollowup = 0;
    let delayedOrders = 0;
    let packagingIncomplete = 0;
    let shippedOrDelivered = 0;
    let shippedOrDeliveredWithTracking = 0;
    let issueOrRefundOrders = 0;
    let dueSoon = 0;
    let shippedMissingTracking = 0;
    let onTimeShipped = 0;
    let shippedWithShipBy = 0;
    let processingTimeTotalMs = 0;
    let processingTimeCount = 0;
    let deliveredFollowupCount = 0;
    let repeatAfterFollowupCount = 0;
    const alerts: Array<{
      key: string;
      label: string;
      count: number;
      severity: 'info' | 'warning' | 'danger';
    }> = [];

    for (const row of orderRows) {
      const workflowStatus = deriveWorkflowStatus(row);
      const metadata = getWorkflowMetadata(row.metadata);
      const shipBy = metadata.ship_by_date
        ? new Date(metadata.ship_by_date)
        : null;
      const hasValidShipBy = !!shipBy && !Number.isNaN(shipBy.getTime());
      const isActive =
        workflowStatus === 'pending' || workflowStatus === 'processing';

      if (
        hasValidShipBy &&
        shipBy >= todayStart &&
        shipBy <= todayEnd &&
        isActive
      ) {
        dueToday += 1;
      }

      if (hasValidShipBy && shipBy < todayStart && isActive) {
        overdue += 1;
      }

      if (
        hasValidShipBy &&
        shipBy > now &&
        shipBy.getTime() - now.getTime() <= 24 * 60 * 60 * 1000 &&
        isActive
      ) {
        dueSoon += 1;
      }

      const workflowSummary = buildWorkflowSummary(row);
      const hasTracking = workflowSummary.has_tracking;
      const trackingExempt =
        workflowSummary.primary_package?.no_tracking === true ||
        workflowSummary.packages?.some((pkg) => pkg.no_tracking === true) === true;

      if (
        (workflowStatus === 'processing' || workflowStatus === 'shipped') &&
        !hasTracking &&
        !trackingExempt
      ) {
        missingTracking += 1;
      }

      if (workflowStatus === 'shipped' && !hasTracking && !trackingExempt) {
        shippedMissingTracking += 1;
      }

      const communications = metadata.communication_events || [];
      const hasDeliveryFollowup = communications.some(
        (event) => event.template === 'delivered_followup'
      );
      if (workflowStatus === 'delivered' && !hasDeliveryFollowup) {
        deliveredAwaitingFollowup += 1;
      }

      const followupEvents = communications.filter(
        (event) => event.template === 'delivered_followup' && event.sent_at
      );
      if (followupEvents.length > 0) {
        deliveredFollowupCount += 1;
        const firstFollowupAt = followupEvents
          .map((event) => new Date(event.sent_at as string))
          .filter((date) => !Number.isNaN(date.getTime()))
          .sort((a, b) => a.getTime() - b.getTime())[0];
        if (firstFollowupAt) {
          const rowCustomerKey = row.customer_id || row.email;
          const hasLaterOrder = orderRows.some((candidate) => {
            const candidateCustomerKey = candidate.customer_id || candidate.email;
            if (!rowCustomerKey || candidateCustomerKey !== rowCustomerKey) return false;
            if (candidate.id === row.id || !candidate.created_at) return false;
            const candidateCreatedAt = new Date(candidate.created_at);
            return (
              !Number.isNaN(candidateCreatedAt.getTime()) &&
              candidateCreatedAt > firstFollowupAt
            );
          });
          if (hasLaterOrder) repeatAfterFollowupCount += 1;
        }
      }

      const shippedAt = metadata.shipped_at ? new Date(metadata.shipped_at) : null;
      const deliveredAt = metadata.delivered_at
        ? new Date(metadata.delivered_at)
        : null;
      if (
        workflowStatus === 'shipped' &&
        shippedAt &&
        !Number.isNaN(shippedAt.getTime()) &&
        now.getTime() - shippedAt.getTime() > 7 * 24 * 60 * 60 * 1000
      ) {
        delayedOrders += 1;
      }

      const checklist = metadata.packaging_checklist || {};
      const checklistValues = [
        checklist.product_quality_checked,
        checklist.size_color_verified,
        checklist.care_card_included,
        checklist.thank_you_note_included,
        checklist.invoice_included,
      ];
      if (
        workflowStatus === 'processing' &&
        checklistValues.some((value) => value !== true)
      ) {
        packagingIncomplete += 1;
      }

      if (workflowStatus === 'cancelled' || workflowStatus === 'refunded') {
        issueOrRefundOrders += 1;
      }

      if (workflowStatus === 'shipped' || workflowStatus === 'delivered') {
        shippedOrDelivered += 1;
        if (hasTracking || trackingExempt) {
          shippedOrDeliveredWithTracking += 1;
        }
      }

      if (hasValidShipBy && shippedAt && !Number.isNaN(shippedAt.getTime())) {
        shippedWithShipBy += 1;
        if (shippedAt <= shipBy) {
          onTimeShipped += 1;
        }
      }

      if (
        row.created_at &&
        shippedAt &&
        !Number.isNaN(shippedAt.getTime())
      ) {
        const createdAt = new Date(row.created_at);
        if (!Number.isNaN(createdAt.getTime()) && shippedAt >= createdAt) {
          processingTimeTotalMs += shippedAt.getTime() - createdAt.getTime();
          processingTimeCount += 1;
        }
      } else if (
        row.created_at &&
        deliveredAt &&
        !Number.isNaN(deliveredAt.getTime())
      ) {
        const createdAt = new Date(row.created_at);
        if (!Number.isNaN(createdAt.getTime()) && deliveredAt >= createdAt) {
          processingTimeTotalMs += deliveredAt.getTime() - createdAt.getTime();
          processingTimeCount += 1;
        }
      }
    }

    const pushAlert = (
      key: string,
      label: string,
      count: number,
      severity: 'info' | 'warning' | 'danger'
    ) => {
      if (count > 0) alerts.push({ key, label, count, severity });
    };

    pushAlert('overdue', 'Orders past ship-by date', overdue, 'danger');
    pushAlert('due_soon', 'Orders due to ship in the next 24 hours', dueSoon, 'warning');
    pushAlert('missing_tracking', 'Active orders missing tracking', missingTracking, 'warning');
    pushAlert(
      'shipped_missing_tracking',
      'Shipped orders missing tracking',
      shippedMissingTracking,
      'danger'
    );
    pushAlert(
      'delivered_followup',
      'Delivered orders awaiting follow-up',
      deliveredAwaitingFollowup,
      'info'
    );
    pushAlert('packaging_incomplete', 'Processing orders with incomplete packaging checks', packagingIncomplete, 'warning');

    return {
      due_today: dueToday,
      overdue,
      missing_tracking: missingTracking,
      delivered_awaiting_followup: deliveredAwaitingFollowup,
      delayed_orders: delayedOrders,
      packaging_incomplete: packagingIncomplete,
      issue_refund_rate_percent:
        orderRows.length > 0
          ? Math.round((issueOrRefundOrders / orderRows.length) * 100)
          : 0,
      repeat_after_followup_percent:
        deliveredFollowupCount > 0
          ? Math.round((repeatAfterFollowupCount / deliveredFollowupCount) * 100)
          : 0,
      tracking_coverage_percent:
        shippedOrDelivered > 0
          ? Math.round((shippedOrDeliveredWithTracking / shippedOrDelivered) * 100)
          : 0,
      on_time_shipping_percent:
        shippedWithShipBy > 0
          ? Math.round((onTimeShipped / shippedWithShipBy) * 100)
          : 0,
      average_processing_hours:
        processingTimeCount > 0
          ? Math.round(processingTimeTotalMs / processingTimeCount / 36_000) / 100
          : 0,
      alerts,
    };
  }

  // Helper for Invoice
  async getInvoiceData(id: string) {
    // Same logic as getOrder but structured for PDF
    const [order] = await db
      .select({
        id: orders.id,
        order_number: orders.display_id,
        email: orders.email,
        total: orders.total,
        subtotal: orders.subtotal,
        tax_total: orders.tax_total,
        shipping_total: orders.shipping_total,
        created_at: orders.created_at,
        customer_first_name: customers.first_name,
        customer_last_name: customers.last_name,
        billing_address: billingAddr,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customer_id, customers.id))
      .leftJoin(billingAddr, eq(orders.billing_address_id, billingAddr.id))
      .where(eq(orders.id, id));

    if (!order) return null;

    const items = await db
      .select({
        quantity: line_items.quantity,
        unit_price: line_items.unit_price,
        total: line_items.total_price,
        product_title: products.title,
        variant_title: product_variants.title,
      })
      .from(line_items)
      .leftJoin(
        product_variants,
        eq(line_items.variant_id, product_variants.id)
      )
      .leftJoin(products, eq(product_variants.product_id, products.id))
      .where(eq(line_items.order_id, id));

    return { order, items };
  }

  // Revenue + Order count chart data (for admin dashboard)
  async getChartData(days: number) {
    const result = await db.execute(
      sql`
        SELECT
          TO_CHAR(created_at, 'YYYY-MM-DD') AS date,
          COUNT(*)::int AS order_count,
          COALESCE(SUM(total), 0)::int AS revenue
        FROM orders
        WHERE created_at >= NOW() - (${days} || ' days')::interval
          AND status IN ('completed', 'delivered')
        GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD')
        ORDER BY date ASC
      `
    );
    return Array.from(result);
  }

  // Export orders data for CSV
  async getExportData(filters: { search?: string; status?: string }) {
    const conditions = [];
    if (filters.search) {
      const s = filters.search.replace(/[%_]/g, '\\$&');
      conditions.push(
        sql`(CAST(${orders.display_id} AS TEXT) LIKE ${`%${s}%`} OR ${orders.email} LIKE ${`%${s}%`})`
      );
    }
    if (filters.status && filters.status !== 'all') {
      conditions.push(eq(orders.status, filters.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return db
      .select({
        order_number: orders.display_id,
        created_at: orders.created_at,
        status: orders.status,
        email: orders.email,
        currency_code: orders.currency_code,
        subtotal: orders.subtotal,
        tax_total: orders.tax_total,
        shipping_total: orders.shipping_total,
        total: orders.total,
        customer_first_name: customers.first_name,
        customer_last_name: customers.last_name,
      })
      .from(orders)
      .leftJoin(customers, eq(orders.customer_id, customers.id))
      .where(whereClause)
      .orderBy(desc(orders.created_at))
      .limit(10000); // Safety cap
  }
}

export const orderService = new OrderService();
