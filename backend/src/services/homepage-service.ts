import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNull,
  ne,
  or,
  sql,
} from 'drizzle-orm';
import { db } from '../db/client';
import {
  category_circles,
  collection_products,
  featured_products,
  hero_banners,
  homepage_categories,
  homepage_social_posts,
  line_items,
  orders,
  product_collections,
  product_variants,
  products,
  settings,
  trending_reels,
} from '../db/schema';
import { productService } from './product-service';
import { isCloudinaryUrl, isStorefrontHref } from '../utils/media-url';

export type HomepageSectionStatus = {
  status: 'ready' | 'empty' | 'error';
  count: number;
};

type HomepageSectionKey =
  | 'categoryCircles'
  | 'hero'
  | 'featuredCategories'
  | 'bestSellers'
  | 'newArrivals'
  | 'collectionSlider'
  | 'collections'
  | 'watchShop'
  | 'brandStory'
  | 'social'
  | 'newsletter';

export type HomepageSectionStatuses = Record<HomepageSectionKey, HomepageSectionStatus>;

const CAPTURED_PAYMENT_STATUS = 'captured';
const CANCELED_ORDER_STATUS = 'canceled';

export function isQualifyingBestSellerOrder(order: {
  payment_status: string | null;
  status: string | null;
}) {
  return (
    order.payment_status === CAPTURED_PAYMENT_STATUS &&
    order.status !== CANCELED_ORDER_STATUS
  );
}

export function compareBestSellerRows(
  left: { product_id: string; units_sold: number; latest_sale_at: Date },
  right: { product_id: string; units_sold: number; latest_sale_at: Date }
) {
  return (
    right.units_sold - left.units_sold ||
    right.latest_sale_at.getTime() - left.latest_sale_at.getTime() ||
    left.product_id.localeCompare(right.product_id)
  );
}

function statusFor(items: unknown[]): HomepageSectionStatus {
  return { status: items.length > 0 ? 'ready' : 'empty', count: items.length };
}

export function dedupeCampaignProductIds(
  productIds: string[],
  bestSellerIds: ReadonlySet<string>,
  limit = 3
) {
  return Array.from(new Set(productIds))
    .filter((id) => !bestSellerIds.has(id))
    .slice(0, limit);
}

function settingValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

const PLACEHOLDER_TITLE =
  /\b(test|testing|dummy|demo|sample|placeholder|lorem|hhj|asdf|abc|untitled)\b/i;

function isHomepageProductReady(
  product: any,
  options: { requirePrice?: boolean } = {}
) {
  const requirePrice = options.requirePrice !== false;
  const image =
    product?.thumbnail ||
    product?.images?.find((item: { url?: string }) => isCloudinaryUrl(item?.url))?.url;
  const hasPrice = product?.variants?.some((variant: any) =>
    variant?.prices?.some(
      (price: any) => Number.isFinite(price?.amount) && price.amount > 0
    )
  );
  return Boolean(
    product?.id &&
      product?.status === 'published' &&
      product?.title?.trim() &&
      !PLACEHOLDER_TITLE.test(product.title) &&
      isCloudinaryUrl(image) &&
      (!requirePrice || hasPrice)
  );
}

async function loadBestSellers(limit = 4) {
  const curatedProducts = await loadCuratedFeaturedProducts(['bestsellers'], limit);
  if (curatedProducts.length > 0) {
    return curatedProducts;
  }

  const rows = await db
    .select({
      product_id: products.id,
      units_sold: sql<number>`sum(${line_items.quantity})::int`,
      latest_sale_at: sql<Date>`max(${orders.created_at})`,
    })
    .from(line_items)
    .innerJoin(orders, eq(line_items.order_id, orders.id))
    .innerJoin(product_variants, eq(line_items.variant_id, product_variants.id))
    .innerJoin(products, eq(product_variants.product_id, products.id))
    .where(
      and(
        eq(orders.payment_status, CAPTURED_PAYMENT_STATUS),
        ne(orders.status, CANCELED_ORDER_STATUS),
        eq(products.status, 'published'),
        eq(products.is_wholesale_only, false)
      )
    )
    .groupBy(products.id)
    .orderBy(
      desc(sql`sum(${line_items.quantity})`),
      desc(sql`max(${orders.created_at})`),
      asc(products.id)
    )
    .limit(limit);

  const enriched = await productService.retrieveMany(rows.map((row) => row.product_id));
  const byId = new Map(
    enriched
      .filter((product) => isHomepageProductReady(product, { requirePrice: false }))
      .map((product) => [product.id, product])
  );

  return rows
    .map((row) => {
      const product = byId.get(row.product_id);
      return product ? { ...product, units_sold: Number(row.units_sold || 0) } : null;
    })
    .filter((product): product is NonNullable<typeof product> => Boolean(product));
}

