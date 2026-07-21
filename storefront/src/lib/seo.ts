import type { Metadata } from 'next';

import type { Product } from '@/types';

export const SITE_NAME = 'Odhvica';
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://odhvica.com';
export const DEFAULT_OG_IMAGE = '/images/home/hero-main.jpg';

export function getProductPath(product: Pick<Product, 'handle' | 'id'>): string {
  return `/products/${product.handle || product.id}`;
}

export type TaxonomyNode = {
  id: string;
  name?: string;
  title?: string;
  slug?: string;
  handle?: string;
  description?: string | null;
  image?: string | null;
  header_image_url?: string | null;
  metadata?: Record<string, unknown> | null;
  children?: TaxonomyNode[];
};

export type BreadcrumbItem = {
  name: string;
  path: string;
};

type MetadataOptions = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  keywords?: string[];
  type?: 'website' | 'article';
  noindex?: boolean;
  canonicalUrl?: string | null;
  robotsFollow?: boolean;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  languages?: Record<string, string>;
  ogLocale?: string;
};

type CollectionMetadataOptions = {
  name: string;
  title?: string | null;
  path: string;
  description: string;
  image?: string | null;
  kind: 'category' | 'collection';
  keywords?: string[];
  noindex?: boolean;
  robotsFollow?: boolean;
  canonicalUrl?: string | null;
  languages?: Record<string, string>;
  ogLocale?: string;
};

type ProductPriceInfo = {
  amount: number;
  currencyCode: string;
  amountInMajor: number;
  display: string;
};

const COLOR_KEYWORDS = [
  'black',
  'blue',
  'brown',
  'green',
  'grey',
  'gray',
  'ivory',
  'lavender',
  'maroon',
  'mustard',
  'navy',
  'off white',
  'olive',
  'peach',
  'pink',
  'purple',
  'red',
  'rust',
  'teal',
  'white',
  'yellow',
];

const CATEGORY_KEYWORD_MAP: Record<
  string,
  { primary: string; secondary: string[]; label: string }
> = {
  kurti: {
    primary: 'handmade Indian block print top',
    secondary: [
      'kantha embroidery tunic',
      'Indian artisan blouse',
      'fair trade Indian top',
    ],
    label: 'Artisan Tops',
  },
  shawl: {
    primary: 'handmade Indian scarf wrap',
    secondary: [
      'kantha stitch stole',
      'block print scarf',
      'Indian artisan wrap',
    ],
    label: 'Scarves & Wraps',
  },
  saree: {
    primary: 'handwoven Indian textile',
    secondary: ['kantha fabric', 'block print cotton', 'artisan Indian cloth'],
    label: 'Indian Textiles',
  },
  default: {
    primary: 'handmade Indian clothing',
    secondary: [
      'kantha handmade clothing',
      'artisan Indian bags',
      'fair trade Indian textiles',
    ],
    label: 'Handmade Indian Goods',
  },
};

