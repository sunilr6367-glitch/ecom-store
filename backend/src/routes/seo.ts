import { Hono } from 'hono';
import { z } from 'zod';
import { asc, desc, eq, sql } from 'drizzle-orm';

import { db } from '../db/client';
import { verifyAdminOrMcpService } from '../middleware/auth';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error-handler';
import { successResponse, HttpStatus } from '../utils/api-response';
import {
  attribute_values,
  gsc_performance,
  market_policies,
  product_attributes,
  seo_landing_pages,
} from '../db/schema';

const seoRouter = new Hono();

const LandingRuleSchema = z.object({
  category_id: z.string().uuid().optional(),
  collection_id: z.string().uuid().optional(),
  search: z.string().min(2).optional(),
  attribute_code: z.string().min(2).optional(),
  attribute_value: z.string().min(1).optional(),
});

const LandingPageSchema = z.object({
  slug: z.string().min(2),
  title: z.string().min(2),
  meta_description: z.string().optional().nullable(),
  intro_content: z.string().optional().nullable(),
  outro_content: z.string().optional().nullable(),
  rule_definition: LandingRuleSchema.optional().nullable(),
  canonical_url: z.string().optional().nullable(),
  robots_index: z.boolean().optional(),
  robots_follow: z.boolean().optional(),
  hreflang_group_id: z.string().optional().nullable(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  priority: z.number().int().min(0).max(100).optional(),
  localized_metadata: z.record(z.unknown()).optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

function validateIndexableLandingPage(data: z.infer<typeof LandingPageSchema> | Partial<z.infer<typeof LandingPageSchema>>) {
  if (data.status !== 'active') return;

  const rule = data.rule_definition || {};
  const hasUsableRule =
    Boolean(rule.category_id) ||
    Boolean(rule.collection_id) ||
    Boolean(rule.search) ||
    Boolean(rule.attribute_code && rule.attribute_value);

  if (!hasUsableRule) {
    throw new ValidationError('Active SEO landing pages require a category, collection, search, or attribute rule');
  }

  if (data.robots_index !== false && !data.meta_description) {
    throw new ValidationError('Indexable SEO landing pages require a meta description');
  }
}

const AttributeSchema = z.object({
  code: z.string().min(2),
  label: z.string().min(2),
  type: z.string().optional(),
  facet_enabled: z.boolean().optional(),
  seo_enabled: z.boolean().optional(),
  merchant_mapping: z.string().optional().nullable(),
  display_order: z.number().int().optional(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

const AttributeValueSchema = z.object({
  slug: z.string().min(1),
  label: z.string().min(1),
  synonyms: z.array(z.string()).optional(),
  locale_labels: z.record(z.unknown()).optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

seoRouter.get(
  '/landing-pages',
  asyncHandler(async (c) => {
    const status = c.req.query('status');
    const rows = await db
      .select()
      .from(seo_landing_pages)
      .where(status ? eq(seo_landing_pages.status, status) : undefined)
      .orderBy(asc(seo_landing_pages.priority), asc(seo_landing_pages.slug));

    return successResponse(c, { landing_pages: rows }, 'SEO landing pages retrieved successfully');
  })
);

seoRouter.get(
  '/landing-pages/:slug',
  asyncHandler(async (c) => {
    const slug = c.req.param('slug');
    const [page] = await db
      .select()
      .from(seo_landing_pages)
      .where(eq(seo_landing_pages.slug, slug))
      .limit(1);

    if (!page) {
      return c.json(
        {
          success: false,
          message: 'SEO landing page not found',
          timestamp: new Date().toISOString(),
        },
        HttpStatus.NOT_FOUND
      );
    }

    return successResponse(c, { landing_page: page }, 'SEO landing page retrieved successfully');
  })
);

seoRouter.post(
  '/landing-pages',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const body = await c.req.json();
    const result = LandingPageSchema.safeParse(body);
    if (!result.success) throw new ValidationError('Invalid SEO landing page data', result.error.errors);
    validateIndexableLandingPage(result.data);

    const [page] = await db
      .insert(seo_landing_pages)
      .values(result.data)
      .returning();

    return successResponse(c, { landing_page: page }, 'SEO landing page created successfully', HttpStatus.CREATED);
  })
);

seoRouter.put(
  '/landing-pages/:id',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = LandingPageSchema.partial().safeParse(body);
    if (!result.success) throw new ValidationError('Invalid SEO landing page data', result.error.errors);
    validateIndexableLandingPage(result.data);

    const [page] = await db
      .update(seo_landing_pages)
      .set({ ...result.data, updated_at: new Date() })
      .where(eq(seo_landing_pages.id, id))
      .returning();

    if (!page) throw new NotFoundError('SEO landing page not found');
    return successResponse(c, { landing_page: page }, 'SEO landing page updated successfully');
  })
);

seoRouter.delete(
  '/landing-pages/:id',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const id = c.req.param('id');
    const [page] = await db
      .update(seo_landing_pages)
      .set({ status: 'archived', robots_index: false, updated_at: new Date() })
      .where(eq(seo_landing_pages.id, id))
      .returning();

    if (!page) throw new NotFoundError('SEO landing page not found');
    return successResponse(c, { landing_page: page }, 'SEO landing page archived successfully');
  })
);

seoRouter.get(
  '/attributes',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const rows = await db.select().from(product_attributes).orderBy(asc(product_attributes.display_order));
    return successResponse(c, { attributes: rows }, 'SEO attributes retrieved successfully');
  })
);

