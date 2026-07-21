import { Hono } from 'hono';
import { desc, eq, inArray } from 'drizzle-orm';

import { db } from '../db/client';
import { verifyAdminOrMcpService } from '../middleware/auth';
import { asyncHandler } from '../middleware/error-handler';
import { successResponse } from '../utils/api-response';
import {
  merchant_feed_health,
  product_seo,
  product_variant_merchant,
  product_variants,
  products,
} from '../db/schema';
import { normalizeCloudinaryUrl } from '../utils/cloudinary';

const merchantRouter = new Hono();

const SITE_URL = process.env.STOREFRONT_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://odhvica.com';

merchantRouter.get(
  '/feeds/health',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const rows = await db
      .select()
      .from(merchant_feed_health)
      .orderBy(desc(merchant_feed_health.last_generated_at))
      .limit(50);

    const latestByChannel = new Map<string, typeof rows[number]>();
    for (const row of rows) {
      if (!latestByChannel.has(row.channel)) latestByChannel.set(row.channel, row);
    }

    return successResponse(
      c,
      { feeds: Array.from(latestByChannel.values()) },
      'Merchant feed health retrieved successfully'
    );
  })
);

function escapeXml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeCsv(value: unknown): string {
  const text = String(value ?? '');
  if (!/[",\n\r]/.test(text)) return text;
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(rows: Array<Record<string, unknown>>, columns: string[]) {
  return [
    columns.join(','),
    ...rows.map((row) => columns.map((column) => escapeCsv(row[column])).join(',')),
  ].join('\n');
}

function absoluteUrl(pathOrUrl: string) {
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  return new URL(pathOrUrl, SITE_URL).toString();
}

function optimizedImageUrl(pathOrUrl: string) {
  const url = absoluteUrl(pathOrUrl);
  return normalizeCloudinaryUrl(url) || url;
}

async function recordFeedHealth(channel: string, productCount: number, errors: string[] = []) {
  await db.insert(merchant_feed_health).values({
    channel,
    status: errors.length ? 'warning' : 'ok',
    product_count: productCount,
    error_count: errors.length,
    errors,
    last_generated_at: new Date(),
  }).catch(() => undefined);
}

async function buildGoogleMerchantItems(lang?: string) {
  const publishedProducts = await db.query.products.findMany({
    where: eq(products.status, 'published'),
    with: {
      variants: {
        with: {
          prices: true,
        },
      },
      images: true,
      categories: {
        with: {
          category: true,
        },
      },
    },
  });

  const productIds = publishedProducts.map((product) => product.id);
  const variantIds = publishedProducts.flatMap((product) => product.variants?.map((variant) => variant.id) || []);

  const [seoRows, merchantRows] = await Promise.all([
    productIds.length ? db.select().from(product_seo).where(inArray(product_seo.product_id, productIds)) : [],
    variantIds.length
      ? db.select().from(product_variant_merchant).where(inArray(product_variant_merchant.variant_id, variantIds))
      : [],
  ]);

  const seoByProduct = new Map(seoRows.map((row) => [row.product_id, row]));
  const merchantByVariant = new Map(merchantRows.map((row) => [row.variant_id, row]));

  return publishedProducts.flatMap((product) => {
    const seo = seoByProduct.get(product.id);
    if (seo?.robots_index === false) return [];

    const image = product.images?.[0]?.url || product.thumbnail;
    if (!image) return [];

    return (product.variants || []).flatMap((variant) => {
      const price = variant.prices?.find((row) => row.currency_code?.toLowerCase() === 'inr') || variant.prices?.[0];
      if (!price || !price.amount) return [];

      const merchant = merchantByVariant.get(variant.id);
      if (merchant && merchant.feed_enabled === false) return [];

      const amount = price.amount / 100;
      const currency = price.currency_code.toUpperCase();
      const link = absoluteUrl(`/products/${product.handle}`);

      const metadata = (product.metadata as Record<string, any>) || {};
      let translatedTitle = '';
      let translatedDescription = '';

      if (lang && metadata.translations && metadata.translations[lang]) {
        translatedTitle = metadata.translations[lang].title || '';
        translatedDescription = metadata.translations[lang].description || '';
      }

      const defaultTitle = seo?.seo_title || product.seo_title || product.title;
      const defaultDescription = seo?.meta_description || product.seo_description || product.description || product.title;

      return [
        {
          id: variant.sku || variant.id,
          item_group_id: merchant?.item_group_id || product.id,
          title: translatedTitle || defaultTitle,
          description: translatedDescription || defaultDescription,
          link,
          image_link: optimizedImageUrl(image),
          availability: (variant.inventory_quantity || 0) > 0 ? 'in stock' : 'out of stock',
          price: `${amount.toFixed(2)} ${currency}`,
          brand: 'Odhvica',
          gtin: merchant?.gtin || variant.barcode || variant.ean || variant.upc || undefined,
          mpn: merchant?.mpn || variant.sku || undefined,
          condition: merchant?.condition || 'new',
          google_product_category: merchant?.google_product_category || 'Apparel & Accessories',
          color: merchant?.color || undefined,
          size: merchant?.size || variant.title || undefined,
          gender: merchant?.gender || 'female',
          age_group: merchant?.age_group || 'adult',
          material: merchant?.material || variant.material || product.material || undefined,
          pattern: merchant?.pattern || undefined,
          shipping_weight: merchant?.shipping_weight || variant.weight || product.weight || undefined,
          origin_country: variant.origin_country || product.origin_country || 'IN',
          product_type: product.categories?.[0]?.category?.name || 'Handcrafted fashion',
        },
      ];
    });
  });
}

merchantRouter.get(
  '/google/products.json',
  asyncHandler(async (c) => {
    const lang = c.req.query('lang');
    const products = await buildGoogleMerchantItems(lang);
    await recordFeedHealth('google', products.length);
    return successResponse(c, { products }, 'Google Merchant products generated successfully');
  })
);

merchantRouter.get(
  '/pinterest/products.json',
  asyncHandler(async (c) => {
    const lang = c.req.query('lang');
    const products = await buildGoogleMerchantItems(lang);
    await recordFeedHealth('pinterest', products.length);
    c.header('Content-Type', 'application/json; charset=utf-8');
    return c.json({
      products: products.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        link: item.link,
        image_link: item.image_link,
        price: item.price,
        availability: item.availability,
        condition: item.condition,
        product_type: item.product_type,
        brand: item.brand,
        item_group_id: item.item_group_id,
        color: item.color || null,
        size: item.size || null,
        material: item.material || null,
        pattern: item.pattern || null,
      })),
    });
  })
);

