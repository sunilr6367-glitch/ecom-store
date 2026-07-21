import { Hono } from 'hono';
import { verifyAdmin } from '../middleware/auth'; // BUG-011 FIX: was verifyAuth
import { z } from 'zod';
import { settingService, SettingSchema } from '../services/setting-service';
import { db } from '../db/client';
import { settings } from '../db/schema';

const settingsRouter = new Hono();

// DEFAULT VALUES - Always used as fallback
const DEFAULT_NAV_LINKS = JSON.stringify([
  { label: 'Home', url: '/', order: 1 },
  { label: 'New Arrivals', url: '/products?sort=newest', order: 2 },
  { label: 'Shop', url: '/products', order: 3 },
  { label: 'Collections', url: '/collections', order: 4 },
  { label: 'Sale', url: '/sale', order: 5, highlight: true },
  { label: 'About', url: '/about', order: 6 },
  { label: 'Contact', url: '/contact', order: 7 },
]);

const DEFAULT_QUICK_LINKS = JSON.stringify([
  { label: 'Bestsellers', url: '/bestsellers', order: 1 },
  { label: 'New Arrivals', url: '/products?tag=new', order: 2 },
  { label: 'Collections', url: '/collections', order: 3 },
  { label: 'Sale', url: '/sale', order: 4, highlight: true },
]);

const DEFAULT_STORE_INFO = {
  store_logo_url: '',
  store_address: '123 Fashion Avenue, New York, NY 10001',
  store_phone: '+1 (555) 123-4567',
  store_email: 'support@odhvica.com',
};

// Public: Get public settings for storefront (no auth required)
settingsRouter.get('/public', async (c) => {
  try {
    const allSettings = await db.select().from(settings);
    const publicSettings = allSettings.filter((s: any) => s.is_public === true);
    return c.json({ settings: publicSettings });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Public: Get homepage settings
settingsRouter.get('/homepage', async (c) => {
  try {
    const allSettings = await db.select().from(settings);
    const homepageKeys = [
      'announcement_bar_text',
      'announcement_bar_enabled',
      'hero_title',
      'hero_subtitle',
      'hero_cta_text',
      'hero_cta_link',
      'hero_image',
      'newsletter_title',
      'newsletter_subtitle',
      'newsletter_cta_text',
      'brand_story_title',
      'brand_story_content',
      'brand_story_image',
      'featured_product_ids',
      'nav_links',
      'quick_links',
      // Homepage stats (admin-configurable)
      'stat_customer_rating',
      'stat_happy_customers',
      'stat_countries_served',
      'stat_return_policy',
    ];

    const homepageSettings = allSettings.filter((s: any) =>
      homepageKeys.includes(s.key)
    );
    const settingsObj: Record<string, any> = {};
    homepageSettings.forEach((s: any) => {
      settingsObj[s.key] = s.value;
    });

    // Apply defaults if empty
    if (!settingsObj.nav_links || settingsObj.nav_links === '') {
      settingsObj.nav_links = DEFAULT_NAV_LINKS;
    }
    if (!settingsObj.quick_links || settingsObj.quick_links === '') {
      settingsObj.quick_links = DEFAULT_QUICK_LINKS;
    }

    return c.json({ settings: settingsObj });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Public: Get store info (address, phone, email, logo)
settingsRouter.get('/store-info', async (c) => {
  try {
    const allSettings = await db.select().from(settings);
    const storeInfoKeys = [
      'store_logo_url',
      'store_address',
      'store_phone',
      'store_email',
    ];
    const storeSettings = allSettings.filter((s: any) =>
      storeInfoKeys.includes(s.key)
    );

    const settingsObj: Record<string, any> = { ...DEFAULT_STORE_INFO };
    storeSettings.forEach((s: any) => {
      if (s.value) {
        settingsObj[s.key] = s.value;
      }
    });

    return c.json({ settings: settingsObj });
  } catch (error: any) {
    return c.json({ settings: DEFAULT_STORE_INFO }, 200);
  }
});

// Public: Get footer settings for wholesale page
settingsRouter.get('/footer', async (c) => {
  try {
    const allSettings = await db.select().from(settings);
    const footerKeys = [
      'wholesale_footer_catalog_link',
      'wholesale_footer_price_list_link',
      'wholesale_footer_terms_link',
      'wholesale_footer_shipping_link',
      'wholesale_footer_return_link',
    ];
    
    const footerSettings = allSettings.filter((s: any) =>
      footerKeys.includes(s.key)
    );
    
    const settingsObj: Record<string, any> = {};
    footerSettings.forEach((s: any) => {
      settingsObj[s.key] = s.value;
    });
    
    return c.json({ settings: settingsObj });
  } catch (error: any) {
    return c.json({ settings: {} }, 200);
  }
});

// Public: Get wholesale pricing tiers for public page
settingsRouter.get('/wholesale-tiers', async (c) => {
  try {
    const { wholesale_tiers } = await import('../db/schema');
    const { eq, asc } = await import('drizzle-orm');
    const { db } = await import('../db/client');
    
    const tiers = await db
      .select()
      .from(wholesale_tiers)
      .where(eq(wholesale_tiers.active, true))
      .orderBy(asc(wholesale_tiers.priority));
    
    return c.json({ tiers });
  } catch (error: any) {
    console.error('Error fetching wholesale tiers:', error);
    return c.json({ tiers: [] }, 200);
  }
});

// Get all settings
settingsRouter.get('/', verifyAdmin, async (c) => {
  try {
    const allSettings = await settingService.getAll();
    return c.json({ settings: allSettings });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get settings by category
settingsRouter.get('/category/:category', verifyAdmin, async (c) => {
  try {
    const category = c.req.param('category');
    const settingsObj = await settingService.getByCategory(category);
    return c.json({ category, settings: settingsObj });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Get single setting by key
settingsRouter.get('/:key', verifyAdmin, async (c) => {
  try {
    const key = c.req.param('key');
    const setting = await settingService.getByKey(key);

    if (!setting) return c.json({ error: 'Setting not found' }, 404);
    return c.json({ setting });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Update or create setting
settingsRouter.put('/:key', verifyAdmin, async (c) => {
  try {
    const key = c.req.param('key');
    const body = await c.req.json();

    // Basic validation on body structure
    if (!body || typeof body.value === 'undefined') {
      return c.json({ error: 'Value is required' }, 400);
    }

    const result = await settingService.upsert(key, { key, ...body });
    return c.json({ setting: result });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Bulk update settings
settingsRouter.post('/bulk', verifyAdmin, async (c) => {
  try {
    const body = await c.req.json();
    const { settings: settingsToUpdate } = body;

    if (!settingsToUpdate || typeof settingsToUpdate !== 'object') {
      return c.json({ error: 'Invalid settings format' }, 400);
    }

    const results = await settingService.bulkUpsert(settingsToUpdate);
    return c.json({
      message: 'Settings updated',
      count: results.length,
      settings: results,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Delete setting
settingsRouter.delete('/:key', verifyAdmin, async (c) => {
  try {
    const key = c.req.param('key');
    const deleted = await settingService.delete(key);

    if (!deleted) return c.json({ error: 'Setting not found' }, 404);
    return c.json({ message: 'Setting deleted', setting: deleted });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default settingsRouter;
