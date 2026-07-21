export type WorkflowStatus =
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type LabelStatus =
  | 'draft'
  | 'created'
  | 'purchased'
  | 'printed'
  | 'voided'
  | 'refunded';

export interface WorkflowTimelineEvent {
  key: WorkflowStatus;
  label: string;
  happened_at: string | null;
  description?: string;
  completed: boolean;
  current: boolean;
}

export interface WorkflowCommunicationEvent {
  template?: string;
  subject?: string;
  message?: string;
  sent_at?: string | null;
  channel?: string;
  status?: string;
}

export interface WorkflowPackage {
  id: string;
  sequence: number;
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
  created_at?: string | null;
  updated_at?: string | null;
  delivered_at?: string | null;
}

export interface PackagingChecklist {
  product_quality_checked?: boolean;
  size_color_verified?: boolean;
  care_card_included?: boolean;
  thank_you_note_included?: boolean;
  gift_wrap_applied?: boolean;
  invoice_included?: boolean;
  checked_at?: string | null;
  checked_by?: string | null;
}

export interface WorkflowMetadata {
  workflow_status?: WorkflowStatus;
  ship_by_date?: string | null;
  estimated_delivery_start?: string | null;
  estimated_delivery_end?: string | null;
  customer_note?: string | null;
  internal_note?: string | null;
  timeline?: Array<{
    key?: string;
    label?: string;
    happened_at?: string | null;
    description?: string;
  }>;
  processed_at?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
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
  label_created_at?: string | null;
  label_printed_at?: string | null;
  communication_events?: WorkflowCommunicationEvent[];
  packaging_checklist?: PackagingChecklist;
  packages?: WorkflowPackage[];
}

type OrderLike = {
  status?: string | null;
  payment_status?: string | null;
  fulfillment_status?: string | null;
  tracking_number?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  metadata?: unknown;
};

const WORKFLOW_ORDER: WorkflowStatus[] = [
  'pending',
  'processing',
  'shipped',
  'delivered',
];