export function stripMarkdown(value: string | null | undefined): string {
  if (!value) return '';

  return value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[`*_>#-]/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncateAtWord(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;

  const truncated = value.slice(0, maxLength - 1);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  if (lastSpaceIndex > maxLength * 0.65) {
    return `${truncated.slice(0, lastSpaceIndex).trim()}...`;
  }

  return `${truncated.trim()}...`;
}

export function toAbsoluteUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return new URL(path, SITE_URL).toString();
}

export function normalizeCloudinaryDeliveryUrl(pathOrUrl?: string | null): string | null {
  if (!pathOrUrl) return null;
  const url = toAbsoluteUrl(pathOrUrl);
  if (!url.includes('/res.cloudinary.com/')) return url;
  const seoSafeUrl = url.replace(/\.(heic|heif)(?=$|[?#])/i, '.jpg');
  if (seoSafeUrl.includes('/f_auto')) return seoSafeUrl;
  return seoSafeUrl.replace('/upload/', '/upload/f_auto,q_auto/');
}

export const SUPPORTED_LOCALES = ['en-in', 'en-us', 'en-gb', 'en-au', 'en-eu'] as const;
const DEFAULT_LANGUAGES = ['en-IN', 'en-US', 'en-GB', 'en-AU', 'en-EU'];
const OG_LOCALE_BY_LANGUAGE: Record<string, string> = {
  'en-IN': 'en_IN',
  'en-US': 'en_US',
  'en-GB': 'en_GB',
  'en-AU': 'en_AU',
  'en-EU': 'en_150',
};

function inferLanguageFromPath(path: string) {
  const firstSegment = path.split('/').filter(Boolean)[0]?.toLowerCase();
  const matched = DEFAULT_LANGUAGES.find((language) => language.toLowerCase() === firstSegment);
  return matched || 'en-IN';
}

export function getOgLocaleForLocale(locale?: string | null) {
  if (!locale) return undefined;
  const normalized = locale.toLowerCase();
  const language = DEFAULT_LANGUAGES.find(
    (candidate) => candidate.toLowerCase() === normalized
  );
  return language ? OG_LOCALE_BY_LANGUAGE[language] : undefined;
}

export function buildDefaultLanguageAlternates(path: string): Record<string, string> {
  const normalizedPath = path === '/' ? '' : path;
  return {
    ...Object.fromEntries(DEFAULT_LANGUAGES.map((language) => {
      const localePath = language.toLowerCase();
      return [language, toAbsoluteUrl(`/${localePath}${normalizedPath}`)];
    })),
    'x-default': toAbsoluteUrl(path),
  };
}

export function titleFromHandle(handle: string): string {
  return handle
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function flattenCategories(
  categories: TaxonomyNode[],
  parent?: TaxonomyNode
): Array<TaxonomyNode & { parent?: TaxonomyNode }> {
  return categories.flatMap((category) => [
    { ...category, parent },
    ...flattenCategories(category.children || [], category),
  ]);
}

export function findCategoryById(
  categories: TaxonomyNode[],
  id: string
): (TaxonomyNode & { parent?: TaxonomyNode }) | undefined {
  return flattenCategories(categories).find((category) => category.id === id);
}

export function findCategoryBySlug(
  categories: TaxonomyNode[],
  slug: string
): (TaxonomyNode & { parent?: TaxonomyNode }) | undefined {
  return flattenCategories(categories).find(
    (category) => category.slug === slug || category.handle === slug
  );
}

export function getCategoryPath(category: {
  slug?: string;
  handle?: string;
}): string | null {
  const slug = category.slug || category.handle;
  return slug ? `/collections/${slug}` : null;
}

function getCategoryKeywordBundle(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes('kurti') || normalized.includes('top')) {
    return CATEGORY_KEYWORD_MAP.kurti;
  }

  if (
    normalized.includes('shawl') ||
    normalized.includes('wrap') ||
    normalized.includes('stole')
  ) {
    return CATEGORY_KEYWORD_MAP.shawl;
  }

  if (normalized.includes('saree') || normalized.includes('sari')) {
    return CATEGORY_KEYWORD_MAP.saree;
  }

  return CATEGORY_KEYWORD_MAP.default;
}

export function getPrimaryCategory(product: Product) {
  return product.categories?.[0];
}

export function getPrimaryCollectionOrCategoryLabel(product: Product): string {
  return (
    getPrimaryCategory(product)?.name ||
    product.collection?.title ||
    'Handmade Indian Goods'
  );
}

export function getProductCategoryLabel(product: Product): string {
  const directCategory = getPrimaryCategory(product)?.name;
  if (directCategory) return directCategory;

  const title = product.title.toLowerCase();

  if (title.includes('kurti')) return 'Kurti';
  if (title.includes('shawl')) return 'Shawl';
  if (title.includes('wrap')) return 'Wrap';
  if (title.includes('saree') || title.includes('sari')) return 'Saree';
  if (title.includes('dupatta') || title.includes('stole')) return 'Artisan Scarf';

  return 'Handmade Goods';
}

export function getProductMaterial(product: Product): string {
  const structuredMaterial = getProductAttribute(product, 'fabric') || getProductAttribute(product, 'material');
  if (structuredMaterial) return structuredMaterial;

  return (
    product.material ||
    product.variants?.find((variant) => variant.title)?.title ||
    'Premium Fabric'
  );
}

export function getProductPrice(product: Product): ProductPriceInfo | null {
  const prices = product.variants?.flatMap((variant) => variant.prices || []);
  if (!prices || prices.length === 0) return null;

  const preferredPrice =
    prices.find((price) => price.currency_code.toLowerCase() === 'inr') ||
    prices[0];

  const currencyCode = preferredPrice.currency_code.toUpperCase();
  const amountInMajor = preferredPrice.amount / 100;

  return {
    amount: preferredPrice.amount,
    currencyCode,
    amountInMajor,
    display: new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits: 0,
    }).format(amountInMajor),
  };
}

export function getProductColor(product: Product): string | null {
  const structuredColor = getProductAttribute(product, 'color');
  if (structuredColor) return structuredColor;

  const title = product.title.toLowerCase();
  return (
    COLOR_KEYWORDS.find((color) => title.includes(color))?.replace(
      /\b\w/g,
      (match) => match.toUpperCase()
    ) || null
  );
}

export function getProductAttribute(product: Product, code: string): string | null {
  const match = product.attributes?.find((attribute) => attribute.attribute_code === code);
  return match?.value_label || match?.raw_value || null;
}

export function buildProductPrimaryKeyword(product: Product): string {
  const handlePhrase = titleFromHandle(product.handle);
  if (handlePhrase) return handlePhrase;

  const color = getProductColor(product);
  const material = getProductMaterial(product);
  const category = getProductCategoryLabel(product);
  return [color, material, category].filter(Boolean).join(' ');
}

export function buildProductImageAlt(
  product: Product,
  index: number,
  explicitAlt?: string | null
): string {
  if (explicitAlt?.trim()) return explicitAlt.trim();

  const color = getProductColor(product);
  const material = getProductMaterial(product);
  const category = getProductCategoryLabel(product);
  const view =
    index === 0
      ? 'front view'
      : index === 1
        ? 'detail view'
        : `view ${index + 1}`;

  return [color, material, category, 'for Women', 'Odhvica', view]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildProductSeoTitle(product: Product): string {
  const customTitle = product.seo?.seo_title?.trim() || product.seo_title?.trim();
  if (customTitle) {
    return truncateAtWord(customTitle, 60);
  }

  const material = getProductMaterial(product);
  const category = getProductCategoryLabel(product);
  return truncateAtWord(
    `${product.title} | ${material} ${category} - ${SITE_NAME}`,
    60
  );
}

export function buildProductMetaDescription(product: Product): string {
  const customDescription =
    product.seo?.meta_description?.trim() || product.seo_description?.trim();
  if (customDescription) {
    return truncateAtWord(customDescription, 155);
  }

  const price = getProductPrice(product);
  const category = getProductCategoryLabel(product);
  const sourceDescription = stripMarkdown(product.description);
  const highlight =
    sourceDescription.split('. ').find(Boolean) ||
    `Handcrafted ${category.toLowerCase()} with premium detailing.`;
  const variantSummary = product.options
    ?.map((option) => option.title)
    .filter(Boolean)
    .join(', ');

  return truncateAtWord(
    `${product.title} — handmade in Jaipur, India. ${highlight} ${
      variantSummary ? `Available in ${variantSummary}. ` : ''
    }${price ? `From ${price.display}. ` : ''}Free worldwide shipping on orders over $75. Ships in tracked packaging.`,
    155
  );
}

export function buildProductKeywords(product: Product): string[] {
  const categoryLabel = getProductCategoryLabel(product);
  const keywordBundle = getCategoryKeywordBundle(categoryLabel);
  const discoveryKeywords = [
    product.discovery?.primary_keyword,
    ...(product.discovery?.secondary_keywords || []),
    ...(product.discovery?.long_tail_keywords || []),
    ...(product.discovery?.semantic_entities || []),
  ].filter(Boolean) as string[];

  return Array.from(new Set([
    buildProductPrimaryKeyword(product),
    ...discoveryKeywords,
    ...keywordBundle.secondary,
    `${categoryLabel.toLowerCase()} online`,
  ]));
}

export function buildCollectionTitle({
  name,
  kind,
}: {
  name: string;
  kind: 'category' | 'collection';
}): string {
  if (kind === 'category') {
    return truncateAtWord(`Handmade ${name} from India | ${SITE_NAME}`, 60);
  }

  return truncateAtWord(`${name} — Handmade in Jaipur | ${SITE_NAME}`, 60);
}

export function buildCollectionDescription({
  name,
  description,
  productCount,
}: {
  name: string;
  description?: string | null;
  productCount?: number;
}): string {
  const source = stripMarkdown(description);
  const summary =
    source || `Handmade by artisan women in Jaipur, India using traditional Kantha and block-print techniques.`;
  const countPart = productCount ? ` Shop ${productCount}+ styles.` : '';

  return truncateAtWord(
    `Explore ${SITE_NAME}'s ${name} collection - ${summary}${countPart} New arrivals added weekly.`,
    155
  );
}