async function loadNewArrivals(limit = 12) {
  const curatedProducts = await loadCuratedFeaturedProducts(['new_arrivals'], limit);
  if (curatedProducts.length > 0) {
    return curatedProducts;
  }

  const rows = await db
    .select({
      id: products.id,
    })
    .from(products)
    .where(
      and(
        eq(products.status, 'published'),
        eq(products.is_wholesale_only, false)
      )
    )
    .orderBy(desc(products.created_at))
    .limit(limit);

  const enriched = await productService.retrieveMany(rows.map((row) => row.id));
  return enriched.filter((product) => isHomepageProductReady(product, { requirePrice: false }));
}

async function loadCuratedFeaturedProducts(sectionKeys: string[], limit = 4) {
  const rows = await db
    .select()
    .from(featured_products)
    .where(
      and(
        inArray(featured_products.section_key, sectionKeys),
        eq(featured_products.is_active, true)
      )
    )
    .orderBy(
      asc(featured_products.section_key),
      asc(featured_products.sort_order),
      asc(featured_products.created_at)
    )
    .limit(limit * sectionKeys.length);

  const productIds = Array.from(new Set(rows.map((row) => row.product_id)));
  const enriched = await productService.retrieveMany(productIds);
  const byId = new Map(
    enriched
      .filter((product) => isHomepageProductReady(product, { requirePrice: false }))
      .map((product) => [product.id, product])
  );

  return rows
    .map((row) => byId.get(row.product_id))
    .filter((product): product is NonNullable<typeof product> => Boolean(product))
    .slice(0, limit);
}

