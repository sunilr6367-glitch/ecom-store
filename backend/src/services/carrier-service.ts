export type CarrierProvider =
  | 'shiprocket'
  | 'delhivery'
  | 'easypost'
  | 'shippo';

interface CarrierAddress {
  first_name?: string | null;
  last_name?: string | null;
  address_1?: string | null;
  address_2?: string | null;
  city?: string | null;
  postal_code?: string | null;
  province?: string | null;
  country_code?: string | null;
  phone?: string | null;
}

interface CarrierPackageLabel {
  package_weight_grams?: number | null;
  package_length_cm?: number | null;
  package_width_cm?: number | null;
  package_height_cm?: number | null;
  carrier_service?: string | null;
}

interface CarrierOrderItem {
  title?: string | null;
  product_title?: string | null;
  variant_title?: string | null;
  quantity?: number | null;
  unit_price?: number | null;
  total?: number | null;
  sku?: string | null;
}

export interface CarrierOrder {
  id?: string;
  order_number?: string | number | null;
  email?: string | null;
  currency_code?: string | null;
  subtotal?: number | null;
  payment_status?: string | null;
  shipping_address?: CarrierAddress | null;
  workflow?: {
    label?: CarrierPackageLabel;
  };
}

interface CarrierRate {
  id: string;
  provider: CarrierProvider;
  service: string;
  amount: number;
  currency: string;
  estimated_delivery_days?: number | null;
}

interface CarrierReadiness {
  providers: Array<{
    provider: CarrierProvider;
    label: string;
    configured: boolean;
    required_env: string[];
  }>;
  configured_providers: CarrierProvider[];
  address_issues: string[];
  package_issues: string[];
  can_fetch_live_rates: boolean;
  manual_label_available: boolean;
  next_action: string;
}

interface CarrierRatesResult {
  readiness: CarrierReadiness;
  rates: CarrierRate[];
  message?: string;
}

interface CarrierPurchaseOptions {
  provider?: CarrierProvider | null;
  courier_id: string | number;
  package_id?: string | null;
}

interface CarrierPurchaseInput {
  order: CarrierOrder;
  items: CarrierOrderItem[];
}

interface CarrierPurchaseResult {
  provider: CarrierProvider;
  package_id?: string | null;
  label_status: 'purchased';
  label_url: string | null;
  label_file_name: string | null;
  label_cost: number | null;
  label_currency: string | null;
  carrier_service: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  shipping_carrier: string | null;
  shiprocket_order_id?: string | number | null;
  shiprocket_shipment_id?: string | number | null;
  shiprocket_courier_id?: string | number | null;
  shiprocket_pickup_id?: string | number | null;
}

const SHIPROCKET_BASE_URL = 'https://apiv2.shiprocket.in/v1/external';

const PROVIDER_LABELS: Record<CarrierProvider, string> = {
  shiprocket: 'Shiprocket',
  delhivery: 'Delhivery',
  easypost: 'EasyPost',
  shippo: 'Shippo',
};

const PROVIDER_ENV_KEYS: Record<CarrierProvider, string[]> = {
  shiprocket: [
    'SHIPROCKET_API_TOKEN',
    'SHIPROCKET_EMAIL',
    'SHIPROCKET_PASSWORD',
    'SHIPROCKET_PICKUP_LOCATION',
    'SHIPROCKET_PICKUP_POSTCODE',
  ],
  delhivery: ['DELHIVERY_API_TOKEN'],
  easypost: ['EASYPOST_API_KEY'],
  shippo: ['SHIPPO_API_TOKEN'],
};

