import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound, permanentRedirect, redirect } from 'next/navigation';

import ListingHero from '@/components/listing/ListingHero';
import ListingPageClient from '@/components/listing/ListingPageClient';
import { api } from '@/lib/api';
import {
  buildBreadcrumbJsonLd,
  buildCollectionDescription,
  buildCollectionMetadata,
  buildCollectionPageJsonLd,
  findCategoryBySlug,
  getOgLocaleForLocale,
  serializeJsonLd,
  titleFromHandle,
} from '@/lib/seo';
import { filterStorefrontReadyProducts } from '@/lib/storefront-product-quality';
import type { Product } from '@/types';

export const revalidate = 60;

type Props = {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ sort?: string; preview?: string; tag_id?: string; min_price?: string; max_price?: string }>;
};

type LandingSeoFields = {
  product_count?: number;
  seo_title?: string | null;
  seo_desc?: string | null;
  canonical_url?: string | null;
  is_indexable?: boolean | null;
  robots_policy?: string | null;
  faq_items?: Array<{ question: string; answer: string }> | null;
  answer_capsule?: string | null;
};

type CategoryNode = {
  id: string;
  name?: string;
  slug?: string;
  handle?: string;
  description?: string | null;
  image?: string | null;
  header_image_url?: string | null;
  is_active?: boolean;
  seo_title?: string | null;
  seo_desc?: string | null;
  children?: CategoryNode[];
  parent?: CategoryNode;
};

type LandingData =
  | ({
      kind: 'collection';
      id: string;
      handle: string;
      title: string;
      description: string;
      image?: string | null;
      status?: string;
      type?: string;
    } & LandingSeoFields)
  | ({
      kind: 'seo_landing';
      id: string;
      handle: string;
      title: string;
      description: string;
      image?: string | null;
      status?: string;
      type?: string;
      intro_content?: string | null;
      outro_content?: string | null;
      rule_definition?: Record<string, unknown> | null;
    } & LandingSeoFields)
  | ({
      kind: 'category';
      id: string;
      handle: string;
      title: string;
      description: string;
      image?: string | null;
      is_active: boolean;
      children?: CategoryNode[];
    } & LandingSeoFields);

function siblingLinks(categories: CategoryNode[], activeId: string) {
  return categories
    .filter((category) => category.id !== activeId && category.is_active !== false)
    .slice(0, 6)
    .map((category) => ({
      label: category.name || titleFromHandle(category.slug || category.handle || ''),
      href: `/collections/${category.slug || category.handle}`,
    }))
    .filter((item) => item.href !== '/collections/undefined');
}

