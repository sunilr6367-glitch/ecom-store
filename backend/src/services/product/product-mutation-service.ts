/**
 * Product Mutation Service
 * Handles all write operations for products
 */

import { createHash } from 'crypto';
import { db } from '../../db/client';
import {
  products,
  product_variants,
  product_options,
  product_option_values,
  money_amounts,
  product_images,
  categories,
  tags,
  product_collections,
  collection_products,
  product_categories,
  product_tags,
  product_seo,
  product_discovery,
  product_attributes,
  attribute_values,
  product_attribute_values,
  product_variant_merchant,
  product_media_seo,
  product_embeddings,
  back_in_stock_subscriptions,
  regions,
} from '../../db/schema';
import { eq, inArray, and } from 'drizzle-orm';
import { emailService } from '../email-service';
import { syncSingleProductToMeilisearch, deleteProduct } from '../search-service';
import type {
  CreateProductInput,
  UpdateProductInput,
} from './product-validator';
import { ValidationError } from '../../middleware/error-handler';
import type { ValidationErrorDetails } from '../../middleware/error-handler';
import { getNewProductPublishReadinessIssues } from './product-readiness';

function compactUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;
}

export class ProductMutationService {
  /**
   * Create a base product with default variant and prices.
   */
  async create(data: CreateProductInput) {
    if (data.status === 'published') {
      const errors = getNewProductPublishReadinessIssues(data);
      if (errors.length > 0) {
        throw new ValidationError('Product is not ready to publish', errors);
      }
    }

    const result = await db.transaction(async (tx) => {
      const {
        prices,
        options,
        images,
        category_ids,
        tag_ids,
        inventory_quantity,
        sku,
        ...productData
      } = data;

      // Validate foreign keys exist before proceeding
      await this.validateForeignKeys(tx, category_ids, tag_ids, productData.collection_id);

      // 1. Create Product
      const newProduct = await this.createBaseProduct(tx, productData);

      // 2. Create Default Variant
      const newVariant = await this.createDefaultVariantForProduct(tx, newProduct.id, data);

      // 3. Create Prices (Money Amounts)
      await this.assignPricesToVariant(tx, newVariant.id, prices);

      // 4. Create Options
      await this.assignOptionsToProduct(tx, newProduct.id, options);

      // 5. Create Images
      const createdImages = await this.assignImagesToProduct(tx, newProduct.id, images);

      // 6. Assign Categories
      await this.assignCategoriesToProduct(tx, newProduct.id, category_ids);

      // 7. Assign Tags
      await this.assignTagsToProduct(tx, newProduct.id, tag_ids);

      // 8. Keep legacy collection_id and the collection_products junction in sync.
      await this.assignCollectionToProduct(tx, newProduct.id, productData.collection_id);

      // 9. Create SEO/discovery baseline so new products are never SEO-empty.
      await this.createSeoDiscoveryBaseline(tx, newProduct, newVariant, createdImages, data);

      return { ...newProduct, default_variant_id: newVariant.id };
    });

    // Sync to Meilisearch in background (non-blocking)
    syncSingleProductToMeilisearch(result.id).catch((err) =>
      console.error('[SearchService] Sync after product create failed:', err.message)
    );

    return result;
  }