export function createMetadata({
  title,
  description,
  path,
  image,
  keywords = [],
  type = 'website',
  noindex = false,
  canonicalUrl,
  robotsFollow = true,
  ogTitle,
  ogDescription,
  ogImage,
  twitterCard = 'summary_large_image',
  languages,
  ogLocale,
}: MetadataOptions): Metadata {
  const canonical = toAbsoluteUrl(canonicalUrl || path);
  const imageUrl =
    normalizeCloudinaryDeliveryUrl(ogImage || image || DEFAULT_OG_IMAGE) ||
    toAbsoluteUrl(DEFAULT_OG_IMAGE);
  const trimmedTitle = truncateAtWord(title, 60);
  const trimmedDescription = truncateAtWord(description, 155);
  const trimmedOgTitle = truncateAtWord(ogTitle || title, 60);
  const trimmedOgDescription = truncateAtWord(ogDescription || description, 155);
  const effectiveLanguages = languages || buildDefaultLanguageAlternates(path);
  const effectiveOgLocale =
    ogLocale || OG_LOCALE_BY_LANGUAGE[inferLanguageFromPath(path)] || 'en_IN';

  return {
    title: trimmedTitle,
    description: trimmedDescription,
    keywords,
    alternates: {
      canonical,
      languages: effectiveLanguages,
    },
    robots: noindex
      ? { index: false, follow: robotsFollow }
      : {
          index: true,
          follow: robotsFollow,
          googleBot: {
            index: true,
            follow: robotsFollow,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
    openGraph: {
      type,
      url: canonical,
      title: trimmedOgTitle,
      description: trimmedOgDescription,
      siteName: SITE_NAME,
      locale: effectiveOgLocale,
      images: [
        {
          url: imageUrl,
          alt: trimmedTitle,
        },
      ],
    },
    twitter: {
      card: twitterCard,
      title: trimmedOgTitle,
      description: trimmedOgDescription,
      images: [imageUrl],
    },
  };
}

export function buildHomepageMetadata(): Metadata {
  return createMetadata({
    title: 'Handmade Kantha Quilts, Bags & Clothing from India | Odhvica',
    description:
      'Odhvica — handmade kantha quilts, block-print clothing and artisan bags made by skilled women in Jaipur, India. Ships to USA, UK, EU, Australia and 50+ countries.',
    path: '/',
    image: DEFAULT_OG_IMAGE,
    keywords: [
      'kantha quilt handmade India',
      'artisan Indian bags',
      'block print clothing India',
      'fair trade handmade Indian textiles',
    ],
  });
}

export function buildCatalogMetadata(): Metadata {
  return createMetadata({
    title: 'Shop Handmade Kantha Quilts, Bags & Clothing | Odhvica',
    description:
      'Browse handmade kantha quilts, block-print clothing, artisan bags and scarves — each piece hand-stitched by skilled women in Jaipur, India. Ships worldwide.',
    path: '/products',
    image: DEFAULT_OG_IMAGE,
    keywords: [
      'kantha quilt buy online',
      'handmade Indian clothing',
      'artisan Indian bags',
      'block print clothing',
    ],
  });
}

export function buildCollectionMetadata({
  name,
  title,
  path,
  description,
  image,
  kind,
  keywords = [],
  noindex = false,
  robotsFollow = true,
  canonicalUrl,
  languages,
  ogLocale,
}: CollectionMetadataOptions): Metadata {
  const keywordBundle = getCategoryKeywordBundle(name);

  return createMetadata({
    title: title || buildCollectionTitle({ name, kind }),
    description,
    path,
    image,
    keywords: keywords.length > 0 ? keywords : [keywordBundle.primary, ...keywordBundle.secondary],
    noindex,
    robotsFollow,
    canonicalUrl,
    languages,
    ogLocale,
  });
}

export function buildBasicPageMetadata({
  title,
  description,
  path,
  image,
  keywords = [],
}: Omit<MetadataOptions, 'type' | 'noindex'>): Metadata {
  return createMetadata({
    title,
    description,
    path,
    image,
    keywords,
  });
}

export function buildArticleMetadata({
  title,
  description,
  path,
  image,
  keywords = [],
}: Omit<MetadataOptions, 'type' | 'noindex'>): Metadata {
  return createMetadata({
    title,
    description,
    path,
    image,
    keywords,
    type: 'article',
  });
}

export function buildNoindexPageMetadata({
  title,
  description,
  path,
  image,
  keywords = [],
  robotsFollow = false,
}: Omit<MetadataOptions, 'type'>): Metadata {
  return createMetadata({
    title,
    description,
    path,
    image,
    keywords,
    noindex: true,
    robotsFollow,
  });
}

export function buildProductMetadata(
  product: Product,
  options: { ogLocale?: string } = {}
): Metadata {
  const localizedMetadata = product.seo?.localized_metadata || {};
  const languages = Object.fromEntries(
    Object.entries(localizedMetadata)
      .filter(([, value]) => value?.path)
      .map(([locale, value]) => [locale, toAbsoluteUrl(value.path || getProductPath(product))])
  );

  return createMetadata({
    title: buildProductSeoTitle(product),
    description: buildProductMetaDescription(product),
    path: getProductPath(product),
    image: product.thumbnail || product.images?.[0]?.url || DEFAULT_OG_IMAGE,
    keywords: buildProductKeywords(product),
    canonicalUrl: product.seo?.canonical_url || undefined,
    noindex: product.seo?.robots_index === false,
    robotsFollow: product.seo?.robots_follow !== false,
    ogTitle: product.seo?.og_title,
    ogDescription: product.seo?.og_description,
    ogImage: product.seo?.og_image_url,
    twitterCard:
      product.seo?.twitter_card === 'summary'
        ? 'summary'
        : 'summary_large_image',
    languages: Object.keys(languages).length > 0 ? languages : buildDefaultLanguageAlternates(getProductPath(product)),
    ogLocale: options.ogLocale,
  });
}

export function buildOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: toAbsoluteUrl('/favicon.ico'),
    sameAs: [
      'https://www.instagram.com/odhvica.store/',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: ['English', 'Hindi'],
      email: 'support@odhvica.com',
    },
  };
}

