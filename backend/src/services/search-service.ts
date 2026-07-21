// @ts-ignore
import { Meilisearch } from 'meilisearch';
import { db } from '../db/client';
import { products } from '../db/schema';
import { eq } from 'drizzle-orm';

// Initialize Meilisearch client lazily
let client: Meilisearch | null = null;

export function getSearchClient(): Meilisearch {
  if (!client) {
    const host = process.env.MEILISEARCH_HOST;
    const apiKey = process.env.MEILISEARCH_API_KEY;

    if (!host) {
      throw new Error('MEILISEARCH_HOST is not configured');
    }

    client = new Meilisearch({
      host,
      apiKey,
    });
  }
  return client;
}

const INDEX_NAME = 'products';

export async function initSearchIndex() {
  const searchClient = getSearchClient();
  
  // Create index if it doesn't exist
  await searchClient.createIndex(INDEX_NAME, { primaryKey: 'id' });
  const index = searchClient.index(INDEX_NAME);

  // Define searchable attributes (fields that can be queried)
  await index.updateSearchableAttributes([
    'title',
    'description',
    'material',
    'category_name'
  ]);

  // Define filterable attributes (fields used for facets/filtering)
  await index.updateFilterableAttributes([
    'collection_id',
    'status',
    'price',
    'material',
    'category_name'
  ]);

  // Define sortable attributes
  await index.updateSortableAttributes([
    'price',
    'created_at'
  ]);

  console.log('[SearchService] Meilisearch index settings configured successfully.');
}

export async function addOrUpdateProducts(documents: any[]) {
  if (documents.length === 0) return;
  const searchClient = getSearchClient();
  const index = searchClient.index(INDEX_NAME);
  await index.addDocuments(documents);
}

export async function deleteProduct(productId: string) {
  const searchClient = getSearchClient();
  const index = searchClient.index(INDEX_NAME);
  await index.deleteDocument(productId);
}

export async function syncSingleProductToMeilisearch(productId: string) {
  if (!process.env.MEILISEARCH_HOST || !process.env.MEILISEARCH_API_KEY) return;
  try {
    const product = (await db.query.products.findFirst({
      where: eq(products.id, productId),
      with: {
        variants: {
          with: { prices: true }
        },
        categories: {
          with: { category: true }
        },
        seo: true
      }
    } as any)) as any;

    if (!product) {
      await deleteProduct(productId);
      return;
    }

    if (product.status !== 'published') {
      await deleteProduct(productId);
      return;
    }

    let minPrice = 0;
    if (product.variants && product.variants.length > 0) {
      const prices = (product.variants as any[])
        .flatMap((v: any) => v.prices || [])
        .filter((p: any) => p && p.currency_code?.toLowerCase() === 'inr')
        .map((p: any) => Number(p.amount) / 100);
      
      if (prices.length > 0) {
        minPrice = Math.min(...prices);
      }
    }

    const seoDetails = product.seo?.[0];

    const document = {
      id: product.id,
      title: seoDetails?.seo_title || product.seo_title || product.title,
      description: seoDetails?.meta_description || product.seo_description || product.description || product.title,
      handle: product.handle,
      thumbnail: product.thumbnail,
      price: minPrice,
      collection_id: product.collection_id,
      status: product.status,
      material: product.material,
      category_name: product.categories?.[0]?.category?.name || 'Uncategorized',
      created_at: product.created_at?.getTime() || 0
    };

    await addOrUpdateProducts([document]);
  } catch (err) {
    console.error(`[SearchService] Failed to sync single product ${productId}:`, err);
  }
}

export async function searchProducts(query: string, options: any = {}) {
  const searchClient = getSearchClient();
  const index = searchClient.index(INDEX_NAME);
  
  const searchResponse = await index.search(query, {
    limit: options.limit || 20,
    offset: options.offset || 0,
    filter: options.filter,
    sort: options.sort,
    facets: ['collection_id', 'price', 'material', 'category_name']
  });
  
  return searchResponse;
}
