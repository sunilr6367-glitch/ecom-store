import { Hono } from 'hono';
import { verifyAdmin, verifyAdminOrMcpService } from '../middleware/auth'; // BUG-010 FIX: was verifyAuth
import { z } from 'zod';
import {
  marketingService,
  CampaignSchema,
  DiscountSchema,
  BaseDiscountSchema,
} from '../services/marketing-service';
import { db } from '../db/client';
import { campaigns, newsletter_subscribers } from '../db/schema';
import { eq } from 'drizzle-orm';
import { emailService } from '../services/email-service';

const app = new Hono();

// GET / — Marketing overview (admin)
app.get('/', verifyAdminOrMcpService, async (c) => {
  try {
    const [allCampaigns, allDiscounts] = await Promise.all([
      marketingService.getAllCampaigns(),
      marketingService.getAllDiscounts(),
    ]);
    const now = new Date();
    const activeCampaigns = allCampaigns.filter((cp: any) =>
      cp.is_active &&
      (!cp.start_date || new Date(cp.start_date) <= now) &&
      (!cp.end_date || new Date(cp.end_date) >= now)
    );
    const activeDiscounts = allDiscounts.filter((d: any) => d.is_active);
    return c.json({
      campaigns: { total: allCampaigns.length, active: activeCampaigns.length },
      discounts: { total: allDiscounts.length, active: activeDiscounts.length },
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// --- CAMPAIGNS ---

// PUBLIC: Get active campaigns for storefront (no auth)
app.get('/campaigns/active', async (c) => {
  try {
    const allCampaigns = await marketingService.getAllCampaigns();
    const now = new Date();
    // Filter to active campaigns within date range
    const activeCampaigns = allCampaigns.filter((campaign: any) => {
      if (campaign.status !== 'active') return false;
      if (campaign.start_date && new Date(campaign.start_date) > now) return false;
      if (campaign.end_date && new Date(campaign.end_date) < now) return false;
      return true;
    });
    return c.json({ campaigns: activeCampaigns });
  } catch (error: unknown) {
    console.error('[Marketing] Error fetching active campaigns:', error);
    return c.json({ campaigns: [] }); // Silent fail for storefront
  }
});

// Get all campaigns (admin)
app.get('/campaigns', verifyAdminOrMcpService, async (c) => {
  try {
    const allCampaigns = await marketingService.getAllCampaigns();
    return c.json({ campaigns: allCampaigns });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Create campaign
app.post('/campaigns', verifyAdminOrMcpService, async (c) => {
  try {
    const body = await c.req.json();
    const validated = CampaignSchema.parse(body);

    const newCampaign = await marketingService.createCampaign(validated);
    return c.json({ campaign: newCampaign }, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError)
      return c.json({ error: 'Validation failed', details: error.errors }, 400);
    return c.json({ error: error.message }, 500);
  }
});

// Update campaign
app.put('/campaigns/:id', verifyAdminOrMcpService, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const validated = CampaignSchema.partial().parse(body);

    const updated = await marketingService.updateCampaign(id, validated);
    return c.json({ campaign: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError)
      return c.json({ error: 'Validation failed', details: error.errors }, 400);
    return c.json({ error: error.message }, 500);
  }
});

// Delete campaign
app.delete('/campaigns/:id', verifyAdminOrMcpService, async (c) => {
  try {
    const id = c.req.param('id');
    await marketingService.deleteCampaign(id);
    return c.json({ message: 'Campaign deleted' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// --- DISCOUNTS ---

// Get all discounts
app.get('/discounts', verifyAdminOrMcpService, async (c) => {
  try {
    const allDiscounts = await marketingService.getAllDiscounts();
    return c.json({ discounts: allDiscounts });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Create discount
app.post('/discounts', verifyAdminOrMcpService, async (c) => {
  try {
    const body = await c.req.json();
    const validated = DiscountSchema.parse(body);

    const newDiscount = await marketingService.createDiscount(validated);
    return c.json({ discount: newDiscount }, 201);
  } catch (error: any) {
    if (error instanceof z.ZodError)
      return c.json({ error: 'Validation failed', details: error.errors }, 400);
    // Handle unique check fail
    if (error.message.includes('unique constraint'))
      return c.json({ error: 'Discount code already exists' }, 409);
    return c.json({ error: error.message }, 500);
  }
});

// Update discount
app.put('/discounts/:id', verifyAdminOrMcpService, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const validated = BaseDiscountSchema.partial().parse(body);

    const updated = await marketingService.updateDiscount(id, validated);
    return c.json({ discount: updated });
  } catch (error: any) {
    if (error instanceof z.ZodError)
      return c.json({ error: 'Validation failed', details: error.errors }, 400);
    return c.json({ error: error.message }, 500);
  }
});

// Delete discount
app.delete('/discounts/:id', verifyAdminOrMcpService, async (c) => {
  try {
    const id = c.req.param('id');
    await marketingService.deleteDiscount(id);
    return c.json({ message: 'Discount deleted' });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// POST /marketing/campaigns/:id/send — Bulk Marketing Blast
app.post('/campaigns/:id/send', verifyAdmin, async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json().catch(() => ({}));

    // Get campaign details
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, id))
      .limit(1);

    if (!campaign) return c.json({ error: 'Campaign not found' }, 404);
    if (campaign.status !== 'active')
      return c.json({ error: 'Campaign must be active to send' }, 400);

    // Fetch target subscribers (newsletter list)
    const subscribers = await db
      .select({ email: newsletter_subscribers.email })
      .from(newsletter_subscribers)
      .where(eq(newsletter_subscribers.status, 'active'));

    if (subscribers.length === 0)
      return c.json({ error: 'No active subscribers found' }, 400);

    const emails = subscribers.map((s) => s.email);

    // Send blast
    const { sent, failed } = await emailService.sendMarketingBlast({
      to: emails,
      campaign_name: campaign.name,
      subject: body.subject || `${campaign.name} — Odhvica`,
      headline: body.headline || campaign.name,
      body_text: body.body_text || campaign.description || 'Discover our latest collection.',
      cta_text: body.cta_text || 'Shop Now',
      cta_url: body.cta_url || '/',
    });

    // Update campaign stats
    await db
      .update(campaigns)
      .set({
        customers_reached: (campaign.customers_reached || 0) + sent,
        updated_at: new Date(),
      })
      .where(eq(campaigns.id, id));

    return c.json({
      success: true,
      sent,
      failed,
      total_subscribers: emails.length,
      message: `Blast sent to ${sent} subscribers (${failed} failed)`,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

export default app;