function hasValue(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function toMinorUnitsAmount(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function toCurrency(value?: string | null) {
  return hasValue(value) ? String(value).toUpperCase() : 'INR';
}

function firstNonEmptyString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return null;
}

function getShiprocketPickupLocation() {
  return firstNonEmptyString(process.env.SHIPROCKET_PICKUP_LOCATION);
}

function getShiprocketPickupPostcode() {
  return firstNonEmptyString(process.env.SHIPROCKET_PICKUP_POSTCODE);
}

function getShiprocketChannelId() {
  return firstNumber(process.env.SHIPROCKET_CHANNEL_ID);
}

function hasProviderCredentials(provider: CarrierProvider): boolean {
  const keys = PROVIDER_ENV_KEYS[provider];

  if (provider === 'shiprocket') {
    return (
      hasValue(process.env.SHIPROCKET_API_TOKEN) ||
      (hasValue(process.env.SHIPROCKET_EMAIL) &&
        hasValue(process.env.SHIPROCKET_PASSWORD))
    );
  }

  return keys.some((key) => hasValue(process.env[key]));
}

function requiredAddressIssues(address?: CarrierAddress | null) {
  const issues: string[] = [];

  if (!address) {
    return ['Shipping address is missing'];
  }

  if (!hasValue(address.first_name) && !hasValue(address.last_name)) {
    issues.push('Recipient name is missing');
  }
  if (!hasValue(address.address_1)) issues.push('Address line 1 is missing');
  if (!hasValue(address.city)) issues.push('City is missing');
  if (!hasValue(address.postal_code)) issues.push('Postal code is missing');
  if (!hasValue(address.country_code)) issues.push('Country code is missing');
  if (!hasValue(address.phone)) issues.push('Recipient phone is missing');

  return issues;
}

function requiredPackageIssues(order: CarrierOrder) {
  const label = order.workflow?.label;
  const issues: string[] = [];

  if (!label?.package_weight_grams || label.package_weight_grams <= 0) {
    issues.push('Package weight is missing');
  }
  if (!label?.package_length_cm || label.package_length_cm <= 0) {
    issues.push('Package length is missing');
  }
  if (!label?.package_width_cm || label.package_width_cm <= 0) {
    issues.push('Package width is missing');
  }
  if (!label?.package_height_cm || label.package_height_cm <= 0) {
    issues.push('Package height is missing');
  }

  return issues;
}

function providerSpecificIssues(
  provider: CarrierProvider | null | undefined,
  order: CarrierOrder
) {
  if (provider !== 'shiprocket') return { address: [], package: [] };

  const address: string[] = [];
  const packageIssues: string[] = [];

  if (!getShiprocketPickupLocation()) {
    address.push('Shiprocket pickup location is not configured');
  }
  if (!getShiprocketPickupPostcode()) {
    address.push('Shiprocket pickup postcode is not configured');
  }

  if (!order.email) {
    address.push('Buyer email is missing');
  }

  return { address, package: packageIssues };
}

function normalizeWeightKg(weightGrams?: number | null) {
  if (!weightGrams || weightGrams <= 0) return null;
  return Math.max(weightGrams / 1000, 0.5);
}

function buildTrackingUrl(
  provider: CarrierProvider,
  trackingNumber?: string | null
) {
  if (!trackingNumber) return null;

  if (provider === 'shiprocket') {
    return 'https://www.shiprocket.in/shipment-tracking/';
  }

  return null;
}

async function parseShiprocketResponse(response: Response) {
  const text = await response.text();
  let json: any = null;

  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { message: text };
  }

  if (!response.ok) {
    const message =
      json?.message ||
      json?.error ||
      json?.errors?.[0] ||
      `Shiprocket request failed with status ${response.status}`;
    throw new Error(message);
  }

  return json;
}

async function getShiprocketAuthToken() {
  const existingToken = firstNonEmptyString(process.env.SHIPROCKET_API_TOKEN);
  if (existingToken) return existingToken;

  const email = firstNonEmptyString(process.env.SHIPROCKET_EMAIL);
  const password = firstNonEmptyString(process.env.SHIPROCKET_PASSWORD);

  if (!email || !password) {
    throw new Error('Shiprocket API credentials are not configured');
  }

  const response = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  const json = await parseShiprocketResponse(response);
  const token = firstNonEmptyString(json?.token, json?.data?.token);

  if (!token) {
    throw new Error('Shiprocket login did not return an API token');
  }

  return token;
}

