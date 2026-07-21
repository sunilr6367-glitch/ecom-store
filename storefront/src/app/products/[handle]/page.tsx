import { Suspense } from 'react';
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound, permanentRedirect } from 'next/navigation';

import ProductGrid from '@/components/ProductGrid';
import { RecentlyViewedSection as RecentlyViewed } from '@/components/product/RecentlyViewed';
import ProductView from '@/components/product/ProductView';
import { ProductSchema } from '@/components/schema/ProductSchema';
import { api } from '@/lib/api';
import {
  buildProductMetadata,
  getOgLocaleForLocale,
  getCategoryPath,
  getPrimaryCategory,
} from '@/lib/seo';
import {
  filterStorefrontReadyProducts,
  isStorefrontProductReady,
} from '@/lib/storefront-product-quality';
import type { Product } from '@/types';

type Props = {
  params: Promise<{ handle: string }>;
};

async function getCanonicalProduct(handle: string) {
  const product = await api.getProduct(handle);

  if (!product || !product.id || !isStorefrontProductReady(product)) {
    notFound();
  }

  if (handle !== product.handle) {
    permanentRedirect(`/products/${product.handle}`);
  }

  return product;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;

  try {
    const product = await getCanonicalProduct(handle);
    const requestHeaders = await headers();
    return buildProductMetadata(product, {
      ogLocale: getOgLocaleForLocale(requestHeaders.get('x-odhvica-locale')),
    });
  } catch (error: unknown) {
    const isNotFound =
      (error as { digest?: string })?.digest === 'NEXT_NOT_FOUND' ||
      (error as { message?: string })?.message === 'NEXT_NOT_FOUND' ||
      (error as { status?: number })?.status === 404;

    if (isNotFound) {
      return {
        title: 'Product Not Found',
        robots: { index: false, follow: false },
      };
    }

    // Temporary API failure — keep page indexable
    const fallbackTitle = handle
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    return {
      title: fallbackTitle,
      robots: { index: true, follow: true },
    };
  }
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  const product = await getCanonicalProduct(handle).catch(() => notFound());

  const primaryCategory = getPrimaryCategory(product);
  const primaryCategoryPath = primaryCategory
    ? getCategoryPath(primaryCategory)
    : null;
  const breadcrumbItems = [
    { name: 'Home', path: '/' },
    primaryCategoryPath && primaryCategory
      ? {
          name: primaryCategory.name,
          path: primaryCategoryPath,
        }
      : { name: 'Products', path: '/products' },
    { name: product.title, path: `/products/${product.handle}` },
  ];

  return (
    <>
      <ProductSchema product={product} breadcrumbItems={breadcrumbItems} />

      <ProductView product={product} />

      <div className="ds-home-container border-t border-border-subtle py-token-xl md:py-token-2xl lg:py-token-3xl">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <p className="kv-tag">Keep Browsing</p>
          <h2 className="related-products-title">
            You May Also Like
          </h2>
          {primaryCategoryPath && primaryCategory && (
            <a
              href={primaryCategoryPath}
              className="related-products-link"
            >
              Shop More {primaryCategory.name}
            </a>
          )}
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          {product.semantic_related_products?.length &&
          filterStorefrontReadyProducts(product.semantic_related_products).length ? (
            <ProductGrid
              initialProducts={filterStorefrontReadyProducts(
                product.semantic_related_products
              ).slice(0, 4)}
            />
          ) : (
            <RelatedProducts
              categoryIds={product.categories?.map((category) => category.id) || []}
              collectionId={product.collection?.id}
              currentId={product.id}
            />
          )}
        </Suspense>
      </div>

      <RecentlyViewed />
    </>
  );
}

async function RelatedProducts({
  categoryIds,
  collectionId,
  currentId,
}: {
  categoryIds: string[];
  collectionId?: string;
  currentId: string;
}) {
  const uniqueCategoryIds = Array.from(new Set(categoryIds)).slice(0, 3);
  const requests: Promise<{ products?: Product[] }>[] = [];

  for (const categoryId of uniqueCategoryIds) {
    requests.push(api.getProducts({ category_id: categoryId, limit: 5 }));
  }

  if (requests.length === 0 && collectionId) {
    requests.push(api.getProducts({ collection_id: collectionId, limit: 5 }));
  } else if (collectionId) {
    requests.push(api.getProducts({ collection_id: collectionId, limit: 5 }));
  }

  if (requests.length === 0) return null;

  const results = await Promise.all(requests);
  const relatedMap = new Map<string, Product>();

  for (const result of results) {
    for (const product of result.products || []) {
      if (
        product.id === currentId ||
        relatedMap.has(product.id) ||
        !isStorefrontProductReady(product)
      ) {
        continue;
      }
      relatedMap.set(product.id, product);
      if (relatedMap.size >= 4) break;
    }
    if (relatedMap.size >= 4) break;
  }

  const related = Array.from(relatedMap.values()).slice(0, 4);

  if (related.length === 0) return null;

  return <ProductGrid initialProducts={related} />;
}