seoRouter.post(
  '/attributes',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const body = await c.req.json();
    const result = AttributeSchema.safeParse(body);
    if (!result.success) throw new ValidationError('Invalid attribute data', result.error.errors);

    const [attribute] = await db
      .insert(product_attributes)
      .values(result.data)
      .onConflictDoUpdate({
        target: product_attributes.code,
        set: { ...result.data, updated_at: new Date() },
      })
      .returning();

    return successResponse(c, { attribute }, 'SEO attribute saved successfully');
  })
);

seoRouter.get(
  '/attributes/:attributeId/values',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const attributeId = c.req.param('attributeId');
    const rows = await db
      .select()
      .from(attribute_values)
      .where(eq(attribute_values.attribute_id, attributeId))
      .orderBy(asc(attribute_values.label));

    return successResponse(c, { values: rows }, 'Attribute values retrieved successfully');
  })
);

seoRouter.post(
  '/attributes/:attributeId/values',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const attributeId = c.req.param('attributeId');
    const body = await c.req.json();
    const result = AttributeValueSchema.safeParse(body);
    if (!result.success) throw new ValidationError('Invalid attribute value data', result.error.errors);

    const [value] = await db
      .insert(attribute_values)
      .values({ attribute_id: attributeId, ...result.data })
      .returning();

    return successResponse(c, { value }, 'Attribute value created successfully', HttpStatus.CREATED);
  })
);

seoRouter.get(
  '/market-policies',
  asyncHandler(async (c) => {
    const rows = await db
      .select()
      .from(market_policies)
      .where(eq(market_policies.status, 'active'))
      .orderBy(asc(market_policies.locale));

    return successResponse(c, { policies: rows }, 'Market policies retrieved successfully');
  })
);

seoRouter.get(
  '/market-policies/:locale',
  asyncHandler(async (c) => {
    const locale = c.req.param('locale');
    const [policy] = await db
      .select()
      .from(market_policies)
      .where(eq(market_policies.locale, locale))
      .limit(1);

    if (!policy) throw new NotFoundError('Market policy not found');
    return successResponse(c, { policy }, 'Market policy retrieved successfully');
  })
);

seoRouter.get(
  '/gsc/performance',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const rows = await db
      .select()
      .from(gsc_performance)
      .orderBy(desc(gsc_performance.date))
      .limit(500);

    const opportunities = await db
      .select({
        page: gsc_performance.page,
        impressions: sql<number>`sum(${gsc_performance.impressions})`,
        clicks: sql<number>`sum(${gsc_performance.clicks})`,
        avg_ctr: sql<number>`avg(${gsc_performance.ctr})`,
        avg_position: sql<number>`avg(${gsc_performance.position})`,
      })
      .from(gsc_performance)
      .groupBy(gsc_performance.page)
      .having(sql`sum(${gsc_performance.impressions}) > 100 and avg(${gsc_performance.ctr}) < 0.02`)
      .orderBy(sql`sum(${gsc_performance.impressions}) desc`)
      .limit(50);

    return successResponse(
      c,
      { rows, opportunities },
      'GSC performance retrieved successfully'
    );
  })
);

export default seoRouter;