export function buildWebsiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path),
    })),
  };
}

export function buildProductJsonLd(product: Product) {
  const price = getProductPrice(product);
  const images =
    product.images
      ?.map((image) => normalizeCloudinaryDeliveryUrl(image.url))
      .filter(Boolean) ||
    (product.thumbnail ? [normalizeCloudinaryDeliveryUrl(product.thumbnail)] : []);

  const artisan = (product as Product & {
    artisan?: {
      name?: string;
      slug?: string;
      craft_specialty?: string | null;
    } | null;
  }).artisan;
  const approvedReviewCount = Number(product.review_count || 0);

  const baseProduct = {
    '@context': 'https://schema.org',
    '@type': product.variants && product.variants.length > 1 ? 'ProductGroup' : 'Product',
    name: product.title,
    image: images,
    description: buildProductMetaDescription(product),
    sku: product.variants?.[0]?.sku || undefined,
    productGroupID: product.variants && product.variants.length > 1 ? product.id : undefined,
    brand: {
      '@type': 'Brand',
      name: SITE_NAME,
    },
    creator: artisan?.name
      ? {
          '@type': 'Person',
          name: artisan.name,
          url: artisan.slug ? toAbsoluteUrl(`/artisans/${artisan.slug}`) : undefined,
          knowsAbout: artisan.craft_specialty || undefined,
        }
      : undefined,
    isRelatedTo: toAbsoluteUrl('/size-guide'),
    category: getProductCategoryLabel(product),
    material: getProductMaterial(product),
    pattern: getProductAttribute(product, 'pattern') || product.variants?.[0]?.merchant?.pattern || undefined,
    color: getProductColor(product) || product.variants?.[0]?.merchant?.color || undefined,
    offers: price
      ? {
          '@type': 'Offer',
          url: toAbsoluteUrl(getProductPath(product)),
          priceCurrency: price.currencyCode,
          price: price.amountInMajor,
          availability:
            (product.variants?.[0]?.inventory_quantity || 0) > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
          itemCondition: 'https://schema.org/NewCondition',
          shippingDetails: {
            '@type': 'OfferShippingDetails',
            shippingDestination: [
              { '@type': 'DefinedRegion', addressCountry: 'IN' },
              { '@type': 'DefinedRegion', addressCountry: 'US' },
              { '@type': 'DefinedRegion', addressCountry: 'GB' },
              { '@type': 'DefinedRegion', addressCountry: 'AU' },
            ],
            deliveryTime: {
              '@type': 'ShippingDeliveryTime',
              handlingTime: {
                '@type': 'QuantitativeValue',
                minValue: 1,
                maxValue: 3,
                unitCode: 'DAY',
              },
              transitTime: {
                '@type': 'QuantitativeValue',
                minValue: 8,
                maxValue: 18,
                unitCode: 'DAY',
              },
            },
          },
          hasMerchantReturnPolicy: {
            '@type': 'MerchantReturnPolicy',
            applicableCountry: ['IN', 'US', 'GB', 'AU'],
            returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
            merchantReturnDays: 30,
            returnMethod: 'https://schema.org/ReturnByMail',
            returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
          },
          seller: {
            '@type': 'Organization',
            name: SITE_NAME,
          },
        }
      : undefined,
    aggregateRating:
      product.avg_rating && approvedReviewCount >= 3
        ? {
            '@type': 'AggregateRating',
            ratingValue: product.avg_rating,
            reviewCount: approvedReviewCount,
          }
        : undefined,
    hasVariant:
      product.variants && product.variants.length > 1
        ? product.variants.map((variant) => {
            const variantPrice =
              variant.prices?.find((row) => row.currency_code.toLowerCase() === 'inr') ||
              variant.prices?.[0];
            const amountInMajor = variantPrice ? variantPrice.amount / 100 : undefined;
            return {
              '@type': 'Product',
              name: `${product.title} - ${variant.title}`,
              sku: variant.sku || undefined,
              gtin: variant.merchant?.gtin || undefined,
              mpn: variant.merchant?.mpn || variant.sku || undefined,
              color: variant.merchant?.color || getProductColor(product) || undefined,
              size: variant.merchant?.size || variant.title || undefined,
              material: variant.merchant?.material || getProductMaterial(product),
              pattern: variant.merchant?.pattern || getProductAttribute(product, 'pattern') || undefined,
              offers: variantPrice
                ? {
                    '@type': 'Offer',
                    url: toAbsoluteUrl(getProductPath(product)),
                    priceCurrency: variantPrice.currency_code.toUpperCase(),
                    price: amountInMajor,
                    availability:
                      (variant.inventory_quantity || 0) > 0
                        ? 'https://schema.org/InStock'
                        : 'https://schema.org/OutOfStock',
                    itemCondition: 'https://schema.org/NewCondition',
                  }
                : undefined,
            };
          })
        : undefined,
  };

  return {
    ...baseProduct,
    ...(product.seo?.schema_overrides || {}),
  };
}

