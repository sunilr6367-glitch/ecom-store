import { db } from '../db/client';
import { campaigns, discounts } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

// --- ZOD SCHEMAS ---
// (Moved from routes/marketing.ts)

export const CampaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['promotion', 'email', 'social']).optional(),
  status: z.enum(['draft', 'active', 'paused', 'completed']).optional(),
  start_date: z
    .string()
    .optional()
    .transform((str) => (str ? new Date(str) : undefined)),
  end_date: z
    .string()
    .optional()
    .transform((str) => (str ? new Date(str) : undefined)),
  budget: z.number().int().optional(),
});

export const BaseDiscountSchema = z.object({
  code: z.string().min(3).toUpperCase(),
  type: z.enum(['percentage', 'fixed_amount', 'free_shipping']),
  value: z.number().int().min(0),
  description: z.string().optional(),
  starts_at: z
    .string()
    .optional()
    .transform((str) => (str ? new Date(str) : undefined)),
  ends_at: z
    .string()
    .optional()
    .transform((str) => (str ? new Date(str) : undefined)),
  usage_limit: z.number().int().optional().nullable(),
  min_purchase_amount: z.number().int().optional(),
  is_active: z.boolean().optional(),
  campaign_id: z
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
});

export const DiscountSchema = BaseDiscountSchema.superRefine((data, ctx) => {
  if (data.type === 'percentage' && data.value > 100) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Percentage value cannot exceed 100',
      path: ['value'],
    });
  }
  if (data.starts_at && data.ends_at && data.starts_at > data.ends_at) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'End date cannot be before start date',
      path: ['ends_at'],
    });
  }
});

export type NewCampaign = z.infer<typeof CampaignSchema>;
export type NewDiscount = z.infer<typeof DiscountSchema>;

// --- SERVICE CLASS ---
// Implements Repository Pattern logic

class MarketingService {
  // --- CAMPAIGNS ---
  async getAllCampaigns() {
    return await db
      .select()
      .from(campaigns)
      .orderBy(desc(campaigns.created_at));
  }

  async createCampaign(data: NewCampaign) {
    const [newCampaign] = await db.insert(campaigns).values(data).returning();
    return newCampaign;
  }

  async updateCampaign(id: string, data: Partial<NewCampaign>) {
    const [updated] = await db
      .update(campaigns)
      .set({ ...data, updated_at: new Date() })
      .where(eq(campaigns.id, id))
      .returning();
    return updated;
  }

  async deleteCampaign(id: string) {
    return await db.delete(campaigns).where(eq(campaigns.id, id));
  }

  // --- DISCOUNTS ---
  async getAllDiscounts() {
    return await db
      .select()
      .from(discounts)
      .orderBy(desc(discounts.created_at));
  }

  async createDiscount(data: NewDiscount) {
    const [newDiscount] = await db.insert(discounts).values(data).returning();
    return newDiscount;
  }

  async updateDiscount(id: string, data: Partial<NewDiscount>) {
    const [updated] = await db
      .update(discounts)
      .set({ ...data, updated_at: new Date() })
      .where(eq(discounts.id, id))
      .returning();
    return updated;
  }

  async deleteDiscount(id: string) {
    return await db.delete(discounts).where(eq(discounts.id, id));
  }
}

export const marketingService = new MarketingService();