merchantRouter.get(
  '/meta/products.json',
  asyncHandler(async (c) => {
    const lang = c.req.query('lang');
    const products = await buildGoogleMerchantItems(lang);
    await recordFeedHealth('meta', products.length);
    c.header('Content-Type', 'application/json; charset=utf-8');
    return c.json({
      products: products.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        availability: item.availability,
        condition: item.condition,
        price: item.price,
        link: item.link,
        image_link: item.image_link,
        brand: item.brand,
        gtin: item.gtin || null,
        mpn: item.mpn || null,
        product_type: item.product_type,
        item_group_id: item.item_group_id,
        color: item.color || null,
        size: item.size || null,
        gender: item.gender,
        age_group: item.age_group,
        material: item.material || null,
        pattern: item.pattern || null,
      })),
    });
  })
);

merchantRouter.get(
  '/tiktok/products.json',
  asyncHandler(async (c) => {
    const lang = c.req.query('lang');
    const products = await buildGoogleMerchantItems(lang);
    await recordFeedHealth('tiktok', products.length);
    c.header('Content-Type', 'application/json; charset=utf-8');
    return c.json({
      products: products.map((item) => ({
        sku_id: item.id,
        title: item.title,
        description: item.description,
        availability: item.availability,
        price: item.price,
        link: item.link,
        image_link: item.image_link,
        brand: item.brand,
        item_group_id: item.item_group_id,
        google_product_category: item.google_product_category,
        product_type: item.product_type,
        color: item.color || null,
        size: item.size || null,
        gender: item.gender,
        age_group: item.age_group,
        material: item.material || null,
        pattern: item.pattern || null,
      })),
    });
  })
);