export function buildSizeChartJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SizeChart',
    name: `${SITE_NAME} Size Guide`,
    url: toAbsoluteUrl('/size-guide'),
    description:
      'Odhvica size guide for handcrafted clothing, jackets, and accessories with US, UK, EU, and India-friendly measurement references.',
  };
}

export function buildPersonJsonLd(artisan: {
  name: string;
  slug: string;
  bio?: string | null;
  craft_specialty?: string | null;
  location?: string | null;
  image_url?: string | null;
  knows_about?: unknown;
  has_occupation?: string | null;
  same_as?: unknown;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: artisan.name,
    url: toAbsoluteUrl(`/artisans/${artisan.slug}`),
    description: artisan.bio || undefined,
    image: normalizeCloudinaryDeliveryUrl(artisan.image_url),
    knowsAbout: Array.isArray(artisan.knows_about)
      ? artisan.knows_about
      : artisan.craft_specialty
        ? [artisan.craft_specialty]
        : undefined,
    hasOccupation: artisan.has_occupation || artisan.craft_specialty || 'Textile artisan',
    homeLocation: artisan.location
      ? {
          '@type': 'Place',
          name: artisan.location,
        }
      : undefined,
    sameAs: Array.isArray(artisan.same_as) ? artisan.same_as : undefined,
  };
}