async function loadCollections(bestSellerIds: ReadonlySet<string>) {
  const now = new Date().toISOString();
  let collections = await db
    .select()
    .from(product_collections)
    .where(
      and(
        eq(product_collections.status, 'active'),
        eq(product_collections.rule_type, 'manual'),
        or(
          eq(product_collections.homepage_section, 'collections'),
          eq(product_collections.homepage_section, 'curated_collections')
        ),
        isNull(product_collections.deleted_at),
        or(isNull(product_collections.valid_from), sql`${product_collections.valid_from} <= ${now}`),
        or(isNull(product_collections.valid_until), sql`${product_collections.valid_until} >= ${now}`)
      )
    )
    .orderBy(asc(product_collections.display_order), desc(product_collections.created_at))
    .limit(6);

  if (collections.length === 0) {
    collections = await db
      .select()
      .from(product_collections)
      .where(
        and(
          eq(product_collections.status, 'active'),
          eq(product_collections.rule_type, 'manual'),
          isNull(product_collections.deleted_at),
          or(isNull(product_collections.valid_from), sql`${product_collections.valid_from} <= ${now}`),
          or(isNull(product_collections.valid_until), sql`${product_collections.valid_until} >= ${now}`)
        )
      )
      .orderBy(asc(product_collections.display_order), desc(product_collections.created_at))
      .limit(6);
  }

  const collectionIds = collections.map((collection) => collection.id);
  let loadedCollections: any[] = [];

  if (collectionIds.length > 0) {
    try {
      console.log('loadCollections: collectionIds', collectionIds);
      const assignments = await db
        .select({
          collection_id: collection_products.collection_id,
        product_id: collection_products.product_id,
        position: collection_products.position,
      })
      .from(collection_products)
      .innerJoin(products, eq(collection_products.product_id, products.id))
      .where(
        and(
          inArray(collection_products.collection_id, collectionIds),
          eq(products.status, 'published'),
          eq(products.is_wholesale_only, false)
        )
      )
      .orderBy(asc(collection_products.collection_id), asc(collection_products.position));
      console.log('loadCollections: assignments length', assignments.length);

    const previewIdsByCollection = new Map<string, string[]>();
    for (const assignment of assignments) {
      const current = previewIdsByCollection.get(assignment.collection_id) || [];
      current.push(assignment.product_id);
      previewIdsByCollection.set(assignment.collection_id, current);
    }

    const previewIds = Array.from(
      new Set(
        collections.flatMap((collection) =>
          dedupeCampaignProductIds(
            previewIdsByCollection.get(collection.id) || [],
            bestSellerIds
          )
        )
      )
    );
    const previewProducts = await productService.retrieveMany(previewIds);
    const productById = new Map(
      previewProducts
        .filter((product) => isHomepageProductReady(product))
        .map((product) => [product.id, product])
    );

      loadedCollections = collections
        .map((collection) => {
          const products = dedupeCampaignProductIds(
            previewIdsByCollection.get(collection.id) || [],
            bestSellerIds
          )
            .map((id) => productById.get(id))
            .filter((product): product is NonNullable<typeof product> => Boolean(product));
          const image =
            collection.cover_image_url ||
            collection.image ||
            products.find((product) => isCloudinaryUrl(product.thumbnail))?.thumbnail ||
            products
              .flatMap((product) => product.images || [])
              .find((image) => isCloudinaryUrl(image.url))?.url ||
            null;
  
          return {
            id: collection.id,
            title: collection.title,
            handle: collection.handle,
            description: collection.description,
            image: image || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800', // Fallback image if none
            products,
          };
        })
        .filter((collection) => collection.products.length > 0);
    } catch (e) {
      console.error('Error loading collections mapping:', e);
      loadedCollections = [];
    }
  }

  if (loadedCollections.length < 2) {
    const allPublishedProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          eq(products.status, 'published'),
          eq(products.is_wholesale_only, false)
        )
      )
      .limit(20);

    const publishedIds = allPublishedProducts.map((p) => p.id);
    const enriched = await productService.retrieveMany(publishedIds);
    const validProducts = enriched.filter((p) => isHomepageProductReady(p));

    const fallbackCampaigns = [
      { title: 'The Indigo Edit', handle: 'indigo-edit', keyword: 'indigo' },
      { title: 'Summer in Jaipur', handle: 'summer-jaipur', keyword: 'cotton' },
    ];

    const generated = fallbackCampaigns.map((item, index) => {
      let filtered = validProducts.filter((p) => 
        p.title.toLowerCase().includes(item.keyword) || 
        p.description?.toLowerCase().includes(item.keyword)
      );
      if (filtered.length < 3) {
        filtered = validProducts.slice(index * 4 + 2, (index + 1) * 4 + 2);
      }
      if (filtered.length === 0) {
        filtered = validProducts.slice(0, 4);
      }
      const image = filtered[0]?.thumbnail || '';
      return {
        id: `fallback-campaign-col-${item.handle}`,
        title: item.title,
        handle: item.handle,
        description: `A study in handcrafted designs and beautiful colors.`,
        image,
        products: filtered.slice(0, 3),
      };
    }).filter(c => c.products.length > 0 && isCloudinaryUrl(c.image));

    const combined = [...loadedCollections];
    for (const gen of generated) {
      if (combined.length >= 2) break;
      if (!combined.some((c) => c.handle === gen.handle)) {
        combined.push(gen);
      }
    }
    return combined;
  }

  return loadedCollections;
}

