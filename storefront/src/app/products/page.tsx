import type { Metadata } from 'next';

import CatalogClient from '@/components/products/CatalogClient';
import { api } from '@/lib/api';
import { buildCatalogMetadata } from '@/lib/seo';
import { filterStorefrontReadyProducts } from '@/lib/storefront-product-quality';
import type { Product } from '@/types';

export const revalidate = 60;

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export const metadata: Metadata = buildCatalogMetadata();

async function fetchWithTimeout<T>(
  promise: Promise<T>,
  ms: number
): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`Request timeout after ${ms}ms`)),
      ms
    );
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const categoryId = params.category_id as string | undefined;
  const tagId = params.tag_id as string | undefined;
  const collectionId = params.collection_id as string | undefined;
  const attributeCode = params.attribute_code as string | undefined;
  const attributeValue = params.attribute_value as string | undefined;
  const minPrice = params.min_price as string | undefined;
  const maxPrice = params.max_price as string | undefined;
  const sort = params.sort as string | undefined;

  let productsData: {
    products: Product[];
    total: number;
    limit?: number;
    offset?: number;
  } = { products: [], total: 0 };
  let categoriesData = { categories: [] };
  let tagsData = { tags: [] };
  let collectionsData = { collections: [] };

  try {
    const productsResult = await fetchWithTimeout(
      api.getProducts({
        limit: 50,
        category_id: categoryId,
        tag_id: tagId,
        collection_id: collectionId,
        attribute_code: attributeCode,
        attribute_value: attributeValue,
        min_price: minPrice ? Number(minPrice) : undefined,
        max_price: maxPrice ? Number(maxPrice) : undefined,
        sort,
        cache: false,
      }),
      15000
    );
    const readyProducts = filterStorefrontReadyProducts(productsResult?.products || []);
    productsData = {
      ...(productsResult || { products: [], total: 0 }),
      products: readyProducts,
      total: readyProducts.length,
    };

    const [categoriesResult, tagsResult, collectionsResult] =
      await Promise.allSettled([
        api.getCategories(),
        api.getTags(),
        api.getCollections(),
      ]);

    if (categoriesResult.status === 'fulfilled') {
      categoriesData = categoriesResult.value || { categories: [] };
    }

    if (tagsResult.status === 'fulfilled') {
      tagsData = tagsResult.value || { tags: [] };
    }

    if (collectionsResult.status === 'fulfilled') {
      collectionsData = collectionsResult.value || { collections: [] };
    }
  } catch {
    // Keep resilient empty fallbacks for the catalog page.
  }

  return (
    <CatalogClient
      initialProducts={productsData.products || []}
      categories={categoriesData.categories || []}
      tags={tagsData.tags || []}
      collections={collectionsData.collections || []}
      totalProducts={productsData.total || 0}
    />
  );
}