  private async validateForeignKeys(
    tx: any,
    categoryIds: string[] | undefined,
    tagIds: string[] | undefined,
    collectionId?: string | null
  ) {
    if (!categoryIds && !tagIds && !collectionId) return;

    const errors: ValidationErrorDetails[] = [];

    if (categoryIds && categoryIds.length > 0) {
      const existingCats = await tx
        .select({ id: categories.id })
        .from(categories)
        .where(inArray(categories.id, categoryIds));
      const existingIds = new Set(existingCats.map((c: { id: any }) => c.id));
      const missing = categoryIds.filter((id) => !existingIds.has(id));
      if (missing.length > 0) {
        errors.push({
          field: 'category_ids',
          message: `Categories not found: ${missing.join(', ')}`,
        });
      }
    }

    if (tagIds && tagIds.length > 0) {
      const existingTags = await tx
        .select({ id: tags.id })
        .from(tags)
        .where(inArray(tags.id, tagIds));
      const existingIds = new Set(existingTags.map((t: { id: any }) => t.id));
      const missing = tagIds.filter((id) => !existingIds.has(id));
      if (missing.length > 0) {
        errors.push({
          field: 'tag_ids',
          message: `Tags not found: ${missing.join(', ')}`,
        });
      }
    }

    if (collectionId) {
      const existingCollections = await tx
        .select({ id: product_collections.id })
        .from(product_collections)
        .where(eq(product_collections.id, collectionId));

      if (existingCollections.length === 0) {
        errors.push({
          field: 'collection_id',
          message: `Collection not found: ${collectionId}`,
        });
      }
    }

    if (errors.length > 0) {
      throw new ValidationError('Invalid foreign key references', errors);
    }
  }

  private async createBaseProduct(tx: any, productData: any) {
    const result = await tx
      .insert(products)
      .values(productData as typeof products.$inferInsert)
      .returning();
    return result[0];
  }

  private async createDefaultVariantForProduct(tx: any, productId: string, data: CreateProductInput) {
    const result = await tx
      .insert(product_variants)
      .values({
        product_id: productId,
        title: 'Default Variant',
        sku: data.sku || `${data.handle}-default`,
        inventory_quantity: data.inventory_quantity || 0,
        manage_inventory: true,
        hs_code: data.hs_code,
        origin_country: data.origin_country,
        material: data.material,
        weight: data.weight,
        length: data.length,
        height: data.height,
        width: data.width,
      })
      .returning();
    return result[0];
  }

  private async assignPricesToVariant(tx: any, variantId: string, prices: any[] | undefined) {
    if (!prices || prices.length === 0) return;
    for (const price of prices) {
      let regionId = price.region_id;

      // SAFETY: Fallback lookup if region_id is silently null/undefined
      if (!regionId && price.currency_code === 'inr') {
        const inrRegion = await tx.select({ id: regions.id }).from(regions).where(eq(regions.currency_code, 'inr')).limit(1);
        if (inrRegion.length > 0) {
          regionId = inrRegion[0].id;
        } else {
          throw new ValidationError('INR Region missing in database. Cannot assign price without region_id.', []);
        }
      }

      await tx.insert(money_amounts).values({
        variant_id: variantId,
        region_id: regionId,
        currency_code: price.currency_code,
        amount: price.amount,
        min_quantity: 1,
      });
    }
  }

  private async assignOptionsToProduct(tx: any, productId: string, options: any[] | undefined) {
    if (!options || options.length === 0) return;
    for (const opt of options) {
      await tx.insert(product_options).values({
        product_id: productId,
        title: opt.title,
        metadata: null,
      });
    }
  }

  private async assignImagesToProduct(tx: any, productId: string, images: any[] | undefined) {
    if (!images || images.length === 0) return [];
    const imageValues = images
      .filter((img) => img.url)
      .map((img) => ({
        product_id: productId,
        url: img.url,
        alt_text: img.alt_text,
        position: img.position ?? 0,
        is_thumbnail: img.is_thumbnail ?? false,
        metadata: img.metadata ?? null,
      }));

    if (imageValues.length > 0) {
      return await tx.insert(product_images).values(imageValues).returning();
    }

    return [];
  }

  private buildSeoTitle(data: CreateProductInput | UpdateProductInput) {
    const raw = (data.seo_title || data.title || '').trim();
    if (!raw) return null;
    const branded = raw.toLowerCase().includes('odhvica') ? raw : `${raw} | Odhvica`;
    return branded.slice(0, 70);
  }