async function loadCollectionSlider(bestSellerIds: ReadonlySet<string>) {
  const now = new Date().toISOString();
  let collections = await db
    .select()
    .from(product_collections)
    .where(
      and(
        eq(product_collections.status, 'active'),
        eq(product_collections.rule_type, 'manual'),
        eq(product_collections.homepage_section, 'collection_slider'),
        isNull(product_collections.deleted_at),
        or(isNull(product_collections.valid_from), sql`${product_collections.valid_from} <= ${now}`),
        or(isNull(product_collections.valid_until), sql`${product_collections.valid_until} >= ${now}`)
      )
    )
    .orderBy(asc(product_collections.display_order), desc(product_collections.created_at))
    .limit(4);

  if (collections.length === 0) {
    collections = await db
      .select()
      .from(product_collections)
      .where(
        and(
          eq(product_collections.status, 'active'),
          eq(product_collections.rule_type, 'manual'),
          ne(product_collections.homepage_section, 'collections'),
          isNull(product_collections.deleted_at),
          or(isNull(product_collections.valid_from), sql`${product_collections.valid_from} <= ${now}`),
          or(isNull(product_collections.valid_until), sql`${product_collections.valid_until} >= ${now}`)
        )
      )
      .orderBy(asc(product_collections.display_order), desc(product_collections.created_at))
      .limit(4);
  }

  const collectionIds = collections.map((collection) => collection.id);
  let loadedCollections: any[] = [];
  
  if (collectionIds.length > 0) {
    console.log('loadCollectionSlider: collectionIds', collectionIds);
    const assignments = await db
      .select({
        collection_id: collection_products.collection_id,
        product_id: collection_products.product_id,
        position: collection_products.position,
      })
      .from(collection_products)
      .innerJoin(products, eq(collection_products.product_id, products.id))
      .where(
        and(
          inArray(collection_products.collection_id, collectionIds),
          eq(products.status, 'published'),
          eq(products.is_wholesale_only, false)
        )
      )
      .orderBy(asc(collection_products.collection_id), asc(collection_products.position));
    console.log('loadCollectionSlider: assignments length', assignments.length);

    const previewIdsByCollection = new Map<string, string[]>();
    for (const assignment of assignments) {
      const current = previewIdsByCollection.get(assignment.collection_id) || [];
      current.push(assignment.product_id);
      previewIdsByCollection.set(assignment.collection_id, current);
    }

    const previewIds = Array.from(
      new Set(
        collections.flatMap((collection) =>
          dedupeCampaignProductIds(
            previewIdsByCollection.get(collection.id) || [],
            bestSellerIds
          )
        )
      )
    );
    const previewProducts = await productService.retrieveMany(previewIds);
    const productById = new Map(
      previewProducts
        .filter((product) => isHomepageProductReady(product))
        .map((product) => [product.id, product])
    );

    try {
      loadedCollections = collections
        .map((collection) => {
          const products = dedupeCampaignProductIds(
            previewIdsByCollection.get(collection.id) || [],
            bestSellerIds
          )
            .map((id) => productById.get(id))
            .filter((product): product is NonNullable<typeof product> => Boolean(product));
          const image =
            collection.cover_image_url ||
            collection.image ||
            products.find((product) => isCloudinaryUrl(product.thumbnail))?.thumbnail ||
            products
              .flatMap((product) => product.images || [])
              .find((image) => isCloudinaryUrl(image.url))?.url ||
            null;
  
          return {
            id: collection.id,
            title: collection.title,
            handle: collection.handle,
            description: collection.description,
            image: image || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800', // Fallback image if none
            products,
          };
        })
        .filter((collection) => collection.products.length > 0);
    } catch (e) {
      console.error('Error loading collection slider mapping:', e);
      loadedCollections = [];
    }
  }

  if (loadedCollections.length < 4) {
    const allPublishedProducts = await db
      .select({ id: products.id })
      .from(products)
      .where(
        and(
          eq(products.status, 'published'),
          eq(products.is_wholesale_only, false)
        )
      )
      .limit(20);

    const publishedIds = allPublishedProducts.map((p) => p.id);
    const enriched = await productService.retrieveMany(publishedIds);
    const validProducts = enriched.filter((p) => isHomepageProductReady(p));

    const fallbackTitles = [
      { title: 'Travel Edit', handle: 'travel-edit', keyword: 'bag' },
      { title: 'One Of Kind', handle: 'one-of-kind', keyword: 'jacket' },
      { title: 'Artisan Favorites', handle: 'artisan-favorites', keyword: 'shawl' },
      { title: 'Heritage Collection', handle: 'heritage-collection', keyword: 'saree' },
    ];

    const generatedCollections = fallbackTitles.map((item, index) => {
      let filtered = validProducts.filter((p) => 
        p.title.toLowerCase().includes(item.keyword) || 
        p.description?.toLowerCase().includes(item.keyword)
      );
      if (filtered.length < 3) {
        filtered = validProducts.slice(index * 4, (index + 1) * 4);
      }
      if (filtered.length === 0) {
        filtered = validProducts.slice(0, 4);
      }
      
      const image = filtered[0]?.thumbnail || '';
      
      return {
        id: `fallback-slider-col-${item.handle}`,
        title: item.title,
        handle: item.handle,
        description: `Handcrafted ${item.title} selection`,
        image,
        products: filtered.slice(0, 4),
      };
    }).filter(c => c.products.length > 0 && isCloudinaryUrl(c.image));

    const combined = [...loadedCollections];
    for (const gen of generatedCollections) {
      if (combined.length >= 4) break;
      if (!combined.some((c) => c.handle === gen.handle)) {
        combined.push(gen);
      }
    }
    return combined;
  }

  return loadedCollections.slice(0, 4);
}