export function buildProductFaqJsonLd(product: Product) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customFaqs = (product as any).metadata?.faq_items as Array<{question: string, answer: string}> | undefined;
  
  if (customFaqs && Array.isArray(customFaqs) && customFaqs.length > 0) {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: customFaqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      })),
    };
  }

  const material = getProductMaterial(product);
  const category = getProductCategoryLabel(product);
  const craft = getProductAttribute(product, 'technique') || 'handcrafted artisan technique';
  const care = product.care_instructions || 'Dry clean or gentle hand wash separately.';

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What is ${product.title} made from?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${product.title} is made with ${material}.`,
        },
      },
      {
        '@type': 'Question',
        name: `How is this ${category.toLowerCase()} crafted?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `This piece is connected to ${craft} and Odhvica's Jaipur artisan-made fashion positioning.`,
        },
      },
      {
        '@type': 'Question',
        name: `How should I care for ${product.title}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: care,
        },
      },
    ],
  };
}

export function buildCollectionPageJsonLd({
  name,
  path,
  description,
  image,
  items,
}: {
  name: string;
  path: string;
  description: string;
  image?: string | null;
  items?: Array<{ name: string; path: string }>;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    url: toAbsoluteUrl(path),
    description,
    image: normalizeCloudinaryDeliveryUrl(image),
    mainEntity:
      items && items.length > 0
        ? {
            '@type': 'ItemList',
            itemListElement: items.map((item, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: item.name,
              url: toAbsoluteUrl(item.path),
            })),
          }
        : undefined,
  };
}

export function buildWebPageJsonLd({
  title,
  path,
  description,
}: {
  title: string;
  path: string;
  description: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    url: toAbsoluteUrl(path),
    description,
  };
}

export function buildArticleJsonLd({
  title,
  path,
  description,
  image,
  publishedAt,
  updatedAt,
}: {
  title: string;
  path: string;
  description: string;
  image?: string | null;
  publishedAt?: string;
  updatedAt?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: image ? [normalizeCloudinaryDeliveryUrl(image)] : [],
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: toAbsoluteUrl('/favicon.ico'),
      },
    },
    mainEntityOfPage: toAbsoluteUrl(path),
    datePublished: publishedAt,
    dateModified: updatedAt || publishedAt,
  };
}

export function serializeJsonLd(
  payload: Record<string, unknown> | Array<Record<string, unknown>>
): string {
  return JSON.stringify(payload)
    .replace(/</g, '\\u003C')
    .replace(/>/g, '\\u003E');
}

export function buildProductSeoContent(product: Product) {
  const primaryKeyword = buildProductPrimaryKeyword(product);
  const category = getProductCategoryLabel(product);
  const material = getProductMaterial(product);
  const price = getProductPrice(product);
  const categoryLink = getCategoryPath(getPrimaryCategory(product) || {});
  const collectionLink = product.collection
    ? `/collections/${product.collection.handle || product.collection.id}`
    : null;
  const cleanDescription = stripMarkdown(product.description);
  const firstSentence =
    cleanDescription.split('. ').find(Boolean) ||
    `${product.title} is designed for women who want handcrafted Indian style with polished everyday versatility.`;

  return {
    primaryKeyword,
    intro: `${product.title} is a handmade ${category.toLowerCase()} from ${SITE_NAME}, crafted in ${material.toLowerCase()} by skilled artisan women in Jaipur, India. ${firstSentence} Each piece is one of a kind — no two are identical because every stitch is placed by hand. This makes a beautiful gift and a lasting everyday piece. Free worldwide shipping on orders over $75.`,
    bullets: [
      { label: 'Fabric', value: material },
      {
        label: 'Craft',
        value:
          cleanDescription.split('. ').find(Boolean) ||
          'Handmade by artisan women in Jaipur',
      },
      { label: 'Made in', value: 'Jaipur, India' },
      {
        label: 'Fit',
        value: product.options?.some((option) => option.title === 'Size')
          ? 'Regular'
          : 'Relaxed',
      },
      {
        label: 'Care',
        value: product.care_instructions || 'Dry clean or gentle hand wash',
      },
      {
        label: 'Price',
        value: price?.display || 'Contact for pricing',
      },
    ],
    styling: `Ships from Jaipur, India in tracked packaging. Arrives in 10–18 business days. ${
      categoryLink
        ? `Browse more ${getPrimaryCategory(product)?.name || category} pieces in our handmade collection.`
        : 'Explore more handmade pieces from our Jaipur workshop.'
    }`,
    categoryLink,
    collectionLink,
  };
}