  private buildMetaDescription(data: CreateProductInput | UpdateProductInput) {
    const explicit = data.seo_description?.trim();
    if (explicit) return explicit.slice(0, 170);

    const text = [data.title, data.subtitle, data.material, data.description]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!text) return null;
    return text.slice(0, 165);
  }

  private buildDiscoveryDocument(data: CreateProductInput | UpdateProductInput) {
    return [
      data.title,
      data.subtitle,
      data.description,
      data.material,
      data.size_guide,
      data.care_instructions,
      data.origin_country === 'IN' ? 'India Jaipur artisan handmade slow fashion' : '',
    ]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private inferText(data: CreateProductInput | UpdateProductInput) {
    return [data.title, data.subtitle, data.description, data.handle, data.material]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }

  private inferAttributeSlugs(data: CreateProductInput | UpdateProductInput) {
    const text = this.inferText(data);
    const rules = [
      { attribute: 'fabric', slug: 'cotton', pattern: /(cotton|mulmul|voile)/ },
      { attribute: 'fabric', slug: 'velvet', pattern: /velvet/ },
      { attribute: 'technique', slug: 'block-print', pattern: /(block print|block-print|bagru|sanganeri|rajasthani print)/ },
      { attribute: 'technique', slug: 'kantha', pattern: /kantha/ },
      { attribute: 'technique', slug: 'quilted', pattern: /(quilt|quilted)/ },
      { attribute: 'technique', slug: 'embroidery', pattern: /(embroider|embroidery)/ },
      { attribute: 'technique', slug: 'handmade', pattern: /(handmade|hand made|handcrafted|hand crafted|artisan)/ },
      { attribute: 'occasion', slug: 'gift', pattern: /(gift for her|gift for women|gift)/ },
      { attribute: 'occasion', slug: 'travel', pattern: /(travel|toiletry|cosmetic|pouch|vacation)/ },
      { attribute: 'occasion', slug: 'shopping', pattern: /(shopping|shopper|market bag|tote)/ },
      { attribute: 'occasion', slug: 'wedding', pattern: /(wedding|bridal)/ },
      { attribute: 'occasion', slug: 'festive', pattern: /(festival|festive)/ },
      { attribute: 'style', slug: 'boho', pattern: /(boho|bohemian)/ },
      { attribute: 'style', slug: 'ethnic', pattern: /(ethnic|indian|rajasthani|jaipur)/ },
      { attribute: 'style', slug: 'kimono', pattern: /kimono/ },
      { attribute: 'style', slug: 'jacket', pattern: /(jacket|coat)/ },
      { attribute: 'style', slug: 'tote-bag', pattern: /(tote|shoulder bag|shopper|market bag)/ },
      { attribute: 'style', slug: 'toiletry-bag', pattern: /(toiletry|cosmetic|makeup|pouch)/ },
      { attribute: 'pattern', slug: 'floral', pattern: /(floral|flower)/ },
      { attribute: 'pattern', slug: 'fruit-print', pattern: /fruit/ },
      { attribute: 'pattern', slug: 'patchwork', pattern: /(patchwork|patch work)/ },
      { attribute: 'pattern', slug: 'block-print', pattern: /(block print|block-print)/ },
      { attribute: 'color', slug: 'blue', pattern: /(blue|sky blue)/ },
      { attribute: 'color', slug: 'green', pattern: /green/ },
      { attribute: 'color', slug: 'red', pattern: /red/ },
      { attribute: 'color', slug: 'orange', pattern: /orange/ },
      { attribute: 'color', slug: 'white', pattern: /(white|ivory)/ },
      { attribute: 'color', slug: 'yellow', pattern: /(yellow|mustard)/ },
      { attribute: 'color', slug: 'multicolor', pattern: /(multicolor|multi color)/ },
      { attribute: 'region', slug: 'jaipur', pattern: /(jaipur|sanganer)/ },
      { attribute: 'region', slug: 'rajasthan', pattern: /(rajasthan|rajasthani)/ },
      { attribute: 'region', slug: 'india', pattern: /(india|indian|made in india)/ },
      { attribute: 'artisan_type', slug: 'jaipur-artisan', pattern: /(jaipur artisan|jaipur|artisan)/ },
      { attribute: 'artisan_type', slug: 'block-printer', pattern: /(block print|block-printer|block printer)/ },
      { attribute: 'artisan_type', slug: 'hand-quilter', pattern: /(kantha|quilt|quilted)/ },
    ];

    return rules.filter((rule) => rule.pattern.test(text));
  }

  private inferSemanticEntities(data: CreateProductInput | UpdateProductInput) {
    const text = this.inferText(data);
    const entities = new Set(['Odhvica', 'handcrafted', 'slow fashion']);
    if (/(jaipur|rajasthan|rajasthani)/.test(text)) entities.add('Jaipur');
    if (/block print|bagru|sanganeri/.test(text)) entities.add('block print');
    if (/kantha/.test(text)) entities.add('Kantha');
    if (/cotton/.test(text)) entities.add('cotton');
    if (/boho|bohemian/.test(text)) entities.add('boho');
    return Array.from(entities);
  }

  private inferSearchIntents(data: CreateProductInput | UpdateProductInput) {
    const text = this.inferText(data);
    const intents = new Set(['buy']);
    if (/gift/.test(text)) intents.add('gift');
    if (/travel|toiletry|pouch/.test(text)) intents.add('travel');
    if (/wedding|bridal|festive|festival/.test(text)) intents.add('occasion');
    if (/care|wash/.test(text)) intents.add('care');
    return Array.from(intents);
  }

  private async createSeoDiscoveryBaseline(
    tx: any,
    product: typeof products.$inferSelect,
    variant: typeof product_variants.$inferSelect,
    images: Array<typeof product_images.$inferSelect>,
    data: CreateProductInput
  ) {
    const seoTitle = this.buildSeoTitle(data);
    const metaDescription = this.buildMetaDescription(data);
    const document = this.buildDiscoveryDocument(data);
    const documentHash = createHash('sha256').update(document || product.id).digest('hex');
    const thumbnailImage = images.find((image) => image.is_thumbnail) || images[0];

    await tx
      .insert(product_seo)
      .values({
        product_id: product.id,
        seo_title: seoTitle,
        meta_description: metaDescription,
        canonical_url: `/products/${product.handle}`,
        robots_index: product.status !== 'draft',
        robots_follow: true,
        og_title: seoTitle,
        og_description: metaDescription,
        og_image_url: thumbnailImage?.url || product.thumbnail,
        twitter_card: 'summary_large_image',
        schema_overrides: {},
        localized_metadata: {},
        seo_score: 0,
      })
      .onConflictDoNothing();

    await tx
      .insert(product_discovery)
      .values({
        product_id: product.id,
        primary_keyword: data.title,
        secondary_keywords: [data.material, data.subtitle].filter(Boolean),
        long_tail_keywords: [
          data.title,
          data.material ? `${data.material} handmade product` : undefined,
          /gift/i.test(data.title || '') ? `${data.title} gift` : undefined,
        ].filter(Boolean),
        search_intents: this.inferSearchIntents(data),
        semantic_entities: this.inferSemanticEntities(data),
        negative_keywords: [],
        product_document: document,
        document_hash: documentHash,
        metadata: { source: 'auto_create_baseline' },
      })
      .onConflictDoNothing();

    const inferred = this.inferAttributeSlugs(data);
    if (inferred.length > 0) {
      const attrRows: any[] = await tx.select().from(product_attributes);
      const valueRows: any[] = await tx.select().from(attribute_values);
      const attrByCode = new Map<string, any>(attrRows.map((attr) => [attr.code, attr]));
      const valuesByKey = new Map<string, any>(valueRows.map((value) => [`${value.attribute_id}:${value.slug}`, value]));
      const assignments = inferred
        .map((item) => {
          const attr = attrByCode.get(item.attribute);
          if (!attr) return null;
          const value = valuesByKey.get(`${attr.id}:${item.slug}`);
          if (!value) return null;
          return {
            product_id: product.id,
            attribute_id: attr.id,
            value_id: value.id,
            raw_value: value.label,
            source: 'auto_create_baseline',
            confidence: 82,
            metadata: { inferred_from: 'title_description_material' },
          };
        })
        .filter(Boolean);

      if (assignments.length > 0) {
        await tx.insert(product_attribute_values).values(assignments).onConflictDoNothing();
      }
    }

    if (images.length > 0) {
      await tx
        .insert(product_media_seo)
        .values(
          images.map((image, index) => ({
            image_id: image.id,
            alt_text: image.alt_text || `${product.title} ${index === 0 ? 'product image' : `view ${index + 1}`}`,
            cloudinary_public_id: (image.metadata as any)?.cloudinary_public_id || null,
            image_role: index === 0 ? 'primary' : 'gallery',
            view_type: index === 0 ? 'front' : null,
            color: null,
            seo_filename: product.handle,
            metadata: { source: 'auto_create_baseline' },
          }))
        )
        .onConflictDoNothing();
    }

    await tx
      .insert(product_variant_merchant)
      .values({
        variant_id: variant.id,
        item_group_id: product.id,
        material: data.material || null,
        condition: 'new',
        feed_enabled: false,
        metadata: { source: 'auto_create_baseline' },
      })
      .onConflictDoNothing();

    if (document && process.env.ENABLE_PRODUCT_EMBEDDINGS === 'true') {
      await tx
        .insert(product_embeddings)
        .values({
          product_id: product.id,
          locale: 'en',
          source_hash: documentHash,
          document,
          metadata: { source: 'auto_create_baseline', provider: 'pending' },
          updated_at: new Date(),
        })
        .onConflictDoNothing();
    }
  }

  private async assignCategoriesToProduct(tx: any, productId: string, categoryIds: string[] | undefined) {
    if (!categoryIds || categoryIds.length === 0) return;
    await tx.insert(product_categories).values(
      categoryIds.map((catId) => ({
        product_id: productId,
        category_id: catId,
      }))
    );
  }

  private async assignTagsToProduct(tx: any, productId: string, tagIds: string[] | undefined) {
    if (!tagIds || tagIds.length === 0) return;
    await tx.insert(product_tags).values(
      tagIds.map((tagId) => ({
        product_id: productId,
        tag_id: tagId,
      }))
    );
  }

  private async assignCollectionToProduct(tx: any, productId: string, collectionId: string | null | undefined) {
    if (!collectionId) return;

    await tx
      .insert(collection_products)
      .values({
        product_id: productId,
        collection_id: collectionId,
        position: 0,
      })
      .onConflictDoNothing();
  }

  /**
   * Update a product's base details.
   */
  async update(id: string, data: UpdateProductInput) {
    if (data.status === 'published') {
      await this.validatePublishReadiness(id, data);
    }

    const result = await db.transaction(async (tx) => {
      await this.validateForeignKeys(tx, data.category_ids, data.tag_ids, data.collection_id);

      // 1. Update Product Base
      const updatedProduct = await this.updateBaseProductDetails(tx, id, data);

      // 2. Update default variant if exists
      const defaultVariantId = await this.updateDefaultVariant(tx, id, data);

      // 3. Sync prices for the default variant when pricing is provided
      if (defaultVariantId && data.prices) {
        await this.syncVariantPrices(tx, defaultVariantId, data.prices);
      }

      // 4. Handle images if provided
      if (data.images) {
        await this.syncProductImages(tx, id, data.images);
      }

      // 5. Handle Categories
      if (data.category_ids) {
        await this.syncProductCategories(tx, id, data.category_ids);
      }

      // 6. Handle Tags
      if (data.tag_ids) {
        await this.syncProductTags(tx, id, data.tag_ids);
      }

      if (data.collection_id !== undefined) {
        await this.syncProductCollection(tx, id, data.collection_id);
      }

      return updatedProduct;
    });

    // Auto-notify back-in-stock subscribers if inventory went above 0
    // Run async (non-blocking) — product update should not fail if emails fail
    if (data.inventory_quantity && data.inventory_quantity > 0) {
      this.notifyBackInStockSubscribers(id).catch((err) =>
        console.error('[BackInStock] Auto-notify failed:', err.message)
      );
    }

    // Sync to Meilisearch in background (non-blocking)
    syncSingleProductToMeilisearch(id).catch((err) =>
      console.error('[SearchService] Sync after product update failed:', err.message)
    );

    return result;
  }

  private async validatePublishReadiness(id: string, data: UpdateProductInput) {
    const [existing] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!existing) throw new Error(`Product with id ${id} not found`);

    const [seo] = await db.select().from(product_seo).where(eq(product_seo.product_id, id)).limit(1);
    const existingImages = await db.select().from(product_images).where(eq(product_images.product_id, id));
    const existingCategories = await db.select().from(product_categories).where(eq(product_categories.product_id, id));
    const existingAttributes = await db.select().from(product_attribute_values).where(eq(product_attribute_values.product_id, id));
    const existingVariants = await db
      .select({ id: product_variants.id })
      .from(product_variants)
      .where(eq(product_variants.product_id, id));
    const existingVariantIds = existingVariants.map((variant) => variant.id);
    const existingPrices = existingVariantIds.length
      ? await db
          .select({ amount: money_amounts.amount })
          .from(money_amounts)
          .where(inArray(money_amounts.variant_id, existingVariantIds))
      : [];

    const hasImages = data.images ? data.images.some((image) => image.url) : existingImages.length > 0 || Boolean(data.thumbnail || existing.thumbnail);
    const hasCategories = data.category_ids ? data.category_ids.length > 0 : existingCategories.length > 0;
    const hasAttributes = existingAttributes.length > 0 || Boolean(data.material || existing.material);
    const hasSeoTitle = Boolean(data.seo_title || seo?.seo_title || existing.seo_title);
    const hasMetaDescription = Boolean(data.seo_description || seo?.meta_description || existing.seo_description);
    const hasFixedPrice = (data.price_type || existing.price_type || 'fixed') === 'fixed';
    const hasSellablePrice =
      Boolean(data.prices?.some((price) => Number(price.amount) > 0)) ||
      existingPrices.some((price) => Number(price.amount) > 0);
    const hasPrice = hasFixedPrice && hasSellablePrice;

    const errors: ValidationErrorDetails[] = [
      { field: 'title', message: 'Published products need a title.' },
      { field: 'handle', message: 'Published products need an editable URL slug.' },
      { field: 'prices', message: 'Published products need fixed pricing with at least one positive price.' },
      { field: 'images', message: 'Published products need at least one product image.' },
      { field: 'category_ids', message: 'Published products need at least one category or collection.' },
      { field: 'attributes', message: 'Published products need at least one structured attribute or legacy material.' },
      { field: 'seo_title', message: 'Published products need an SEO title.' },
      { field: 'seo_description', message: 'Published products need a meta description.' },
    ].filter((error) => {
      if (error.field === 'title') {
        return getNewProductPublishReadinessIssues({
          title: data.title || existing.title,
          handle: data.handle || existing.handle,
          thumbnail: data.thumbnail || existing.thumbnail || undefined,
          images: data.images,
          price_type: (data.price_type || existing.price_type || 'fixed') as 'fixed' | 'on_request',
          prices: data.prices,
          category_ids: data.category_ids,
          collection_id: data.collection_id ?? existing.collection_id,
        }).some((issue) => issue.field === 'title');
      }
      if (error.field === 'handle') return !Boolean(data.handle || existing.handle);
      if (error.field === 'prices') return !hasPrice;
      if (error.field === 'images') return !hasImages;
      if (error.field === 'category_ids') return !hasCategories && !Boolean(data.collection_id ?? existing.collection_id);
      if (error.field === 'attributes') return !hasAttributes;
      if (error.field === 'seo_title') return !hasSeoTitle;
      if (error.field === 'seo_description') return !hasMetaDescription;
      return false;
    });

    if (errors.length > 0) {
      throw new ValidationError('Product is not ready to publish', errors);
    }
  }

  private async updateBaseProductDetails(tx: any, id: string, data: UpdateProductInput) {
    const {
      options,
      prices,
      images,
      category_ids,
      tag_ids,
      inventory_quantity,
      sku,
      ...productFields
    } = data;

    const updateData = compactUndefined({
      ...productFields,
      updated_at: new Date(),
    });

    const result = await tx
      .update(products)
      .set(updateData as typeof products.$inferInsert)
      .where(eq(products.id, id))
      .returning();

    if (result.length === 0) {
      throw new Error(`Product with id ${id} not found`);
    }
    return result[0];
  }

  private async updateDefaultVariant(tx: any, productId: string, data: UpdateProductInput) {
    const variants = await tx
      .select()
      .from(product_variants)
      .where(eq(product_variants.product_id, productId));

    if (variants.length === 0) {
      return null;
    }

    const updateData = compactUndefined({
      hs_code: data.hs_code,
      origin_country: data.origin_country,
      material: data.material,
      weight: data.weight,
      length: data.length,
      height: data.height,
      width: data.width,
      inventory_quantity: data.inventory_quantity,
      updated_at: new Date(),
    });

    await tx
      .update(product_variants)
      .set(updateData)
      .where(eq(product_variants.id, variants[0].id));

    return variants[0].id;
  }

  private async syncVariantPrices(tx: any, variantId: string, prices: any[]) {
    await tx.delete(money_amounts).where(eq(money_amounts.variant_id, variantId));

    if (!prices.length) {
      return;
    }

    await tx.insert(money_amounts).values(
      prices.map((price) => ({
        variant_id: variantId,
        region_id: price.region_id ?? null,
        currency_code: price.currency_code,
        amount: price.amount,
        min_quantity: 1,
      }))
    );
  }

  private async syncProductImages(tx: any, productId: string, images: any[]) {
    const existingImages = await tx
      .select({ id: product_images.id })
      .from(product_images)
      .where(eq(product_images.product_id, productId));
    const existingImageIds = existingImages.map((image: { id: string }) => image.id);

    if (existingImageIds.length > 0) {
      await tx
        .delete(product_media_seo)
        .where(inArray(product_media_seo.image_id, existingImageIds));
    }

    await tx
      .delete(product_images)
      .where(eq(product_images.product_id, productId));

    if (images.length > 0) {
      const imageValues = images
        .filter((img) => img.url)
        .map((img) => ({
          product_id: productId,
          url: img.url,
          alt_text: img.alt_text,
          position: img.position ?? 0,
          is_thumbnail: img.is_thumbnail ?? false,
          metadata: img.metadata ?? null,
        }));

      if (imageValues.length > 0) {
        const newImages = await tx.insert(product_images).values(imageValues).returning();
        
        const [product] = await tx.select({ title: products.title, handle: products.handle }).from(products).where(eq(products.id, productId)).limit(1);
        await tx
          .insert(product_media_seo)
          .values(
            newImages.map((image: any, index: number) => ({
              image_id: image.id,
              alt_text: image.alt_text || `${product?.title || 'product'} ${index === 0 ? 'product image' : `view ${index + 1}`}`,
              cloudinary_public_id: image.metadata?.cloudinary_public_id || null,
              image_role: index === 0 ? 'primary' : 'gallery',
              view_type: index === 0 ? 'front' : null,
              color: null,
              seo_filename: product?.handle || 'product',
              metadata: { source: 'auto_sync_images' },
            }))
          )
          .onConflictDoNothing();
      }
    }
  }

  private async syncProductCategories(tx: any, productId: string, categoryIds: string[]) {
    await tx
      .delete(product_categories)
      .where(eq(product_categories.product_id, productId));

    if (categoryIds.length > 0) {
      await tx.insert(product_categories).values(
        categoryIds.map((catId) => ({
          product_id: productId,
          category_id: catId,
        }))
      );
    }
  }

  private async syncProductTags(tx: any, productId: string, tagIds: string[]) {
    await tx.delete(product_tags).where(eq(product_tags.product_id, productId));

    if (tagIds.length > 0) {
      await tx.insert(product_tags).values(
        tagIds.map((tagId) => ({
          product_id: productId,
          tag_id: tagId,
        }))
      );
    }
  }

  private async syncProductCollection(tx: any, productId: string, collectionId: string | null | undefined) {
    await tx
      .delete(collection_products)
      .where(eq(collection_products.product_id, productId));

    if (collectionId) {
      await this.assignCollectionToProduct(tx, productId, collectionId);
    }
  }

  /** Send back-in-stock emails to all pending subscribers for a product */
  private async notifyBackInStockSubscribers(productId: string) {
    // Find all unnotified subscribers for this product
    const subscribers = await db
      .select({
        id: back_in_stock_subscriptions.id,
        email: back_in_stock_subscriptions.email,
      })
      .from(back_in_stock_subscriptions)
      .where(
        and(
          eq(back_in_stock_subscriptions.product_id, productId),
          eq(back_in_stock_subscriptions.notified, false)
        )
      );

    if (subscribers.length === 0) return;

    // Get product info for email
    const [product] = await db
      .select({ title: products.title, handle: products.handle })
      .from(products)
      .where(eq(products.id, productId))
      .limit(1);

    if (!product) return;

    const productUrl = `/products/${product.handle}`;

    console.log(`[BackInStock] Notifying ${subscribers.length} subscriber(s) for "${product.title}"`);

    // Send emails and mark as notified
    for (const subscriber of subscribers) {
      try {
        await emailService.sendBackInStockNotification({
          email: subscriber.email,
          product_title: product.title || 'Product',
          product_url: productUrl,
        });

        // Mark as notified
        await db
          .update(back_in_stock_subscriptions)
          .set({ notified: true, notified_at: new Date() })
          .where(eq(back_in_stock_subscriptions.id, subscriber.id));
      } catch (err: any) {
        console.error(`[BackInStock] Failed to notify ${subscriber.email}:`, err.message);
      }
    }

    console.log(`[BackInStock] Done notifying subscribers for "${product.title}"`);
  }


  /**
   * Delete a product and all its related data.
   */
  async delete(id: string) {
    const result = await db.transaction(async (tx) => {
      // 1. Get variants for this product
      const variants = await tx
        .select({ id: product_variants.id })
        .from(product_variants)
        .where(eq(product_variants.product_id, id));

      const variantIds = variants.map((v) => v.id);

      // 2. Delete product_options and product_option_values
      if (variantIds.length > 0) {
        await tx
          .delete(product_option_values)
          .where(inArray(product_option_values.variant_id, variantIds));
        await tx
          .delete(product_options)
          .where(eq(product_options.product_id, id));
      }

      // 3. Delete money_amounts (prices) for all variants
      if (variantIds.length > 0) {
        await tx
          .delete(money_amounts)
          .where(inArray(money_amounts.variant_id, variantIds));
      }

      // 4. Delete variants
      await tx
        .delete(product_variants)
        .where(eq(product_variants.product_id, id));

      // 5. Delete images
      await tx.delete(product_images).where(eq(product_images.product_id, id));

      // 6. Delete category associations
      await tx
        .delete(product_categories)
        .where(eq(product_categories.product_id, id));

      // 7. Delete tag associations
      await tx.delete(product_tags).where(eq(product_tags.product_id, id));

      // 8. Finally delete the product
      await tx.delete(products).where(eq(products.id, id));

      // 10. Delete Drizzle product_embeddings (if any)
      await tx.delete(product_embeddings).where(eq(product_embeddings.product_id, id));

      return { id, deleted: true };
    });

    // Delete from Meilisearch in background (non-blocking)
    deleteProduct(id).catch((err) =>
      console.error('[SearchService] Deletion from Meilisearch failed:', err.message)
    );

    return result;
  }
}

// Export singleton instance
export const productMutationService = new ProductMutationService();