async function resolveLanding(handle: string): Promise<LandingData | null> {
  const [categoriesData, collectionsData, seoLandingPage] = await Promise.all([
    api.getCategories(),
    api.getCollections(),
    api.getSeoLandingPage(handle),
  ]);

  const category = findCategoryBySlug(categoriesData.categories || [], handle) as CategoryNode | undefined;
  if (category) {
    const title = category.name || titleFromHandle(handle);
    return {
      kind: 'category',
      id: category.id,
      handle: category.slug || category.handle || handle,
      title,
      description:
        category.description ||
        `Shop ${title} at Odhvica, handmade in Jaipur with artisan craft and thoughtful finishing.`,
      image: category.header_image_url || category.image,
      is_active: category.is_active !== false,
      seo_title: category.seo_title,
      seo_desc: category.seo_desc,
      children: category.children,
    };
  }

  let collection = (collectionsData.collections || []).find(
    (item: { id: string; handle?: string }) =>
      item.handle === handle || item.id === handle
  );

  const directCollection = await api.getCollection(handle);
  if (directCollection.collection) {
    collection = directCollection.collection;
  }

  if (!collection && seoLandingPage?.status === 'active') {
    return {
      kind: 'seo_landing',
      id: seoLandingPage.id,
      handle: seoLandingPage.slug || handle,
      title: seoLandingPage.title || titleFromHandle(handle),
      description:
        seoLandingPage.meta_description ||
        buildCollectionDescription({
          name: seoLandingPage.title || titleFromHandle(handle),
          description: seoLandingPage.intro_content || undefined,
        }),
      image: seoLandingPage.metadata?.image_url || null,
      status: seoLandingPage.status,
      type: 'seo_landing',
      intro_content: seoLandingPage.intro_content,
      outro_content: seoLandingPage.outro_content,
      rule_definition: seoLandingPage.rule_definition,
      product_count: seoLandingPage.metadata?.product_count,
    };
  }

  if (!collection) return null;

  if (collection.handle && collection.handle !== handle) {
    permanentRedirect(`/collections/${collection.handle}`);
  }

  const title = collection.title || titleFromHandle(handle);

  return {
    kind: 'collection',
    id: collection.id,
    handle: collection.handle || handle,
    title,
    description: buildCollectionDescription({
      name: title,
      description:
        typeof collection.metadata?.description === 'string'
          ? collection.metadata.description
          : collection.description || undefined,
    }),
    image: collection.cover_image_url || collection.image,
    status: collection.status,
    type: collection.type,
    product_count: collection.product_count,
    seo_title: collection.seo_title,
    seo_desc: collection.seo_desc,
    canonical_url: collection.canonical_url,
    is_indexable: collection.is_indexable,
    robots_policy: collection.robots_policy,
    faq_items: collection.faq_items,
    answer_capsule: collection.answer_capsule,
  };
}

async function fetchLandingProductCount(landing: LandingData) {
  const response = await api.getProducts({
    limit: 100,
    ...(landing.kind === 'collection'
      ? { collection_id: landing.id }
      : landing.kind === 'category'
      ? { category_id: landing.id }
      : {
          category_id:
            typeof landing.rule_definition?.category_id === 'string'
              ? landing.rule_definition.category_id
              : undefined,
          collection_id:
            typeof landing.rule_definition?.collection_id === 'string'
              ? landing.rule_definition.collection_id
              : undefined,
          search:
            typeof landing.rule_definition?.search === 'string'
              ? landing.rule_definition.search
              : undefined,
          attribute_code:
            typeof landing.rule_definition?.attribute_code === 'string'
              ? landing.rule_definition.attribute_code
              : undefined,
          attribute_value:
            typeof landing.rule_definition?.attribute_value === 'string'
              ? landing.rule_definition.attribute_value
              : undefined,
        }),
  });

  return filterStorefrontReadyProducts(response.products || []).length;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const landing = await resolveLanding(handle);

  if (!landing) {
    return {
      title: 'Collection Not Found',
      robots: { index: false, follow: false },
    };
  }

  const productCount = await fetchLandingProductCount(landing);
  const requestHeaders = await headers();
  const robotsPolicy = landing.robots_policy || 'index,follow';
  const noindex =
    productCount === 0 ||
    landing.is_indexable === false ||
    (landing.kind === 'category' ? !landing.is_active : false) ||
    robotsPolicy.startsWith('noindex');

  return buildCollectionMetadata({
    name: landing.title,
    title: landing.seo_title,
    path: `/collections/${landing.handle}`,
    description: landing.seo_desc || landing.description,
    image: landing.image,
    kind: landing.kind === 'category' ? 'category' : 'collection',
    noindex,
    robotsFollow: !robotsPolicy.endsWith('nofollow'),
    canonicalUrl: landing.canonical_url || undefined,
    ogLocale: getOgLocaleForLocale(requestHeaders.get('x-odhvica-locale')),
  });
}

