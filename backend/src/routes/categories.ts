import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { verifyAdminOrMcpService } from '../middleware/auth';
import { db } from '../db/client';
import { categories, product_categories, products } from '../db/schema';
import { eq, desc, count, sql, inArray, and } from 'drizzle-orm';
import { z } from 'zod';
import { triggerStorefrontRevalidation } from '../utils/storefront-revalidate';

const categoriesRouter = new Hono();

const CategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  parent_id: z.string().optional().nullable(),
  image: z.string().optional(),
  is_active: z.boolean().optional(),
  display_order: z.number().optional().default(0),
  show_in_header: z.boolean().optional().default(true),
  header_image_url: z.string().optional().nullable(),
  emoji: z.string().optional().nullable(),
  seo_title: z.string().max(200).optional().nullable(),
  seo_desc: z.string().max(300).optional().nullable(),
  og_image_url: z.string().url().optional().nullable(),
});

const ProductAssignmentSchema = z.object({
  product_ids: z.array(z.string().uuid()).default([]),
});

// GET /categories
categoriesRouter.get('/', async (c) => {
  try {
    const list = await db
      .select()
      .from(categories)
      .orderBy(desc(categories.created_at));
    return c.json({ categories: list });
  } catch (error: unknown) {
    console.error('Error fetching categories:', error);
    return c.json({ error: 'Failed to fetch categories' }, 500);
  }
});

// GET /categories/tree
categoriesRouter.get('/tree', async (c) => {
  try {
    const allCategoriesBase = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        parent_id: categories.parent_id,
        image: categories.image,
        is_active: categories.is_active,
        display_order: categories.display_order,
        show_in_header: categories.show_in_header,
        header_image_url: categories.header_image_url,
        emoji: categories.emoji,
        seo_title: categories.seo_title,
        seo_desc: categories.seo_desc,
        og_image_url: categories.og_image_url,
        created_at: categories.created_at,
        updated_at: categories.updated_at,
      })
      .from(categories);

    const categoryIds = allCategoriesBase.map((category) => category.id);
    const countRows = categoryIds.length
      ? await db
          .select({
            category_id: product_categories.category_id,
            product_count: sql<number>`count(distinct ${products.id})`.mapWith(Number),
          })
          .from(product_categories)
          .innerJoin(products, eq(products.id, product_categories.product_id))
          .where(
            and(
              inArray(product_categories.category_id, categoryIds),
              eq(products.status, 'published')
            )
          )
          .groupBy(product_categories.category_id)
      : [];

    const productCounts = new Map(
      countRows.map((row) => [row.category_id, Number(row.product_count || 0)])
    );
    const allCategories = allCategoriesBase.map((category) => ({
      ...category,
      product_count: productCounts.get(category.id) || 0,
    }));

    const buildTree = (parentId: string | null = null): any[] => {
      return allCategories
        .filter((cat) => cat.parent_id === parentId)
        .map((cat) => ({
          ...cat,
          children: buildTree(cat.id),
        }));
    };

    const tree = buildTree(null);
    return c.json({ categories: tree });
  } catch (error: unknown) {
    console.error('Error fetching categories tree:', error);
    return c.json({ error: 'Failed to fetch categories tree' }, 500);
  }
});

// GET /categories/:idOrSlug — accepts UUID or slug
// GET /categories/:id/products
categoriesRouter.get('/:id/products', verifyAdminOrMcpService, async (c) => {
  const id = c.req.param('id');
  try {
    const rows = await db
      .select({
        id: products.id,
        title: products.title,
        handle: products.handle,
        thumbnail: products.thumbnail,
        status: products.status,
      })
      .from(product_categories)
      .innerJoin(products, eq(product_categories.product_id, products.id))
      .where(eq(product_categories.category_id, id))
      .orderBy(desc(products.created_at));

    return c.json({ products: rows });
  } catch (error: unknown) {
    console.error('Error fetching category products:', error);
    return c.json({ error: 'Failed to fetch category products' }, 500);
  }
});

// PUT /categories/:id/products
categoriesRouter.put(
  '/:id/products',
  verifyAdminOrMcpService,
  zValidator('json', ProductAssignmentSchema),
  async (c) => {
    const id = c.req.param('id');
    const { product_ids } = c.req.valid('json');

    try {
      await db.transaction(async (tx) => {
        await tx
          .delete(product_categories)
          .where(eq(product_categories.category_id, id));

        if (product_ids.length > 0) {
          await tx.insert(product_categories).values(
            product_ids.map((productId) => ({
              product_id: productId,
              category_id: id,
            }))
          );
        }
      });

      const category = await db.query.categories.findFirst({
        where: eq(categories.id, id),
      });

      await triggerStorefrontRevalidation({
        paths: [
          '/',
          '/products',
          '/collections',
          category?.slug ? `/categories/${category.slug}` : '/categories',
        ],
        tags: ['products', 'categories'],
      });

      return c.json({ success: true, product_ids });
    } catch (error: unknown) {
      console.error('Error updating category products:', error);
      return c.json({ error: 'Failed to update category products' }, 500);
    }
  }
);