const WORKFLOW_LABELS: Record<WorkflowStatus, string> = {
  pending: 'Order placed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

const LABEL_STATUS_LABELS: Record<LabelStatus, string> = {
  draft: 'Draft',
  created: 'Label created',
  purchased: 'Purchased',
  printed: 'Printed',
  voided: 'Voided',
  refunded: 'Refunded',
};

function toIso(value?: string | Date | null): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function booleanOrFalse(value: unknown): boolean {
  return value === true;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function ensurePackageId(value: unknown, sequence: number): string {
  return typeof value === 'string' && value.trim().length > 0
    ? value
    : `pkg_${sequence}`;
}

export function normalizeWorkflowStatus(
  value?: string | null
): WorkflowStatus | null {
  const normalized = (value || '').toLowerCase();

  if (
    normalized === 'pending' ||
    normalized === 'processing' ||
    normalized === 'shipped' ||
    normalized === 'delivered' ||
    normalized === 'cancelled' ||
    normalized === 'refunded'
  ) {
    return normalized;
  }

  if (normalized === 'canceled') return 'cancelled';
  return null;
}

export function normalizeLabelStatus(value?: string | null): LabelStatus | null {
  const normalized = (value || '').toLowerCase();

  if (
    normalized === 'draft' ||
    normalized === 'created' ||
    normalized === 'purchased' ||
    normalized === 'printed' ||
    normalized === 'voided' ||
    normalized === 'refunded'
  ) {
    return normalized;
  }

  return null;
}

function normalizeWorkflowPackage(
  value: unknown,
  fallbackSequence: number
): WorkflowPackage | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const source = value as Record<string, unknown>;
  const sequence =
    typeof source.sequence === 'number' && Number.isFinite(source.sequence)
      ? Math.max(1, Math.round(source.sequence))
      : fallbackSequence;

  return {
    id: ensurePackageId(source.id, sequence),
    sequence,
    ship_date: stringOrNull(source.ship_date),
    carrier: stringOrNull(source.carrier),
    service: stringOrNull(source.service),
    label_provider: stringOrNull(source.label_provider),
    tracking_number: stringOrNull(source.tracking_number),
    tracking_url: stringOrNull(source.tracking_url),
    label_url: stringOrNull(source.label_url),
    label_file_name: stringOrNull(source.label_file_name),
    label_state:
      normalizeLabelStatus(stringOrNull(source.label_state)) || undefined,
    label_cost: numberOrNull(source.label_cost),
    label_currency: stringOrNull(source.label_currency),
    package_weight_grams: numberOrNull(source.package_weight_grams),
    package_length_cm: numberOrNull(source.package_length_cm),
    package_width_cm: numberOrNull(source.package_width_cm),
    package_height_cm: numberOrNull(source.package_height_cm),
    carrier_service: stringOrNull(source.carrier_service),
    provider_order_id: stringOrNull(source.provider_order_id),
    provider_shipment_id: stringOrNull(source.provider_shipment_id),
    provider_courier_id: stringOrNull(source.provider_courier_id),
    pickup_reference: stringOrNull(source.pickup_reference),
    no_tracking: source.no_tracking === true,
    no_tracking_reason: stringOrNull(source.no_tracking_reason),
    notify_buyer:
      typeof source.notify_buyer === 'boolean' ? source.notify_buyer : undefined,
    notification_sent: source.notification_sent === true,
    notification_sent_at: stringOrNull(source.notification_sent_at),
    created_at: stringOrNull(source.created_at),
    updated_at: stringOrNull(source.updated_at),
    delivered_at: stringOrNull(source.delivered_at),
  };
}

export function getWorkflowMetadata(metadata: unknown): WorkflowMetadata {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  const source = metadata as Record<string, unknown>;

  return {
    workflow_status: normalizeWorkflowStatus(
      typeof source.workflow_status === 'string' ? source.workflow_status : null
    ) || undefined,
    ship_by_date:
      typeof source.ship_by_date === 'string' ? source.ship_by_date : null,
    estimated_delivery_start:
      typeof source.estimated_delivery_start === 'string'
        ? source.estimated_delivery_start
        : null,
    estimated_delivery_end:
      typeof source.estimated_delivery_end === 'string'
        ? source.estimated_delivery_end
        : null,
    customer_note:
      typeof source.customer_note === 'string' ? source.customer_note : null,
    internal_note:
      typeof source.internal_note === 'string' ? source.internal_note : null,
    timeline: Array.isArray(source.timeline)
      ? source.timeline
          .filter(
            (entry): entry is Record<string, unknown> =>
              !!entry && typeof entry === 'object' && !Array.isArray(entry)
          )
          .map((entry) => ({
            key: typeof entry.key === 'string' ? entry.key : undefined,
            label: typeof entry.label === 'string' ? entry.label : undefined,
            happened_at:
              typeof entry.happened_at === 'string' ? entry.happened_at : null,
            description:
              typeof entry.description === 'string'
                ? entry.description
                : undefined,
          }))
      : undefined,
    processed_at:
      typeof source.processed_at === 'string' ? source.processed_at : null,
    shipped_at:
      typeof source.shipped_at === 'string' ? source.shipped_at : null,
    delivered_at:
      typeof source.delivered_at === 'string' ? source.delivered_at : null,
    label_status: normalizeLabelStatus(
      typeof source.label_status === 'string' ? source.label_status : null
    ) || undefined,
    label_url:
      typeof source.label_url === 'string' ? source.label_url : null,
    label_file_name:
      typeof source.label_file_name === 'string'
        ? source.label_file_name
        : null,
    label_cost: numberOrNull(source.label_cost),
    label_currency:
      typeof source.label_currency === 'string' ? source.label_currency : null,
    package_weight_grams: numberOrNull(source.package_weight_grams),
    package_length_cm: numberOrNull(source.package_length_cm),
    package_width_cm: numberOrNull(source.package_width_cm),
    package_height_cm: numberOrNull(source.package_height_cm),
    carrier_service:
      typeof source.carrier_service === 'string' ? source.carrier_service : null,
    label_created_at:
      typeof source.label_created_at === 'string'
        ? source.label_created_at
        : null,
    label_printed_at:
      typeof source.label_printed_at === 'string'
        ? source.label_printed_at
        : null,
    communication_events: Array.isArray(source.communication_events)
      ? source.communication_events
          .filter(
            (entry): entry is Record<string, unknown> =>
              !!entry && typeof entry === 'object' && !Array.isArray(entry)
          )
          .map((entry) => ({
            template:
              typeof entry.template === 'string' ? entry.template : undefined,
            subject:
              typeof entry.subject === 'string' ? entry.subject : undefined,
            message:
              typeof entry.message === 'string' ? entry.message : undefined,
            sent_at:
              typeof entry.sent_at === 'string' ? entry.sent_at : null,
            channel:
              typeof entry.channel === 'string' ? entry.channel : undefined,
            status:
              typeof entry.status === 'string' ? entry.status : undefined,
          }))
      : undefined,
    packages: Array.isArray(source.packages)
      ? source.packages
          .map((entry, index) => normalizeWorkflowPackage(entry, index + 1))
          .filter((entry): entry is WorkflowPackage => !!entry)
          .sort((left, right) => left.sequence - right.sequence)
      : undefined,
    packaging_checklist:
      source.packaging_checklist &&
      typeof source.packaging_checklist === 'object' &&
      !Array.isArray(source.packaging_checklist)
        ? {
            product_quality_checked: booleanOrFalse(
              (source.packaging_checklist as Record<string, unknown>)
                .product_quality_checked
            ),
            size_color_verified: booleanOrFalse(
              (source.packaging_checklist as Record<string, unknown>)
                .size_color_verified
            ),
            care_card_included: booleanOrFalse(
              (source.packaging_checklist as Record<string, unknown>)
                .care_card_included
            ),
            thank_you_note_included: booleanOrFalse(
              (source.packaging_checklist as Record<string, unknown>)
                .thank_you_note_included
            ),
            gift_wrap_applied: booleanOrFalse(
              (source.packaging_checklist as Record<string, unknown>)
                .gift_wrap_applied
            ),
            invoice_included: booleanOrFalse(
              (source.packaging_checklist as Record<string, unknown>)
                .invoice_included
            ),
            checked_at:
              typeof (source.packaging_checklist as Record<string, unknown>)
                .checked_at === 'string'
                ? ((source.packaging_checklist as Record<string, unknown>)
                    .checked_at as string)
                : null,
            checked_by:
              typeof (source.packaging_checklist as Record<string, unknown>)
                .checked_by === 'string'
                ? ((source.packaging_checklist as Record<string, unknown>)
                    .checked_by as string)
                : null,
          }
        : undefined,
  };
}

export function getWorkflowPackages(order: OrderLike): WorkflowPackage[] {
  const metadata = getWorkflowMetadata(order.metadata);

  if (metadata.packages?.length) {
    return metadata.packages.map((pkg, index) => ({
      ...pkg,
      id: ensurePackageId(pkg.id, pkg.sequence || index + 1),
      sequence: pkg.sequence || index + 1,
    }));
  }

  const hasLegacyShippingData =
    !!order.tracking_number ||
    !!metadata.label_url ||
    !!metadata.carrier_service ||
    !!metadata.shipped_at;

  if (!hasLegacyShippingData) {
    return [];
  }

  return [
    {
      id: 'pkg_1',
      sequence: 1,
      ship_date: metadata.shipped_at || null,
      carrier: null,
      service: metadata.carrier_service || null,
      tracking_number: order.tracking_number || null,
      tracking_url: null,
      label_url: metadata.label_url || null,
      label_file_name: metadata.label_file_name || null,
      label_state: metadata.label_status || 'draft',
      label_cost: metadata.label_cost ?? null,
      label_currency: metadata.label_currency || null,
      package_weight_grams: metadata.package_weight_grams ?? null,
      package_length_cm: metadata.package_length_cm ?? null,
      package_width_cm: metadata.package_width_cm ?? null,
      package_height_cm: metadata.package_height_cm ?? null,
      carrier_service: metadata.carrier_service || null,
      no_tracking: !order.tracking_number,
      no_tracking_reason: null,
      notify_buyer: true,
      notification_sent: false,
      notification_sent_at: null,
      created_at: metadata.label_created_at || metadata.shipped_at || null,
      updated_at: metadata.label_printed_at || metadata.shipped_at || null,
      delivered_at: metadata.delivered_at || null,
    },
  ];
}

function getPrimaryWorkflowPackage(order: OrderLike): WorkflowPackage | null {
  const packages = getWorkflowPackages(order);
  if (!packages.length) return null;

  const deliveredPackage = packages.find((pkg) => pkg.delivered_at);
  if (deliveredPackage) return deliveredPackage;

  const shippedPackage = [...packages]
    .filter((pkg) => pkg.ship_date || pkg.tracking_number || pkg.no_tracking)
    .sort((left, right) => right.sequence - left.sequence)[0];

  return shippedPackage || packages[0];
}

export function deriveWorkflowStatus(order: OrderLike): WorkflowStatus {
  const metadata = getWorkflowMetadata(order.metadata);

  if (metadata.workflow_status) {
    return metadata.workflow_status;
  }

  const rawStatus = normalizeWorkflowStatus(order.status);
  if (rawStatus) {
    return rawStatus;
  }

  const commercialStatus = (order.status || '').toLowerCase();
  const paymentStatus = (order.payment_status || '').toLowerCase();
  const fulfillmentStatus = (order.fulfillment_status || '').toLowerCase();

  if (commercialStatus === 'canceled' || commercialStatus === 'cancelled') {
    return 'cancelled';
  }
  if (commercialStatus === 'refunded' || paymentStatus === 'refunded') {
    return 'refunded';
  }
  if (metadata.delivered_at || fulfillmentStatus === 'delivered') {
    return 'delivered';
  }
  if (
    metadata.shipped_at ||
    getWorkflowPackages(order).some(
      (pkg) => !!pkg.ship_date || !!pkg.tracking_number || pkg.no_tracking === true
    ) ||
    !!order.tracking_number ||
    fulfillmentStatus === 'shipped' ||
    fulfillmentStatus === 'fulfilled'
  ) {
    return 'shipped';
  }
  if (
    metadata.processed_at ||
    commercialStatus === 'completed' ||
    paymentStatus === 'captured' ||
    paymentStatus === 'paid'
  ) {
    return 'processing';
  }

  return 'pending';
}

function statusIndex(status: WorkflowStatus): number {
  return WORKFLOW_ORDER.indexOf(status);
}

export function buildWorkflowTimeline(order: OrderLike): WorkflowTimelineEvent[] {
  const metadata = getWorkflowMetadata(order.metadata);
  const workflowStatus = deriveWorkflowStatus(order);

  const generatedTimeline = WORKFLOW_ORDER.map((key, index) => {
    let happenedAt: string | null = null;

    if (key === 'pending') happenedAt = toIso(order.created_at);
    if (key === 'processing') happenedAt = metadata.processed_at || null;
    if (key === 'shipped') happenedAt = metadata.shipped_at || null;
    if (key === 'delivered') happenedAt = metadata.delivered_at || null;

    const currentIndex = statusIndex(workflowStatus);
    const completed =
      currentIndex >= 0 && index < currentIndex && workflowStatus !== 'cancelled' && workflowStatus !== 'refunded';
    const current =
      workflowStatus !== 'cancelled' &&
      workflowStatus !== 'refunded' &&
      index === currentIndex;

    return {
      key,
      label: WORKFLOW_LABELS[key],
      happened_at: happenedAt,
      completed,
      current,
    };
  });

  if (workflowStatus === 'cancelled' || workflowStatus === 'refunded') {
    return [
      ...generatedTimeline.map((event, index) => ({
        ...event,
        completed: index === 0 ? true : !!event.happened_at,
        current: false,
      })),
      {
        key: workflowStatus,
        label: WORKFLOW_LABELS[workflowStatus],
        happened_at: toIso(order.updated_at),
        completed: false,
        current: true,
      },
    ];
  }

  return generatedTimeline;
}

export function mergeWorkflowMetadata(
  existingMetadata: unknown,
  updates: Partial<WorkflowMetadata>
): Record<string, unknown> {
  const existing = getWorkflowMetadata(existingMetadata);
  const merged: Record<string, unknown> = {
    ...(existingMetadata &&
    typeof existingMetadata === 'object' &&
    !Array.isArray(existingMetadata)
      ? (existingMetadata as Record<string, unknown>)
      : {}),
  };

  const nextStatus = updates.workflow_status || existing.workflow_status;
  if (nextStatus) {
    merged.workflow_status = nextStatus;
  }

  const processedAt =
    updates.processed_at ||
    existing.processed_at ||
    (nextStatus === 'processing' ? new Date().toISOString() : null);
  const shippedAt =
    updates.shipped_at ||
    existing.shipped_at ||
    (nextStatus === 'shipped' ? new Date().toISOString() : null);
  const deliveredAt =
    updates.delivered_at ||
    existing.delivered_at ||
    (nextStatus === 'delivered' ? new Date().toISOString() : null);

  merged.processed_at = processedAt;
  merged.shipped_at = shippedAt;
  merged.delivered_at = deliveredAt;
  const hasUpdate = (key: keyof WorkflowMetadata) =>
    Object.prototype.hasOwnProperty.call(updates, key);

  merged.ship_by_date = hasUpdate('ship_by_date')
    ? updates.ship_by_date ?? null
    : existing.ship_by_date ?? null;
  merged.estimated_delivery_start = hasUpdate('estimated_delivery_start')
    ? updates.estimated_delivery_start ?? null
    : existing.estimated_delivery_start ?? null;
  merged.estimated_delivery_end = hasUpdate('estimated_delivery_end')
    ? updates.estimated_delivery_end ?? null
    : existing.estimated_delivery_end ?? null;
  merged.customer_note = hasUpdate('customer_note')
    ? updates.customer_note ?? null
    : existing.customer_note ?? null;
  merged.internal_note = hasUpdate('internal_note')
    ? updates.internal_note ?? null
    : existing.internal_note ?? null;

  merged.label_status = hasUpdate('label_status')
    ? updates.label_status ?? existing.label_status ?? 'draft'
    : existing.label_status ?? 'draft';
  merged.label_url = hasUpdate('label_url')
    ? updates.label_url ?? null
    : existing.label_url ?? null;
  merged.label_file_name = hasUpdate('label_file_name')
    ? updates.label_file_name ?? null
    : existing.label_file_name ?? null;
  merged.label_cost = hasUpdate('label_cost')
    ? updates.label_cost ?? null
    : existing.label_cost ?? null;
  merged.label_currency = hasUpdate('label_currency')
    ? updates.label_currency ?? null
    : existing.label_currency ?? null;
  merged.package_weight_grams = hasUpdate('package_weight_grams')
    ? updates.package_weight_grams ?? null
    : existing.package_weight_grams ?? null;
  merged.package_length_cm = hasUpdate('package_length_cm')
    ? updates.package_length_cm ?? null
    : existing.package_length_cm ?? null;
  merged.package_width_cm = hasUpdate('package_width_cm')
    ? updates.package_width_cm ?? null
    : existing.package_width_cm ?? null;
  merged.package_height_cm = hasUpdate('package_height_cm')
    ? updates.package_height_cm ?? null
    : existing.package_height_cm ?? null;
  merged.carrier_service = hasUpdate('carrier_service')
    ? updates.carrier_service ?? null
    : existing.carrier_service ?? null;
  merged.label_created_at = hasUpdate('label_created_at')
    ? updates.label_created_at ?? null
    : existing.label_created_at ?? null;
  merged.label_printed_at = hasUpdate('label_printed_at')
    ? updates.label_printed_at ?? null
    : existing.label_printed_at ?? null;
  merged.communication_events = hasUpdate('communication_events')
    ? updates.communication_events ?? []
    : existing.communication_events ?? [];
  merged.packages = hasUpdate('packages')
    ? updates.packages ?? []
    : existing.packages ?? [];
  merged.packaging_checklist = hasUpdate('packaging_checklist')
    ? updates.packaging_checklist ?? {}
    : existing.packaging_checklist ?? {};

  const timelineSource = Array.isArray(existing.timeline) ? existing.timeline : [];
  const filteredTimeline = timelineSource.filter(
    (entry) =>
      entry &&
      entry.key &&
      normalizeWorkflowStatus(entry.key) !== nextStatus
  );

  if (nextStatus) {
    filteredTimeline.push({
      key: nextStatus,
      label: WORKFLOW_LABELS[nextStatus],
      happened_at:
        nextStatus === 'processing'
          ? processedAt
          : nextStatus === 'shipped'
            ? shippedAt
            : nextStatus === 'delivered'
              ? deliveredAt
              : new Date().toISOString(),
    });
  }

  merged.timeline = filteredTimeline;

  return merged;
}

export function buildWorkflowSummary(order: OrderLike) {
  const metadata = getWorkflowMetadata(order.metadata);
  const workflowStatus = deriveWorkflowStatus(order);
  const packages = getWorkflowPackages(order);
  const primaryPackage = getPrimaryWorkflowPackage(order);
  const hasTracking =
    packages.some((pkg) => !!pkg.tracking_number) || !!order.tracking_number;
  const trackingExempt =
    packages.some((pkg) => pkg.no_tracking === true) ||
    primaryPackage?.no_tracking === true;
  const shipByDate = metadata.ship_by_date || null;
  const now = new Date();
  const shipBy = shipByDate ? new Date(shipByDate) : null;
  const overdueShipBy =
    !!shipBy &&
    !Number.isNaN(shipBy.getTime()) &&
    shipBy < now &&
    (workflowStatus === 'pending' || workflowStatus === 'processing');
  const overdueTracking =
    workflowStatus === 'processing' &&
    overdueShipBy &&
    !hasTracking &&
    !trackingExempt;

  return {
    status: workflowStatus,
    status_label: WORKFLOW_LABELS[workflowStatus],
    ship_by_date: shipByDate,
    estimated_delivery_start: metadata.estimated_delivery_start || null,
    estimated_delivery_end: metadata.estimated_delivery_end || null,
    customer_note: metadata.customer_note || null,
    internal_note: metadata.internal_note || null,
    has_tracking: hasTracking,
    needs_attention: overdueShipBy || workflowStatus === 'cancelled' || workflowStatus === 'refunded',
    overdue_ship_by: overdueShipBy,
    overdue_tracking: overdueTracking,
    primary_package: primaryPackage,
    packages,
    label: {
      status:
        primaryPackage?.label_state || metadata.label_status || 'draft',
      status_label:
        LABEL_STATUS_LABELS[
          primaryPackage?.label_state || metadata.label_status || 'draft'
        ],
      url: primaryPackage?.label_url || metadata.label_url || null,
      file_name:
        primaryPackage?.label_file_name || metadata.label_file_name || null,
      cost: primaryPackage?.label_cost ?? metadata.label_cost ?? null,
      currency:
        primaryPackage?.label_currency || metadata.label_currency || null,
      package_weight_grams:
        primaryPackage?.package_weight_grams ??
        metadata.package_weight_grams ??
        null,
      package_length_cm:
        primaryPackage?.package_length_cm ??
        metadata.package_length_cm ??
        null,
      package_width_cm:
        primaryPackage?.package_width_cm ?? metadata.package_width_cm ?? null,
      package_height_cm:
        primaryPackage?.package_height_cm ??
        metadata.package_height_cm ??
        null,
      carrier_service:
        primaryPackage?.carrier_service || metadata.carrier_service || null,
      provider: primaryPackage?.label_provider || null,
      provider_order_id: primaryPackage?.provider_order_id || null,
      provider_shipment_id: primaryPackage?.provider_shipment_id || null,
      provider_courier_id: primaryPackage?.provider_courier_id || null,
      pickup_reference: primaryPackage?.pickup_reference || null,
      created_at:
        primaryPackage?.created_at || metadata.label_created_at || null,
      printed_at:
        primaryPackage?.updated_at || metadata.label_printed_at || null,
    },
    communication_events: metadata.communication_events || [],
    packaging_checklist: metadata.packaging_checklist || {
      product_quality_checked: false,
      size_color_verified: false,
      care_card_included: false,
      thank_you_note_included: false,
      gift_wrap_applied: false,
      invoice_included: false,
      checked_at: null,
      checked_by: null,
    },
    timeline: buildWorkflowTimeline(order),
  };
}