function productParamsForLanding(landing: LandingData) {
  if (landing.kind === 'collection') {
    return { collection_id: landing.id };
  }
  if (landing.kind === 'category') {
    return { category_id: landing.id };
  }

  return {
    category_id:
      typeof landing.rule_definition?.category_id === 'string'
        ? landing.rule_definition.category_id
        : undefined,
    collection_id:
      typeof landing.rule_definition?.collection_id === 'string'
        ? landing.rule_definition.collection_id
        : undefined,
    search:
      typeof landing.rule_definition?.search === 'string'
        ? landing.rule_definition.search
        : undefined,
    attribute_code:
      typeof landing.rule_definition?.attribute_code === 'string'
        ? landing.rule_definition.attribute_code
        : undefined,
    attribute_value:
      typeof landing.rule_definition?.attribute_value === 'string'
        ? landing.rule_definition.attribute_value
        : undefined,
  };
}

export default async function CollectionPage({ params, searchParams }: Props) {
  const { handle } = await params;
  const { sort, preview, tag_id, min_price, max_price } = await searchParams;
  const landing = (await resolveLanding(handle)) || notFound();

  if (landing.kind === 'collection' && landing.status === 'draft' && preview !== 'true') {
    redirect('/collections');
  }
  if (landing.kind === 'category' && !landing.is_active) {
    notFound();
  }

  const productParams = productParamsForLanding(landing);
  const [productsResponse, tagsResponse, allCollectionsResponse, categoriesData] = await Promise.all([
    api.getProducts({
      limit: 12,
      sort,
      tag_id,
      min_price: min_price ? Number(min_price) : undefined,
      max_price: max_price ? Number(max_price) : undefined,
      ...productParams,
      cache: false,
    }),
    api.getTags(),
    landing.kind === 'collection' && landing.type
      ? api.getCollections()
      : Promise.resolve(null),
    landing.kind === 'category'
      ? api.getCategories()
      : Promise.resolve(null),
  ]);

  const products = filterStorefrontReadyProducts(productsResponse.products || []);
  const totalProducts = productsResponse.total;

  let relatedLinks: Array<{ label: string; href: string }> = [];
  if (landing.kind === 'category') {
    const categories = (categoriesData?.categories || []) as CategoryNode[];
    const children = landing.children || [];
    relatedLinks = [
      ...children
        .filter((child) => child.is_active !== false && (child.slug || child.handle))
        .map((child) => ({
          label: child.name || titleFromHandle(child.slug || child.handle || ''),
          href: `/collections/${child.slug || child.handle}`,
        })),
      ...siblingLinks(categories, landing.id),
      { label: 'Shop all products', href: '/products' },
    ].slice(0, 8);
  }

  const relatedCollections: Array<{ id: string; handle: string; title: string }> =
    allCollectionsResponse
      ? (allCollectionsResponse.collections || [])
          .filter((collection: {
            id: string;
            type?: string;
            status?: string;
            handle?: string;
            product_count?: number;
          }) =>
            collection.id !== landing.id &&
            collection.type === ('type' in landing ? landing.type : undefined) &&
            collection.status === 'active' &&
            collection.handle &&
            (collection.product_count ?? 0) > 0
          )
          .slice(0, 3)
      : [];

  const schema = [
    buildCollectionPageJsonLd({
      name: landing.title,
      path: `/collections/${landing.handle}`,
      description: landing.description,
      image: landing.image,
      items: products.map((product: Product) => ({
        name: product.title,
        path: `/products/${product.handle || product.id}`,
      })),
    }),
    buildBreadcrumbJsonLd(
      landing.kind === 'category'
        ? [
            { name: 'Home', path: '/' },
            { name: 'Shop', path: '/products' },
            { name: landing.title, path: `/collections/${landing.handle}` },
          ]
        : [
            { name: 'Home', path: '/' },
            { name: 'Collections', path: '/collections' },
            { name: landing.title, path: `/collections/${landing.handle}` },
          ]
    ),
    ...(landing.kind === 'collection' && landing.faq_items && landing.faq_items.length > 0
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: landing.faq_items.map((item) => ({
              '@type': 'Question',
              name: item.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: item.answer,
              },
            })),
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-surface-paper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
      />

      <ListingHero
        eyebrow={
          landing.kind === 'category'
            ? 'Category'
            : landing.kind === 'seo_landing'
            ? 'Edit'
            : 'Collection'
        }
        title={landing.title}
        description={landing.description}
        image={landing.image}
        count={totalProducts}
        variant={landing.kind === 'category' ? 'category' : 'collection'}
        breadcrumbs={
          landing.kind === 'category'
            ? [
                { label: 'Home', href: '/' },
                { label: 'Shop', href: '/products' },
                { label: landing.title },
              ]
            : [
                { label: 'Home', href: '/' },
                { label: 'Collections', href: '/collections' },
                { label: landing.title },
              ]
        }
      />

      {landing.kind === 'category' && landing.children && landing.children.length > 0 ? (
        <section className="ds-page-container border-b border-border-subtle py-5">
          <div className="flex flex-wrap gap-3">
            {landing.children
              .filter((child) => child.is_active !== false && (child.slug || child.handle))
              .map((child) => (
                <Link
                  key={child.id}
                  href={`/collections/${child.slug || child.handle}`}
                  className="rounded-full border border-border-subtle px-4 py-2 text-body-sm text-secondary transition-colors hover:border-primary hover:text-primary"
                >
                  {child.name || titleFromHandle(child.slug || child.handle || '')}
                </Link>
              ))}
          </div>
        </section>
      ) : null}

      <ListingPageClient
        basePath={`/collections/${landing.handle}`}
        initialProducts={products}
        totalProducts={totalProducts}
        tags={tagsResponse.tags || []}
        fixedParams={{
          category_id: productParams.category_id,
          collection_id: productParams.collection_id,
          search: productParams.search,
          attribute_code: productParams.attribute_code,
          attribute_value: productParams.attribute_value,
        }}
        intro={
          landing.kind === 'category'
            ? landing.description
            : landing.answer_capsule ||
              (landing.kind === 'seo_landing' && landing.intro_content
                ? landing.intro_content
                : null)
        }
        emptyTitle={
          landing.kind === 'category'
            ? `No products in ${landing.title} right now.`
            : `This ${landing.kind === 'seo_landing' ? 'edit' : 'collection'} is being curated.`
        }
        emptyLinks={
          landing.kind === 'category'
            ? relatedLinks
            : [
                { label: 'View all collections', href: '/collections' },
                { label: 'Shop all products', href: '/products' },
              ]
        }
      />

      {landing.kind === 'collection' && relatedCollections.length > 0 ? (
        <section className="ds-page-container border-t border-border-subtle py-10 md:py-14">
          <h2 className="collection-section-title mb-6">Related collections</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {relatedCollections.map((collection) => (
              <Link
                key={collection.id}
                href={`/collections/${collection.handle}`}
                className="border border-border-subtle p-5 transition-colors hover:border-primary"
              >
                <p className="collection-card-kicker">More in this edit</p>
                <p className="collection-card-product-title mt-2">
                  {collection.title}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {landing.kind === 'seo_landing' && landing.outro_content ? (
        <section className="ds-page-container border-t border-border-subtle py-10">
          <p className="collection-detail-copy mx-auto max-w-3xl text-center">
            {landing.outro_content}
          </p>
        </section>
      ) : null}

      {landing.kind === 'collection' && landing.faq_items && landing.faq_items.length > 0 ? (
        <section className="ds-page-container border-t border-border-subtle py-10">
          <div className="mx-auto max-w-3xl space-y-6">
            {landing.faq_items.map((item) => (
              <details
                key={item.question}
                className="border-b border-border-subtle pb-4"
              >
                <summary className="cursor-pointer collection-sidebar-heading">
                  {item.question}
                </summary>
                <p className="collection-detail-copy mt-3">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
