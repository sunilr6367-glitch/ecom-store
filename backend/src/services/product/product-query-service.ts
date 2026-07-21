/**
 * Product Query Service
 * Handles all read operations for products
 */

import { db } from '../../db/client';
import {
  products,
  product_variants,
  product_options,
  product_option_values,
  money_amounts,
  product_images,
  product_categories,
  collection_products,
  product_tags,
  product_seo,
  product_discovery,
  product_attributes,
  attribute_values,
  product_attribute_values,
  product_variant_merchant,
  product_media_seo,
  product_embeddings,
  product_artisans,
  artisans,
  search_synonyms,
  search_query_logs,
} from '../../db/schema';
import { eq, desc, asc, sql, or, and, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { escapeLikeWildcards } from '../../utils/validation';
import { embedText, toVectorLiteral } from '../../jobs/generateEmbeddings';
import type { ProductFilter, ProductSearch } from './product-validator';

// --- Types for merged data ---
interface VariantStats {
  product_id: string;
  variant_count: number;
  total_inventory: number;
}

interface ProductWithStats {
  id: string;
  title: string;
  handle: string;
  description: string | null;
  collection_id: string | null;
  size_guide: string | null;
  care_instructions: string | null;
  price_type: string;
  seo_title: string | null;
  seo_description: string | null;
  status: string;
  thumbnail: string | null;
  created_at: Date;
  updated_at: Date | null;
  variant_count: number;
  total_inventory: number;
  images: (typeof product_images.$inferSelect)[];
  seo?: typeof product_seo.$inferSelect | null;
  discovery?: typeof product_discovery.$inferSelect | null;
  attributes?: unknown[];
  media_seo?: unknown[];
  semantic_related_products?: unknown[];
  variants: Array<{
    id: string;
    title: string;
    sku: string | null;
    inventory_quantity: number;
    prices: Array<{
      id: string;
      amount: number;
      currency_code: string;
    }>;
    merchant?: typeof product_variant_merchant.$inferSelect | null;
  }>;
}

export class ProductQueryService {
  /**
   * Build filter conditions for product queries
   */
  private async buildFilterConditions(filters: {
    status?: string;
    categoryId?: string;
    tagId?: string;
    collectionId?: string;
    attributeCode?: string;
    attributeValue?: string;
  }): Promise<ReturnType<typeof eq>[]> {
    const conditions: ReturnType<typeof eq>[] = [];

    if (filters.status) {
      conditions.push(eq(products.status, filters.status));
    }

    // Collection Filter
    if (filters.collectionId) {
      const collectionMatches = await db
        .select({ product_id: collection_products.product_id })
        .from(collection_products)
        .where(eq(collection_products.collection_id, filters.collectionId));

      if (collectionMatches.length === 0) {
        conditions.push(eq(products.collection_id, filters.collectionId));
      } else {
        conditions.push(
          or(
            eq(products.collection_id, filters.collectionId),
            inArray(
              products.id,
              collectionMatches.map((item) => item.product_id)
            )
          ) as ReturnType<typeof eq>
        );
      }
    }

    // Category Filter
    if (filters.categoryId) {
      const catMatches = await db
        .select({ product_id: product_categories.product_id })
        .from(product_categories)
        .where(eq(product_categories.category_id, filters.categoryId));

      if (catMatches.length === 0) {
        // No products in this category — return a never-true condition
        conditions.push(sql`FALSE`);
      } else {
        conditions.push(
          inArray(
            products.id,
            catMatches.map((c) => c.product_id)
          )
        );
      }
    }

    // Tag Filter
    if (filters.tagId) {
      const tagMatches = await db
        .select({ product_id: product_tags.product_id })
        .from(product_tags)
        .where(eq(product_tags.tag_id, filters.tagId));

      if (tagMatches.length === 0) {
        // No products with this tag — return a never-true condition
        conditions.push(sql`FALSE`);
      } else {
        conditions.push(
          inArray(
            products.id,
            tagMatches.map((t) => t.product_id)
          )
        );
      }
    }

    if (filters.attributeCode && filters.attributeValue) {
      const attrMatches = await db
        .select({ product_id: product_attribute_values.product_id })
        .from(product_attribute_values)
        .leftJoin(product_attributes, eq(product_attribute_values.attribute_id, product_attributes.id))
        .leftJoin(attribute_values, eq(product_attribute_values.value_id, attribute_values.id))
        .where(
          and(
            eq(product_attributes.code, filters.attributeCode),
            or(
              eq(attribute_values.slug, filters.attributeValue),
              eq(attribute_values.label, filters.attributeValue),
              sql`lower(coalesce(${product_attribute_values.raw_value}, '')) = ${filters.attributeValue.toLowerCase()}`
            )
          )
        );

      if (attrMatches.length === 0) {
        conditions.push(sql`FALSE`);
      } else {
        conditions.push(
          inArray(
            products.id,
            attrMatches.map((match) => match.product_id)
          )
        );
      }
    }

    return conditions;
  }

  /**
   * Fetch variant statistics for products
   */
  private async fetchVariantStats(
    productIds: string[]
  ): Promise<VariantStats[]> {
    if (productIds.length === 0) return [];

    return await db
      .select({
        product_id: product_variants.product_id,
        variant_count: sql<number>`count(*)`,
        total_inventory: sql<number>`sum(${product_variants.inventory_quantity})`,
      })
      .from(product_variants)
      .where(inArray(product_variants.product_id, productIds))
      .groupBy(product_variants.product_id);
  }

  /**
   * Fetch full variant details with prices for products
   */
  private async fetchVariantDetails(
    productIds: string[]
  ): Promise<
    Record<
      string,
      Array<{
        id: string;
        title: string;
        sku: string | null;
        inventory_quantity: number;
        prices: Array<{
          id: string;
          amount: number;
          currency_code: string;
        }>;
      }>
    >
  > {
    if (productIds.length === 0) return {};

    const variants = await db.query.product_variants.findMany({
      where: inArray(product_variants.product_id, productIds),
      with: {
        prices: {
          columns: {
            id: true,
            amount: true,
            currency_code: true,
          },
        },
      },
    });

    // Group variants by product_id
    const variantsByProduct: Record<
      string,
      Array<{
        id: string;
        title: string;
        sku: string | null;
        inventory_quantity: number;
        prices: Array<{
          id: string;
          amount: number;
          currency_code: string;
        }>;
      }>
    > = {};

    variants.forEach((variant) => {
      if (!variantsByProduct[variant.product_id]) {
        variantsByProduct[variant.product_id] = [];
      }
      variantsByProduct[variant.product_id].push({
        id: variant.id,
        title: variant.title,
        sku: variant.sku,
        inventory_quantity: variant.inventory_quantity ?? 0,
        prices: variant.prices as Array<{
          id: string;
          amount: number;
          currency_code: string;
        }>,
      });
    });

    return variantsByProduct;
  }

  /**
   * Fetch images for products
   */
  private async fetchProductImages(
    productIds: string[]
  ): Promise<(typeof product_images.$inferSelect)[]> {
    if (productIds.length === 0) return [];

    return await db
      .select()
      .from(product_images)
      .where(inArray(product_images.product_id, productIds));
  }

  /**
   * Merge product data with variant stats and images
   */
  private mergeProductData(
    productsList: Array<Record<string, unknown>>,
    variantData: VariantStats[],
    imagesData: (typeof product_images.$inferSelect)[],
    variantDetails?: Record<
      string,
      Array<{
        id: string;
        title: string;
        sku: string | null;
        inventory_quantity: number;
        prices: Array<{
          id: string;
          amount: number;
          currency_code: string;
        }>;
      }>
    >
  ): ProductWithStats[] {
    return productsList.map((product) => {
      const stats = variantData.find((v) => v.product_id === product.id);
      const pImages = imagesData.filter((img) => img.product_id === product.id);
      const pVariants = variantDetails?.[product.id as string] || [];
      return {
        id: String(product.id),
        title: String(product.title),
        handle: String(product.handle),
        description: product.description as string | null,
        collection_id: product.collection_id as string | null,
        size_guide: product.size_guide as string | null,
        care_instructions: product.care_instructions as string | null,
        price_type: (product.price_type as string) || 'fixed',
        seo_title: product.seo_title as string | null,
        seo_description: product.seo_description as string | null,
        status: String(product.status),
        thumbnail: product.thumbnail as string | null,
        created_at: product.created_at as Date,
        updated_at: product.updated_at as Date | null,
        variant_count: stats?.variant_count || 0,
        total_inventory: stats?.total_inventory || 0,
        images: pImages,
        variants: pVariants,
      };
    });
  }

  private async enrichProducts<T extends { id: string; collection_id?: string | null; images?: any[]; variants?: any[] }>(
    productsList: T[],
    includeRelatedProducts = true
  ): Promise<T[]> {
    if (productsList.length === 0) return productsList;

    const productIds = productsList.map((product) => product.id);
    const imageIds = productsList.flatMap((product) => product.images?.map((image) => image.id) || []);
    const variantIds = productsList.flatMap((product) => product.variants?.map((variant) => variant.id) || []);

    const [seoRows, discoveryRows, attributeRows, merchantRows, mediaRows, artisanRows, collectionRows] = await Promise.all([
      db.select().from(product_seo).where(inArray(product_seo.product_id, productIds)),
      db.select().from(product_discovery).where(inArray(product_discovery.product_id, productIds)),
      db
        .select({
          id: product_attribute_values.id,
          product_id: product_attribute_values.product_id,
          attribute_id: product_attribute_values.attribute_id,
          value_id: product_attribute_values.value_id,
          raw_value: product_attribute_values.raw_value,
          source: product_attribute_values.source,
          confidence: product_attribute_values.confidence,
          attribute_code: product_attributes.code,
          attribute_label: product_attributes.label,
          value_label: attribute_values.label,
          value_slug: attribute_values.slug,
          synonyms: attribute_values.synonyms,
        })
        .from(product_attribute_values)
        .leftJoin(product_attributes, eq(product_attribute_values.attribute_id, product_attributes.id))
        .leftJoin(attribute_values, eq(product_attribute_values.value_id, attribute_values.id))
        .where(inArray(product_attribute_values.product_id, productIds)),
      variantIds.length
        ? db.select().from(product_variant_merchant).where(inArray(product_variant_merchant.variant_id, variantIds))
        : Promise.resolve([]),
      imageIds.length
        ? db.select().from(product_media_seo).where(inArray(product_media_seo.image_id, imageIds))
        : Promise.resolve([]),
      db
        .select({
          product_id: product_artisans.product_id,
          id: artisans.id,
          name: artisans.name,
          slug: artisans.slug,
          craft_specialty: artisans.craft_specialty,
          location: artisans.location,
        })
        .from(product_artisans)
        .leftJoin(artisans, eq(product_artisans.artisan_id, artisans.id))
        .where(inArray(product_artisans.product_id, productIds)),
      db
        .select({
          product_id: collection_products.product_id,
          collection_id: collection_products.collection_id,
        })
        .from(collection_products)
        .where(inArray(collection_products.product_id, productIds)),
    ]);

    const seoByProduct = new Map(seoRows.map((row) => [row.product_id, row]));
    const discoveryByProduct = new Map(discoveryRows.map((row) => [row.product_id, row]));
    const merchantByVariant = new Map(merchantRows.map((row) => [row.variant_id, row]));
    const mediaByImage = new Map(mediaRows.map((row) => [row.image_id, row]));
    const artisanByProduct = new Map(artisanRows.map((row) => [row.product_id, row]));
    const collectionByProduct = new Map(collectionRows.map((row) => [row.product_id, row.collection_id]));
    const attrsByProduct = new Map<string, typeof attributeRows>();

    for (const row of attributeRows) {
      const rows = attrsByProduct.get(row.product_id) || [];
      rows.push(row);
      attrsByProduct.set(row.product_id, rows);
    }

    const relatedByProduct = includeRelatedProducts
      ? await this.fetchSemanticRelatedProducts(productsList, attrsByProduct)
      : new Map<string, unknown[]>();

    return productsList.map((product) => ({
      ...product,
      collection_id: product.collection_id || collectionByProduct.get(product.id) || null,
      seo: seoByProduct.get(product.id) || null,
      discovery: discoveryByProduct.get(product.id) || null,
      attributes: attrsByProduct.get(product.id) || [],
      media_seo: product.images?.map((image) => mediaByImage.get(image.id)).filter(Boolean) || [],
      artisan: artisanByProduct.get(product.id) || null,
      semantic_related_products: relatedByProduct.get(product.id) || [],
      images: product.images?.map((image) => {
        const mediaSeo = mediaByImage.get(image.id);
        return mediaSeo
          ? {
              ...image,
              alt_text: mediaSeo.alt_text || image.alt_text,
              media_seo: mediaSeo,
            }
          : image;
      }),
      variants: product.variants?.map((variant) => ({
        ...variant,
        merchant: merchantByVariant.get(variant.id) || null,
      })),
    })) as T[];
  }

  private async fetchSemanticRelatedProducts<T extends { id: string }>(
    productsList: T[],
    attrsByProduct: Map<string, Array<{ value_id: string | null; raw_value: string | null; attribute_code: string | null }>>
  ) {
    const relatedByProduct = new Map<string, unknown[]>();
    if (productsList.length === 0) return relatedByProduct;

    for (const product of productsList.slice(0, 20)) {
      const attrs = attrsByProduct.get(product.id) || [];
      const valueIds = attrs
        .map((attr) => attr.value_id)
        .filter((valueId): valueId is string => Boolean(valueId));
      const rawValues = attrs
        .map((attr) => attr.raw_value?.trim().toLowerCase())
        .filter((value): value is string => Boolean(value));

      if (valueIds.length === 0 && rawValues.length === 0) {
        relatedByProduct.set(product.id, []);
        continue;
      }

      const matchedByValue = valueIds.length
        ? await db
            .select({
              product_id: product_attribute_values.product_id,
              matches: sql<number>`count(*)`,
            })
            .from(product_attribute_values)
            .where(
              and(
                inArray(product_attribute_values.value_id, valueIds),
                sql`${product_attribute_values.product_id} <> ${product.id}`
              )
            )
            .groupBy(product_attribute_values.product_id)
        : [];

      const matchedByRaw = rawValues.length
        ? await db
            .select({
              product_id: product_attribute_values.product_id,
              matches: sql<number>`count(*)`,
            })
            .from(product_attribute_values)
            .where(
              and(
                inArray(sql<string>`lower(coalesce(${product_attribute_values.raw_value}, ''))`, rawValues),
                sql`${product_attribute_values.product_id} <> ${product.id}`
              )
            )
            .groupBy(product_attribute_values.product_id)
        : [];

      const scores = new Map<string, number>();
      for (const row of [...matchedByValue, ...matchedByRaw]) {
        scores.set(row.product_id, (scores.get(row.product_id) || 0) + Number(row.matches || 0));
      }

      const candidateIds = Array.from(scores.entries())
        .sort((left, right) => right[1] - left[1])
        .map(([productId]) => productId)
        .slice(0, 8);

      if (candidateIds.length === 0) {
        relatedByProduct.set(product.id, []);
        continue;
      }

      const candidates = await db.query.products.findMany({
        where: and(inArray(products.id, candidateIds), eq(products.status, 'published')),
        with: {
          variants: { with: { prices: true } },
          collection: true,
          images: true,
          categories: { with: { category: true } },
          tags: { with: { tag: true } },
        },
      });

      const orderedCandidates = candidateIds
        .map((candidateId) => candidates.find((candidate) => candidate.id === candidateId))
        .filter((candidate): candidate is (typeof candidates)[number] => Boolean(candidate))
        .slice(0, 4);
      relatedByProduct.set(product.id, await this.enrichProducts(orderedCandidates, false));
    }

    return relatedByProduct;
  }

  /**
   * List products with advanced filtering and stats
   */
  async listDetailed(filters: ProductFilter) {
    const { limit = 20, offset = 0, sort = 'created_at' } = filters;
    const limitNum = Math.min(Math.max(limit, 1), 100);
    const offsetNum = Math.max(offset, 0);

    // Build filter conditions
    const conditions = await this.buildFilterConditions({
      status: filters.status,
      categoryId: filters.categoryId,
      tagId: filters.tagId,
      collectionId: filters.collectionId,
      attributeCode: filters.attributeCode,
      attributeValue: filters.attributeValue,
    });

    let totalCount = 0;

    // Early return if no products match filters
    if (conditions.length > 0) {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(and(...conditions));

      totalCount = Number(count);

      if (totalCount === 0) {
        return { products: [], total: 0, limit: limitNum, offset: offsetNum };
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Build orderBy clause based on sort parameter
    let orderByClause;
    switch (sort) {
      case 'price_asc':
        // Note: This would require joining with variants/prices tables
        // For now, fallback to created_at
        orderByClause = desc(products.created_at);
        break;
      case 'price_desc':
        orderByClause = desc(products.created_at);
        break;
      case 'newest':
      case 'created_at':
      default:
        orderByClause = desc(products.created_at);
    }

    // Fetch products
    const productsList = await db
      .select({
        id: products.id,
        title: products.title,
        handle: products.handle,
        description: products.description,
        collection_id: products.collection_id,
        size_guide: products.size_guide,
        care_instructions: products.care_instructions,
        price_type: products.price_type,
        seo_title: products.seo_title,
        seo_description: products.seo_description,
        status: products.status,
        thumbnail: products.thumbnail,
        created_at: products.created_at,
        updated_at: products.updated_at,
      })
      .from(products)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(limitNum)
      .offset(offsetNum);

    // Fetch related data
    const productIds = productsList.map((p) => p.id);
    const [variantData, imagesData, variantDetailsData] = await Promise.all([
      this.fetchVariantStats(productIds),
      this.fetchProductImages(productIds),
      this.fetchVariantDetails(productIds),
    ]);

    // Merge data
    const productsWithStats = this.mergeProductData(
      productsList,
      variantData,
      imagesData,
      variantDetailsData
    );

    // Use cached count from early return, or compute if no filters
    if (conditions.length === 0 && totalCount === 0) {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(products);
      totalCount = Number(count);
    }

    return {
      products: await this.enrichProducts(productsWithStats),
      total: totalCount,
      limit: limitNum,
      offset: offsetNum,
    };
  }

  /**
   * Simple list products
   */
  async list(limit: number = 20, offset: number = 0) {
    const data = await db.query.products.findMany({
      limit,
      offset,
      orderBy: desc(products.created_at),
      with: {
        variants: {
          with: {
            prices: true,
          },
        },
      },
    });
    return this.enrichProducts(data);
  }

  /**
   * Retrieve a single product by ID or handle
   */
  async retrieveMany(ids: string[]) {
    if (ids.length === 0) return [];
    const data = await db.query.products.findMany({
      where: inArray(products.id, ids),
      with: {
        variants: { with: { prices: true } },
        collection: true,
        images: true,
        categories: { with: { category: true } },
        tags: { with: { tag: true } },
      },
    });
    return this.enrichProducts(data);
  }

  async retrieve(idOrHandle: string) {
    // Check if input is a valid UUID
    const isUuid = z.string().uuid().safeParse(idOrHandle).success;

    // Use query builder for relations
    const product = await db.query.products.findFirst({
      where: isUuid
        ? eq(products.id, idOrHandle)
        : eq(products.handle, idOrHandle),
      with: {
        variants: {
          with: {
            prices: true,
          },
        },
        collection: true,
        images: true,
        categories: {
          with: {
            category: true,
          },
        },
        tags: {
          with: {
            tag: true,
          },
        },
      },
    });

    if (!product) {
      throw new Error(`Product with id/handle ${idOrHandle} not found`);
    }

    return (await this.enrichProducts([product]))[0];
  }

  /**
   * Search products with text query and filters
   */
  async search(query: string, filters?: ProductSearch) {
    const conditions: (
      | ReturnType<typeof eq>
      | ReturnType<typeof or>
      | undefined
    )[] = [];
    const searchFilters = filters ?? { query: '', sortBy: 'relevance' };
    const {
      minPrice,
      maxPrice,
      status,
      sortBy = 'relevance',
      categoryId,
      tagId,
      collectionId,
      attributeCode,
      attributeValue,
    } = searchFilters;

    // Add collection filter
    if (collectionId) {
      const collectionMatches = await db
        .select({ product_id: collection_products.product_id })
        .from(collection_products)
        .where(eq(collection_products.collection_id, collectionId));

      if (collectionMatches.length === 0) {
        conditions.push(eq(products.collection_id, collectionId));
      } else {
        conditions.push(
          or(
            eq(products.collection_id, collectionId),
            inArray(
              products.id,
              collectionMatches.map((item) => item.product_id)
            )
          ) as ReturnType<typeof eq>
        );
      }
    }

    // Text Search (Title, Description, Handle)
    if (query) {
      let useSqlFallback = true;
      if (process.env.MEILISEARCH_HOST && process.env.MEILISEARCH_API_KEY) {
        try {
          const { searchProducts } = await import('../../services/search-service');
          const msResponse = await searchProducts(query, { limit: 100 });
          const msIds = msResponse.hits.map((hit: any) => hit.id);
          
          if (msIds.length === 0) {
            return []; // no results
          }
          
          conditions.push(inArray(products.id, msIds));
          useSqlFallback = false;
        } catch (err) {
          console.error('[ProductQueryService] Meilisearch failed, falling back to SQL search:', err);
        }
      }

      if (useSqlFallback) {
        const normalizedQuery = query.toLowerCase().trim();
      const synonymRows = await db
        .select()
        .from(search_synonyms)
        .where(eq(search_synonyms.locale, 'en'));
      const queryTerms = new Set([normalizedQuery]);

      for (const row of synonymRows) {
        const synonyms = Array.isArray(row.synonyms) ? row.synonyms : [];
        if (row.normalized_term === normalizedQuery || synonyms.includes(normalizedQuery)) {
          queryTerms.add(row.normalized_term);
          synonyms.forEach((term) => queryTerms.add(String(term).toLowerCase()));
        }
      }

      const termConditions = Array.from(queryTerms).flatMap((term) => {
        const safePattern = `%${escapeLikeWildcards(term)}%`;
        return [
          sql`search_vector @@ websearch_to_tsquery('english', ${term})`,
          sql`lower(${products.title}) LIKE ${safePattern}`,
          sql`lower(${products.subtitle}) LIKE ${safePattern}`,
          sql`lower(${products.description}) LIKE ${safePattern}`,
          sql`lower(${products.material}) LIKE ${safePattern}`,
          sql`similarity(lower(${products.title}), ${term}) > 0.22`,
        ];
      });

        // Combine with OR
        conditions.push(or(...termConditions) as ReturnType<typeof eq>);
      }
    }

    // Filters
    if (status) {
      conditions.push(eq(products.status, status));
    }

    if (attributeCode && attributeValue) {
      const attrMatches = await db
        .select({ product_id: product_attribute_values.product_id })
        .from(product_attribute_values)
        .leftJoin(product_attributes, eq(product_attribute_values.attribute_id, product_attributes.id))
        .leftJoin(attribute_values, eq(product_attribute_values.value_id, attribute_values.id))
        .where(
          and(
            eq(product_attributes.code, attributeCode),
            or(
              eq(attribute_values.slug, attributeValue),
              eq(attribute_values.label, attributeValue),
              sql`lower(coalesce(${product_attribute_values.raw_value}, '')) = ${attributeValue.toLowerCase()}`
            )
          )
        );

      if (attrMatches.length === 0) return [];
      conditions.push(
        inArray(
          products.id,
          attrMatches.map((match) => match.product_id)
        )
      );
    }

    // Category Filter
    if (categoryId) {
      const catMatches = await db
        .select({ product_id: product_categories.product_id })
        .from(product_categories)
        .where(eq(product_categories.category_id, categoryId));

      if (catMatches.length === 0) return [];
      conditions.push(
        inArray(
          products.id,
          catMatches.map((c) => c.product_id)
        )
      );
    }

    // Tag Filter
    if (tagId) {
      const tagMatches = await db
        .select({ product_id: product_tags.product_id })
        .from(product_tags)
        .where(eq(product_tags.tag_id, tagId));

      if (tagMatches.length === 0) return [];
      conditions.push(
        inArray(
          products.id,
          tagMatches.map((t) => t.product_id)
        )
      );
    }

    // Construct Where Clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Query
    const searchResults = await db.query.products.findMany({
      where: whereClause,
      with: {
        variants: {
          with: {
            prices: true,
          },
        },
        images: true,
      },
      limit: 50,
    });

    // Post-process filtering (Price) and Sorting
    let processedResults = searchResults.map((p) => {
      const variantPrices =
        p.variants?.flatMap((v) => v.prices?.map((pr) => pr.amount) || []) ||
        [];
      const minProductPrice =
        variantPrices.length > 0 ? Math.min(...variantPrices) : 0;
      return { ...p, price: minProductPrice };
    });

    if (minPrice !== undefined) {
      processedResults = processedResults.filter((p) => p.price >= minPrice);
    }
    if (maxPrice !== undefined) {
      processedResults = processedResults.filter((p) => p.price <= maxPrice);
    }

    // Sort
    if (sortBy === 'price_asc') {
      processedResults.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      processedResults.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'newest') {
      processedResults.sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      );
    }

    let usedVectorFallback = false;
    if (query && processedResults.length === 0) {
      const embedding =
        process.env.ENABLE_PRODUCT_EMBEDDINGS === 'true' ? await embedText(query).catch(() => null) : null;
      if (embedding) {
        const vectorLiteral = toVectorLiteral(embedding);
        const vectorRows = await db
          .select({
            product_id: product_embeddings.product_id,
            distance: sql<number>`${product_embeddings.embedding} <=> ${vectorLiteral}::vector`,
          })
          .from(product_embeddings)
          .where(sql`${product_embeddings.embedding} is not null`)
          .orderBy(sql`${product_embeddings.embedding} <=> ${vectorLiteral}::vector`)
          .limit(20);

        const candidateIds = vectorRows.map((row) => row.product_id);
        if (candidateIds.length > 0) {
          const vectorProducts = await db.query.products.findMany({
            where: and(inArray(products.id, candidateIds), status ? eq(products.status, status) : undefined),
            with: {
              variants: { with: { prices: true } },
              images: true,
              collection: true,
              categories: { with: { category: true } },
              tags: { with: { tag: true } },
            },
          });
          const ordered = candidateIds
            .map((id) => vectorProducts.find((product) => product.id === id))
            .filter((product): product is (typeof vectorProducts)[number] => Boolean(product));
          processedResults = ordered.map((product) => ({ ...product, price: 0 }));
          usedVectorFallback = processedResults.length > 0;
        }
      }
    }

    await db.insert(search_query_logs).values({
      query,
      normalized_query: query.toLowerCase().trim(),
      result_count: processedResults.length,
      source: 'storefront',
      metadata: usedVectorFallback ? { fallback: 'vector' } : undefined,
    }).catch(() => undefined);

    return this.enrichProducts(processedResults);
  }

  /**
   * Get search suggestions (autocomplete)
   */
  async getSuggestions(query: string, limit: number = 5) {
    if (!query || query.length < 2) return [];

    const safePattern = `%${escapeLikeWildcards(query.toLowerCase())}%`;
    const results = await db
      .select({
        id: products.id,
        title: products.title,
        handle: products.handle,
        thumbnail: products.thumbnail,
      })
      .from(products)
      .where(
        and(
          eq(products.status, 'published'),
          sql`lower(${products.title}) LIKE ${safePattern}`
        )
      )
      .limit(limit);

    return results;
  }
}

// Export singleton instance
export const productQueryService = new ProductQueryService();