async function loadWatchShop() {
  const reels = await db
    .select()
    .from(trending_reels)
    .where(eq(trending_reels.is_active, true))
    .orderBy(asc(trending_reels.sort_order), asc(trending_reels.created_at))
    .limit(6);
  const validReels = reels.filter(
    (reel) =>
      isCloudinaryUrl(reel.video_url) &&
      isCloudinaryUrl(reel.thumbnail_url) &&
      isStorefrontHref(reel.link_url)
  );
  const productsForReels = await productService.retrieveMany(
    validReels
      .map((reel) => reel.product_id)
      .filter((id): id is string => Boolean(id))
  );
  const productById = new Map(
    productsForReels
      .filter((product) => isHomepageProductReady(product))
      .map((product) => [product.id, product])
  );

  return validReels
    .map((reel) => {
      const product = reel.product_id ? productById.get(reel.product_id) : null;
      const fallbackProduct = product || createReelProductFallback(reel);
      return {
        id: reel.id,
        video_url: reel.video_url,
        thumbnail_url: reel.thumbnail_url,
        caption: reel.caption,
        sort_order: reel.sort_order,
        link_url: reel.link_url,
        product: fallbackProduct,
      };
    })
    .filter((reel): reel is NonNullable<typeof reel> => Boolean(reel));
}

function createReelProductFallback(reel: typeof trending_reels.$inferSelect) {
  const priceAmount =
    Number.isFinite(reel.price_amount) && Number(reel.price_amount) > 0
      ? Number(reel.price_amount)
      : parseReelPriceAmount(reel.price);
  const handle = productHandleFromHref(reel.link_url) || reel.id;

  return {
    id: reel.product_id || reel.id,
    title: reel.product_name,
    description: reel.caption || '',
    handle,
    thumbnail: reel.thumbnail_url,
    status: 'published' as const,
    images: [
      {
        id: `${reel.id}-thumbnail`,
        url: reel.thumbnail_url,
        alt_text: reel.product_name,
        position: 0,
        is_thumbnail: true,
      },
    ],
    variants: priceAmount
      ? [
          {
            id: `${reel.id}-variant`,
            title: 'Default Variant',
            inventory_quantity: 1,
            prices: [
              {
                id: `${reel.id}-price`,
                currency_code: 'inr',
                amount: priceAmount,
              },
            ],
          },
        ]
      : [],
    created_at: reel.created_at,
  };
}

