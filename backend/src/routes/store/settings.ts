import { Hono } from 'hono';
import { db } from '../../db/client';
import { settings } from '../../db/schema';

const storeSettingsRouter = new Hono();

// GET /store/settings — public store configuration for storefront
storeSettingsRouter.get('/', async (c) => {
  try {
    const allSettings = await db.select().from(settings);
    const storeKeys = new Set([
      'store_name',
      'currency_code',
      'free_shipping_threshold',
      'shipping_rate',
      'default_tax_rate',
    ]);
    const storeSettings = allSettings.filter((s: any) =>
      storeKeys.has(s.key)
    );
    const settingsObj: Record<string, any> = {};
    storeSettings.forEach((s: any) => {
      // Parse numeric values
      const numericKeys = ['free_shipping_threshold', 'shipping_rate', 'default_tax_rate'];
      if (numericKeys.includes(s.key)) {
        const parsed = Number(s.value);
        settingsObj[s.key] = Number.isNaN(parsed) ? s.value : parsed;
      } else {
        settingsObj[s.key] = s.value;
      }
    });
    return c.json(settingsObj);
  } catch (error: any) {
    console.error('Error fetching store settings:', error);
    return c.json({ error: error.message }, 500);
  }
});

export default storeSettingsRouter;