async function shiprocketRequest(
  path: string,
  options: {
    method?: 'GET' | 'POST';
    query?: Record<string, string | number | null | undefined>;
    body?: Record<string, unknown>;
  } = {}
) {
  const token = await getShiprocketAuthToken();
  const url = new URL(`${SHIPROCKET_BASE_URL}${path}`);

  for (const [key, value] of Object.entries(options.query || {})) {
    if (value !== null && value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url.toString(), {
    method: options.method || 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  return parseShiprocketResponse(response);
}

function normalizeShiprocketRate(rate: any): CarrierRate | null {
  const courierId = firstNumber(rate?.courier_company_id, rate?.id);
  if (!courierId) return null;

  const courierName = firstNonEmptyString(
    rate?.courier_name,
    rate?.name,
    rate?.channel_name
  );
  const rateAmount = firstNumber(
    rate?.rate,
    rate?.freight_charge,
    rate?.total_charge,
    rate?.cost
  );

  return {
    id: String(courierId),
    provider: 'shiprocket',
    service: courierName || `Courier ${courierId}`,
    amount: rateAmount != null ? Math.round(rateAmount * 100) : 0,
    currency: 'INR',
    estimated_delivery_days: firstNumber(
      rate?.estimated_delivery_days,
      rate?.etd,
      rate?.delivery_days
    ),
  };
}

function buildShiprocketOrderPayload(input: CarrierPurchaseInput) {
  const { order, items } = input;
  const address = order.shipping_address;
  const label = order.workflow?.label;
  const buyerFirstName = firstNonEmptyString(address?.first_name, 'Customer');
  const buyerLastName = firstNonEmptyString(address?.last_name, '');
  const orderNumber =
    firstNonEmptyString(order.order_number) || firstNonEmptyString(order.id) || 'order';
  const pickupLocation = getShiprocketPickupLocation();
  const channelId = getShiprocketChannelId();
  const weightKg = normalizeWeightKg(label?.package_weight_grams);

  if (!address || !pickupLocation || !weightKg) {
    throw new Error('Shiprocket order payload is missing address or package data');
  }

  const orderItems = items.length
    ? items.map((item, index) => ({
        name:
          firstNonEmptyString(
            item.product_title,
            item.title,
            item.variant_title
          ) || `Item ${index + 1}`,
        sku:
          firstNonEmptyString(item.sku, item.variant_title, item.product_title) ||
          `SKU-${index + 1}`,
        units: Math.max(item.quantity || 1, 1),
        selling_price: ((toMinorUnitsAmount(item.unit_price) || 0) / 100).toFixed(2),
      }))
    : [
        {
          name: `Order ${orderNumber}`,
          sku: `ORDER-${orderNumber}`,
          units: 1,
          selling_price: ((toMinorUnitsAmount(order.subtotal) || 0) / 100).toFixed(2),
        },
      ];

  return {
    order_id: `${orderNumber}-${Date.now()}`,
    order_date: new Date().toISOString().slice(0, 10),
    pickup_location: pickupLocation,
    channel_id: channelId || undefined,
    comment: `Odhvica order ${orderNumber}`,
    billing_customer_name: buyerFirstName,
    billing_last_name: buyerLastName || undefined,
    billing_address: address.address_1,
    billing_address_2: address.address_2 || undefined,
    billing_city: address.city,
    billing_pincode: address.postal_code,
    billing_state: address.province || undefined,
    billing_country: address.country_code || 'IN',
    billing_email: order.email,
    billing_phone: address.phone,
    shipping_is_billing: true,
    payment_method:
      String(order.payment_status || '').toLowerCase() === 'awaiting'
        ? 'COD'
        : 'Prepaid',
    order_items: orderItems,
    sub_total: ((toMinorUnitsAmount(order.subtotal) || 0) / 100).toFixed(2),
    length: label?.package_length_cm,
    breadth: label?.package_width_cm,
    height: label?.package_height_cm,
    weight: weightKg,
  };
}

function getServiceabilityQuery(order: CarrierOrder) {
  const address = order.shipping_address;
  const label = order.workflow?.label;
  const pickupPostcode = getShiprocketPickupPostcode();
  const weightKg = normalizeWeightKg(label?.package_weight_grams);

  if (!address?.postal_code || !pickupPostcode || !weightKg) {
    throw new Error('Address or package details must be complete before rates');
  }

  return {
    pickup_postcode: pickupPostcode,
    delivery_postcode: address.postal_code,
    cod:
      String(order.payment_status || '').toLowerCase() === 'awaiting' ? 1 : 0,
    weight: weightKg.toFixed(2),
    length: label?.package_length_cm || undefined,
    breadth: label?.package_width_cm || undefined,
    height: label?.package_height_cm || undefined,
  };
}

export const carrierService = {
  getProviderStatus() {
    return (Object.keys(PROVIDER_LABELS) as CarrierProvider[]).map(
      (provider) => ({
        provider,
        label: PROVIDER_LABELS[provider],
        configured: hasProviderCredentials(provider),
        required_env: PROVIDER_ENV_KEYS[provider],
      })
    );
  },

  getReadiness(
    order: CarrierOrder,
    options: { provider?: CarrierProvider | null } = {}
  ): CarrierReadiness {
    const providers = this.getProviderStatus();
    const configuredProviders = providers.filter((provider) => provider.configured);
    const selectedProvider =
      options.provider || configuredProviders[0]?.provider || null;
    const baseAddressIssues = requiredAddressIssues(order.shipping_address);
    const basePackageIssues = requiredPackageIssues(order);
    const providerIssues = providerSpecificIssues(selectedProvider, order);
    const address_issues = [...baseAddressIssues, ...providerIssues.address];
    const package_issues = [...basePackageIssues, ...providerIssues.package];
    const can_fetch_live_rates =
      !!selectedProvider &&
      configuredProviders.some((provider) => provider.provider === selectedProvider) &&
      address_issues.length === 0 &&
      package_issues.length === 0;

    return {
      providers,
      configured_providers: configuredProviders.map(
        (provider) => provider.provider
      ),
      address_issues,
      package_issues,
      can_fetch_live_rates,
      manual_label_available: true,
      next_action: can_fetch_live_rates
        ? 'Fetch carrier rates'
        : configuredProviders.length === 0
          ? 'Connect a carrier provider'
          : 'Fix address, package, or pickup setup',
    };
  },

  async getRates(
    order: CarrierOrder,
    options: { provider?: CarrierProvider | null } = {}
  ): Promise<CarrierRatesResult> {
    const readiness = this.getReadiness(order, options);
    const selectedProvider = options.provider || readiness.configured_providers[0];

    if (!selectedProvider) {
      return {
        readiness,
        rates: [],
        message:
          'No carrier provider credentials are configured. Manual labels remain available.',
      };
    }

    if (!readiness.can_fetch_live_rates) {
      return {
        readiness,
        rates: [],
        message: 'Address, pickup setup, and package details must be complete before rates.',
      };
    }

    if (selectedProvider !== 'shiprocket') {
      return {
        readiness,
        rates: [],
        message: `${PROVIDER_LABELS[selectedProvider]} credentials are detected; live rate adapter is still pending.`,
      };
    }

    const json = await shiprocketRequest('/courier/serviceability/', {
      method: 'GET',
      query: getServiceabilityQuery(order),
    });
    const rawRates =
      json?.data?.available_courier_companies ||
      json?.available_courier_companies ||
      [];
    const rates = Array.isArray(rawRates)
      ? rawRates
          .map((rate) => normalizeShiprocketRate(rate))
          .filter((rate): rate is CarrierRate => !!rate)
      : [];

    return {
      readiness,
      rates,
      message:
        rates.length === 0
          ? 'Shiprocket responded, but no serviceable couriers were returned for this package.'
          : undefined,
    };
  },

  async purchaseLabel(
    input: CarrierPurchaseInput,
    options: CarrierPurchaseOptions
  ): Promise<CarrierPurchaseResult> {
    const selectedProvider = options.provider || 'shiprocket';

    if (selectedProvider !== 'shiprocket') {
      throw new Error(`${PROVIDER_LABELS[selectedProvider]} label purchase is not wired yet`);
    }

    const readiness = this.getReadiness(input.order, {
      provider: selectedProvider,
    });
    if (!readiness.can_fetch_live_rates) {
      throw new Error('Address, pickup setup, and package details must be complete before label purchase');
    }

    const courierId = firstNumber(options.courier_id);
    if (!courierId) {
      throw new Error('A Shiprocket courier selection is required before buying a label');
    }

    const createOrderResponse = await shiprocketRequest('/orders/create/adhoc', {
      method: 'POST',
      body: buildShiprocketOrderPayload(input),
    });
    const shiprocketOrderId = firstNonEmptyString(
      createOrderResponse?.order_id,
      createOrderResponse?.data?.order_id
    );
    const shipmentId = firstNumber(
      createOrderResponse?.shipment_id,
      createOrderResponse?.data?.shipment_id,
      createOrderResponse?.shipment?.id
    );

    if (!shipmentId) {
      throw new Error('Shiprocket order was created, but no shipment id was returned');
    }

    const awbResponse = await shiprocketRequest('/courier/assign/awb', {
      method: 'POST',
      body: {
        shipment_id: shipmentId,
        courier_id: courierId,
      },
    });

    const trackingNumber = firstNonEmptyString(
      awbResponse?.awb_code,
      awbResponse?.response?.data?.awb_code,
      awbResponse?.data?.awb_code
    );
    const courierName = firstNonEmptyString(
      awbResponse?.courier_name,
      awbResponse?.response?.data?.courier_name,
      awbResponse?.data?.courier_name
    );

    const pickupResponse = await shiprocketRequest('/courier/generate/pickup', {
      method: 'POST',
      body: {
        shipment_id: [shipmentId],
      },
    });

    const labelResponse = await shiprocketRequest('/courier/generate/label', {
      method: 'POST',
      body: {
        shipment_id: [shipmentId],
      },
    });

    const labelUrl = firstNonEmptyString(
      labelResponse?.label_url,
      labelResponse?.response?.label_url,
      labelResponse?.response?.data?.label_url,
      labelResponse?.data?.label_url,
      labelResponse?.label_created?.label_url
    );
    const pickupId = firstNonEmptyString(
      pickupResponse?.pickup_id,
      pickupResponse?.response?.pickup_id,
      pickupResponse?.response?.data?.pickup_id,
      pickupResponse?.data?.pickup_id
    );

    return {
      provider: selectedProvider,
      package_id: options.package_id || null,
      label_status: 'purchased',
      label_url: labelUrl,
      label_file_name: labelUrl ? `shiprocket-label-${shipmentId}.pdf` : null,
      label_cost: null,
      label_currency: toCurrency(input.order.currency_code),
      carrier_service:
        courierName || input.order.workflow?.label?.carrier_service || null,
      tracking_number: trackingNumber,
      tracking_url: buildTrackingUrl(selectedProvider, trackingNumber),
      shipping_carrier: courierName,
      shiprocket_order_id: shiprocketOrderId,
      shiprocket_shipment_id: shipmentId,
      shiprocket_courier_id: courierId,
      shiprocket_pickup_id: pickupId,
    };
  },
};