function parseReelPriceAmount(value: string | null) {
  if (!value) return null;
  const parsed = Number.parseFloat(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : null;
}

function productHandleFromHref(value: string | null) {
  if (!value) return null;
  try {
    const url = value.startsWith('http')
      ? new URL(value)
      : new URL(value, 'https://odhvica.com');
    const segments = url.pathname.split('/').filter(Boolean);
    const productIndex = segments.indexOf('products');
    return productIndex >= 0 ? segments[productIndex + 1] || null : null;
  } catch {
    return null;
  }
}

export class HomepageService {
  async getHomepage() {
    const statuses = {} as HomepageSectionStatuses;

    const [circlesResult, heroResult, categoriesResult, settingsResult, socialResult] =
      await Promise.allSettled([
        db
          .select()
          .from(category_circles)
          .where(eq(category_circles.is_active, true))
          .orderBy(asc(category_circles.sort_order), asc(category_circles.created_at))
          .limit(10),
        db
          .select()
          .from(hero_banners)
          .where(eq(hero_banners.is_active, true))
          .orderBy(asc(hero_banners.sort_order), asc(hero_banners.created_at))
          .limit(4),
        db
          .select()
          .from(homepage_categories)
          .where(eq(homepage_categories.is_active, true))
          .orderBy(asc(homepage_categories.sort_order), asc(homepage_categories.created_at))
          .limit(4),
        db.select().from(settings).where(eq(settings.category, 'homepage')),
        db
          .select()
          .from(homepage_social_posts)
          .where(eq(homepage_social_posts.is_active, true))
          .orderBy(
            asc(homepage_social_posts.sort_order),
            asc(homepage_social_posts.created_at)
          )
          .limit(8),
      ]);

    let categoryCircles =
      circlesResult.status === 'fulfilled'
        ? circlesResult.value.filter(
            (item) => isCloudinaryUrl(item.image_url) && isStorefrontHref(item.link_url)
          )
        : [];

    const hero =
      heroResult.status === 'fulfilled'
        ? heroResult.value.filter((item) => isCloudinaryUrl(item.image_url)).map((item) => ({
            ...item,
            title: item.title?.trim() || 'Odhvica',
            button_text: item.button_text?.trim() || 'Shop Now',
            button_link: isStorefrontHref(item.button_link) ? item.button_link : '/products',
            mobile_image_url: isCloudinaryUrl(item.mobile_image_url)
              ? item.mobile_image_url
              : null,
          }))
        : [];
    statuses.hero =
      heroResult.status === 'rejected'
        ? { status: 'error', count: 0 }
        : { status: hero.length === 4 ? 'ready' : 'empty', count: hero.length };

    const featuredCategories =
      categoriesResult.status === 'fulfilled'
        ? categoriesResult.value.filter(
            (item) => isCloudinaryUrl(item.image_url) && isStorefrontHref(item.link_url)
          )
        : [];
    statuses.featuredCategories =
      categoriesResult.status === 'rejected'
        ? { status: 'error', count: 0 }
        : {
            status: featuredCategories.length === 4 ? 'ready' : 'empty',
            count: featuredCategories.length,
          };
    if (categoryCircles.length === 0) {
      categoryCircles = featuredCategories.slice(0, 10).map((category) => ({
        id: `featured-category-circle-${category.id}`,
        category_id: category.category_id,
        label: category.name,
        link_url: category.link_url,
        image_url: category.image_url,
        sort_order: category.sort_order,
        is_active: category.is_active,
        created_at: category.created_at,
      }));
    }
    statuses.categoryCircles =
      circlesResult.status === 'rejected' && categoryCircles.length === 0
        ? { status: 'error', count: 0 }
        : statusFor(categoryCircles);

    let bestSellers: Awaited<ReturnType<typeof loadBestSellers>> = [];
    try {
      bestSellers = await loadBestSellers();
      statuses.bestSellers = statusFor(bestSellers);
    } catch (error) {
      console.error('[Homepage] best sellers failed:', error);
      statuses.bestSellers = { status: 'error', count: 0 };
    }

    let newArrivals: Awaited<ReturnType<typeof loadNewArrivals>> = [];
    try {
      newArrivals = await loadNewArrivals();
      statuses.newArrivals = statusFor(newArrivals);
    } catch (error) {
      console.error('[Homepage] new arrivals failed:', error);
      statuses.newArrivals = { status: 'error', count: 0 };
    }

    let collections: Awaited<ReturnType<typeof loadCollections>> = [];
    try {
      collections = await loadCollections(new Set(bestSellers.map((product) => product.id)));
      statuses.collections = statusFor(collections);
    } catch (error) {
      console.error('[Homepage] collections failed:', error);
      statuses.collections = { status: 'error', count: 0 };
    }

    let collectionSlider: Awaited<ReturnType<typeof loadCollectionSlider>> = [];
    try {
      collectionSlider = await loadCollectionSlider(new Set(bestSellers.map((product) => product.id)));
      statuses.collectionSlider = statusFor(collectionSlider);
    } catch (error) {
      console.error('[Homepage] collection slider failed:', error);
      statuses.collectionSlider = { status: 'error', count: 0 };
    }

    let watchShop: Awaited<ReturnType<typeof loadWatchShop>> = [];
    try {
      watchShop = await loadWatchShop();
      statuses.watchShop = statusFor(watchShop);
    } catch (error) {
      console.error('[Homepage] watch shop failed:', error);
      statuses.watchShop = { status: 'error', count: 0 };
    }

    const settingsMap =
      settingsResult.status === 'fulfilled'
        ? Object.fromEntries(settingsResult.value.map((item) => [item.key, item.value]))
        : {};

    const brandStoryImage = settingValue(settingsMap.brand_story_image);
    const brandStoryTitle = settingValue(settingsMap.brand_story_title);
    const brandStoryContent = settingValue(settingsMap.brand_story_content);
    const fallbackBrandStoryImage =
      hero[0]?.image_url || featuredCategories[0]?.image_url || watchShop[0]?.thumbnail_url;
    const brandStory =
      brandStoryImage &&
      isCloudinaryUrl(brandStoryImage) &&
      brandStoryTitle &&
      brandStoryContent
        ? {
            title: brandStoryTitle,
            content: brandStoryContent,
            image_url: brandStoryImage,
          }
        : fallbackBrandStoryImage
          ? {
              title:
                brandStoryTitle ||
                settingValue(settingsMap.hero_title) ||
                'Crafted slowly, worn beautifully',
              content:
                brandStoryContent ||
                settingValue(settingsMap.hero_subtitle) ||
                'Odhvica brings Jaipur-rooted textile craft into modern wardrobes through considered silhouettes, handmade details, and small-batch edits.',
              image_url: fallbackBrandStoryImage,
            }
        : null;
    statuses.brandStory =
      settingsResult.status === 'rejected'
        ? { status: 'error', count: 0 }
        : statusFor(brandStory ? [brandStory] : []);

    const newsletter = {
      title: settingValue(settingsMap.newsletter_title) || 'Join The Odhvica Circle',
      subtitle:
        settingValue(settingsMap.newsletter_subtitle) ||
        'Craft stories, considered launches, and notes from Jaipur.',
    };
    statuses.newsletter =
      settingsResult.status === 'rejected'
        ? { status: 'error', count: 0 }
        : statusFor(newsletter ? [newsletter] : []);

    let social =
      socialResult.status === 'fulfilled'
        ? socialResult.value.filter(
            (item) =>
              isCloudinaryUrl(item.image_url) &&
              isStorefrontHref(item.destination_url)
          )
        : [];
    if (social.length === 0) {
      social = watchShop.slice(0, 8).map((reel, index) => ({
        id: `watch-social-${reel.id}`,
        image_url: reel.thumbnail_url,
        alt_text: `${reel.product.title} on Odhvica`,
        caption: reel.caption || reel.product.title,
        destination_url: reel.link_url || '/reels',
        is_active: true,
        sort_order: index,
        created_at: new Date(),
        updated_at: new Date(),
      }));
    }
    statuses.social =
      socialResult.status === 'rejected'
        ? { status: 'error', count: 0 }
        : statusFor(social);

    return {
      generated_at: new Date().toISOString(),
      status: statuses,
      category_circles: categoryCircles,
      hero,
      featured_categories: featuredCategories,
      best_sellers: bestSellers,
      new_arrivals: newArrivals,
      collection_slider: collectionSlider,
      collections,
      watch_shop: watchShop,
      brand_story: brandStory,
      social,
      newsletter,
    };
  }
}

export const homepageService = new HomepageService();