categoriesRouter.get('/:id', async (c) => {
  const idOrSlug = c.req.param('id');
  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    const category = isUuid
      ? await db.query.categories.findFirst({ where: eq(categories.id, idOrSlug) })
      : await db.query.categories.findFirst({ where: eq(categories.slug, idOrSlug) });

    if (!category) {
      return c.json({ error: 'Category not found' }, 404);
    }

    // Include children
    const children = await db
      .select()
      .from(categories)
      .where(eq(categories.parent_id, category.id));

    return c.json({ category: { ...category, children } });
  } catch (error: unknown) {
    console.error('Error fetching category:', error);
    return c.json({ error: 'Failed to fetch category' }, 500);
  }
});

// POST /categories
categoriesRouter.post(
  '/',
  verifyAdminOrMcpService,
  zValidator('json', CategorySchema),
  async (c) => {
    const data = c.req.valid('json');
    try {
      const seoTitle = data.seo_title || `${data.name} — Handmade Indian Fashion | Odhvica`;
      const [newCategory] = await db
        .insert(categories)
        .values({
          name: data.name,
          slug: data.slug,
          description: data.description,
          parent_id: data.parent_id || null,
          image: data.image,
          is_active: data.is_active ?? true,
          display_order: data.display_order ?? 0,
          show_in_header: data.show_in_header ?? true,
          header_image_url: data.header_image_url || null,
          emoji: data.emoji || null,
          seo_title: seoTitle,
          seo_desc: data.seo_desc || null,
          og_image_url: data.og_image_url || null,
        })
        .returning();

      await triggerStorefrontRevalidation({
        paths: ['/', '/products', '/collections', `/categories/${newCategory.slug}`],
        tags: ['categories'],
      });

      return c.json({ category: newCategory }, 201);
    } catch (error: any) {
      return c.json(
        { error: error.message || 'Failed to create category' },
        500
      );
    }
  }
);

// PUT /categories/reorder - Bulk update display_order (must be before /:id)
const ReorderSchema = z.object({
  updates: z.array(
    z.object({
      id: z.string().uuid(),
      display_order: z.number().min(0),
      show_in_header: z.boolean().optional(),
    })
  ),
});

categoriesRouter.put(
  '/reorder',
  verifyAdminOrMcpService,
  zValidator('json', ReorderSchema),
  async (c) => {
    const data = c.req.valid('json');
    try {
      const updates = await Promise.all(
        data.updates.map((update) =>
          db
            .update(categories)
            .set({
              display_order: update.display_order,
              ...(update.show_in_header !== undefined
                ? { show_in_header: update.show_in_header }
                : {}),
              updated_at: new Date(),
            })
            .where(eq(categories.id, update.id))
            .returning()
        )
      );

      await triggerStorefrontRevalidation({
        paths: ['/', '/products', '/collections'],
        tags: ['categories'],
      });

      return c.json({ categories: updates.map((u) => u[0]) });
    } catch (error: any) {
      return c.json(
        { error: error.message || 'Failed to reorder categories' },
        500
      );
    }
  }
);

// PUT /categories/:id
categoriesRouter.put(
  '/:id',
  verifyAdminOrMcpService,
  zValidator('json', CategorySchema.partial()),
  async (c) => {
    const id = c.req.param('id');
    const data = c.req.valid('json');
    try {
      // Slug lock: block slug changes if products are assigned (only super_admin can override)
      if (data.slug) {
        const existing = await db.query.categories.findFirst({ where: eq(categories.id, id) });
        if (existing && existing.slug !== data.slug) {
          const [{ total }] = await db
            .select({ total: count() })
            .from(product_categories)
            .where(eq(product_categories.category_id, id));
          const payload = c.get('jwtPayload') as { role?: string } | undefined;
          if (total > 0 && payload?.role !== 'super_admin') {
            return c.json({ error: 'Slug cannot be changed while products are assigned. Contact a super_admin.' }, 403);
          }
        }
      }

      const [updatedCategory] = await db
        .update(categories)
        .set({
          ...data,
          updated_at: new Date(),
        })
        .where(eq(categories.id, id))
        .returning();

      await triggerStorefrontRevalidation({
        paths: ['/', '/products', '/collections', `/categories/${updatedCategory.slug}`],
        tags: ['categories'],
      });

      return c.json({ category: updatedCategory });
    } catch (error: any) {
      return c.json(
        { error: error.message || 'Failed to update category' },
        500
      );
    }
  }
);

// DELETE /categories/:id
categoriesRouter.delete('/:id', verifyAdminOrMcpService, async (c) => {
  const id = c.req.param('id');
  try {
    await db.delete(categories).where(eq(categories.id, id));
    await triggerStorefrontRevalidation({
      paths: ['/', '/products', '/collections'],
      tags: ['categories'],
    });
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message || 'Failed to delete category' }, 500);
  }
});

export default categoriesRouter;