merchantRouter.get(
  '/meta/products.csv',
  asyncHandler(async (c) => {
    const lang = c.req.query('lang');
    const products = await buildGoogleMerchantItems(lang);
    const rows = products.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      availability: item.availability,
      condition: item.condition,
      price: item.price,
      link: item.link,
      image_link: item.image_link,
      brand: item.brand,
      gtin: item.gtin || '',
      mpn: item.mpn || '',
      google_product_category: item.google_product_category,
      product_type: item.product_type,
      item_group_id: item.item_group_id,
      color: item.color || '',
      size: item.size || '',
      gender: item.gender,
      age_group: item.age_group,
      material: item.material || '',
      pattern: item.pattern || '',
    }));

    c.header('Content-Type', 'text/csv; charset=utf-8');
    return c.text(
      toCsv(rows, [
        'id',
        'title',
        'description',
        'availability',
        'condition',
        'price',
        'link',
        'image_link',
        'brand',
        'gtin',
        'mpn',
        'google_product_category',
        'product_type',
        'item_group_id',
        'color',
        'size',
        'gender',
        'age_group',
        'material',
        'pattern',
      ])
    );
  })
);

merchantRouter.get(
  '/pinterest/products.csv',
  asyncHandler(async (c) => {
    const lang = c.req.query('lang');
    const products = await buildGoogleMerchantItems(lang);
    const rows = products.map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      link: item.link,
      image_link: item.image_link,
      price: item.price,
      availability: item.availability,
      condition: item.condition,
      google_product_category: item.google_product_category,
      product_type: item.product_type,
      brand: item.brand,
      item_group_id: item.item_group_id,
      color: item.color || '',
      size: item.size || '',
      material: item.material || '',
      pattern: item.pattern || '',
    }));

    c.header('Content-Type', 'text/csv; charset=utf-8');
    return c.text(
      toCsv(rows, [
        'id',
        'title',
        'description',
        'link',
        'image_link',
        'price',
        'availability',
        'condition',
        'google_product_category',
        'product_type',
        'brand',
        'item_group_id',
        'color',
        'size',
        'material',
        'pattern',
      ])
    );
  })
);

merchantRouter.get(
  '/tiktok/products.csv',
  asyncHandler(async (c) => {
    const lang = c.req.query('lang');
    const products = await buildGoogleMerchantItems(lang);
    const rows = products.map((item) => ({
      sku_id: item.id,
      title: item.title,
      description: item.description,
      availability: item.availability,
      price: item.price,
      link: item.link,
      image_link: item.image_link,
      brand: item.brand,
      item_group_id: item.item_group_id,
      google_product_category: item.google_product_category,
      product_type: item.product_type,
      color: item.color || '',
      size: item.size || '',
      gender: item.gender,
      age_group: item.age_group,
      material: item.material || '',
      pattern: item.pattern || '',
    }));

    c.header('Content-Type', 'text/csv; charset=utf-8');
    return c.text(
      toCsv(rows, [
        'sku_id',
        'title',
        'description',
        'availability',
        'price',
        'link',
        'image_link',
        'brand',
        'item_group_id',
        'google_product_category',
        'product_type',
        'color',
        'size',
        'gender',
        'age_group',
        'material',
        'pattern',
      ])
    );
  })
);

