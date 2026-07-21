import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { carrierService } from '../src/services/carrier-service';

describe('carrier service readiness', () => {
  const envKeys = [
    'SHIPROCKET_API_TOKEN',
    'SHIPROCKET_EMAIL',
    'SHIPROCKET_PASSWORD',
    'DELHIVERY_API_TOKEN',
    'EASYPOST_API_KEY',
    'SHIPPO_API_TOKEN',
  ];
  const previousEnv: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of envKeys) {
      previousEnv[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of envKeys) {
      if (previousEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = previousEnv[key];
      }
    }
  });

  it('reports missing address and package fields before live rates', () => {
    const readiness = carrierService.getReadiness({
      id: 'order_1',
      shipping_address: {
        first_name: 'Asha',
        address_1: '',
        city: 'Jaipur',
        postal_code: '',
        country_code: 'IN',
      },
      workflow: {
        label: {
          package_weight_grams: null,
          package_length_cm: 24,
          package_width_cm: null,
          package_height_cm: 5,
        },
      },
    });

    expect(readiness.can_fetch_live_rates).toBe(false);
    expect(readiness.address_issues).toContain('Address line 1 is missing');
    expect(readiness.address_issues).toContain('Postal code is missing');
    expect(readiness.package_issues).toContain('Package weight is missing');
    expect(readiness.package_issues).toContain('Package width is missing');
    expect(readiness.manual_label_available).toBe(true);
  });

  it('returns provider connection guidance when no credentials are configured', async () => {
    const result = await carrierService.getRates({
      id: 'order_2',
      shipping_address: {
        first_name: 'Asha',
        address_1: '10 Market Road',
        city: 'Jaipur',
        postal_code: '302001',
        country_code: 'IN',
      },
      workflow: {
        label: {
          package_weight_grams: 450,
          package_length_cm: 28,
          package_width_cm: 20,
          package_height_cm: 6,
        },
      },
    });

    expect(result.rates).toEqual([]);
    expect(result.message).toContain('No carrier provider credentials');
  });
});