merchantRouter.get(
  '/google/diagnostics',
  verifyAdminOrMcpService,
  asyncHandler(async (c) => {
    const publishedProducts = await db.query.products.findMany({
      where: eq(products.status, 'published'),
      with: {
        variants: { with: { prices: true } },
        images: true,
      },
    });

    const variantIds = publishedProducts.flatMap((product) => product.variants?.map((variant) => variant.id) || []);
    const merchantRows = variantIds.length
      ? await db.select().from(product_variant_merchant).where(inArray(product_variant_merchant.variant_id, variantIds))
      : [];
    const merchantByVariant = new Map(merchantRows.map((row) => [row.variant_id, row]));

    const diagnostics = publishedProducts.flatMap((product) =>
      (product.variants || []).map((variant) => {
        const merchant = merchantByVariant.get(variant.id);
        const hasPrice = Boolean(variant.prices?.some((price) => Number(price.amount) > 0));
        const issues = [
          !product.handle ? 'missing_link' : null,
          !(product.images?.[0]?.url || product.thumbnail) ? 'missing_image' : null,
          !hasPrice ? 'missing_price' : null,
          !merchant?.color ? 'missing_color' : null,
          !merchant?.size && variant.title !== 'Default Variant' ? 'missing_size' : null,
          !merchant?.material && !variant.material && !product.material ? 'missing_material' : null,
          !merchant?.gtin && !merchant?.mpn && !variant.sku ? 'missing_identifier' : null,
        ].filter(Boolean);

        return {
          product_id: product.id,
          product_title: product.title,
          variant_id: variant.id,
          variant_title: variant.title,
          feed_enabled: merchant?.feed_enabled === true,
          eligible: issues.length === 0,
          issues,
        };
      })
    );

    return successResponse(
      c,
      {
        diagnostics,
        totals: {
          variants: diagnostics.length,
          eligible: diagnostics.filter((row) => row.eligible).length,
          with_issues: diagnostics.filter((row) => !row.eligible).length,
        },
      },
      'Google Merchant diagnostics generated successfully'
    );
  })
);

merchantRouter.get(
  '/google/products.xml',
  asyncHandler(async (c) => {
    const lang = c.req.query('lang');
    const items = await buildGoogleMerchantItems(lang);
    await recordFeedHealth('google_xml', items.length);
    const xmlItems = items
      .map(
        (item) => `
  <item>
    <g:id>${escapeXml(item.id)}</g:id>
    <g:item_group_id>${escapeXml(item.item_group_id)}</g:item_group_id>
    <g:title>${escapeXml(item.title)}</g:title>
    <g:description>${escapeXml(item.description)}</g:description>
    <g:link>${escapeXml(item.link)}</g:link>
    <g:image_link>${escapeXml(item.image_link)}</g:image_link>
    <g:availability>${escapeXml(item.availability)}</g:availability>
    <g:price>${escapeXml(item.price)}</g:price>
    <g:brand>${escapeXml(item.brand)}</g:brand>
    ${item.gtin ? `<g:gtin>${escapeXml(item.gtin)}</g:gtin>` : ''}
    ${item.mpn ? `<g:mpn>${escapeXml(item.mpn)}</g:mpn>` : ''}
    <g:condition>${escapeXml(item.condition)}</g:condition>
    <g:google_product_category>${escapeXml(item.google_product_category)}</g:google_product_category>
    ${item.color ? `<g:color>${escapeXml(item.color)}</g:color>` : ''}
    ${item.size ? `<g:size>${escapeXml(item.size)}</g:size>` : ''}
    <g:gender>${escapeXml(item.gender)}</g:gender>
    <g:age_group>${escapeXml(item.age_group)}</g:age_group>
    ${item.material ? `<g:material>${escapeXml(item.material)}</g:material>` : ''}
    ${item.pattern ? `<g:pattern>${escapeXml(item.pattern)}</g:pattern>` : ''}
    ${item.shipping_weight ? `<g:shipping_weight>${escapeXml(item.shipping_weight)} g</g:shipping_weight>` : ''}
    <g:product_type>${escapeXml(item.product_type)}</g:product_type>
  </item>`
      )
      .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>Odhvica Google Merchant Feed</title>
  <link>${escapeXml(SITE_URL)}</link>
  <description>Handcrafted Indian ethnic, boho, block-print and artisan fashion products</description>${xmlItems}
</channel>
</rss>`;

    return c.body(xml, 200, {
      'Content-Type': 'application/xml; charset=utf-8',
    });
  })
);

export default merchantRouter;
