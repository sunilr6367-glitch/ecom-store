import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { products, product_seo } from '../db/schema';
import { initSearchIndex, addOrUpdateProducts } from '../services/search-service';

function isDirectJobRun() {
  return (process.argv[1] || '').replace(/\\/g, '/').includes('/syncMeilisearch');
}

export async function syncAllProductsToMeilisearch() {
  console.log('[SyncMeilisearch] Starting product synchronization...');

  try {
    await initSearchIndex();

    const publishedProducts = await db.query.products.findMany({
      where: eq(products.status, 'published'),
      with: {
        variants: {
          with: { prices: true }
        },
        categories: {
          with: { category: true }
        },
        seo: true
      }
    });

    const documents = publishedProducts.map((product) => {
      // Find the minimum price among variants
      let minPrice = 0;
      if (product.variants && product.variants.length > 0) {
        const prices = product.variants
          .flatMap(v => v.prices || [])
          .filter(p => p && p.currency_code?.toLowerCase() === 'inr')
          .map(p => Number(p.amount) / 100);
        
        if (prices.length > 0) {
          minPrice = Math.min(...prices);
        }
      }

      const seoDetails = product.seo?.[0]; // Assuming one-to-one

      return {
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
    });

    await addOrUpdateProducts(documents);
    console.log(`[SyncMeilisearch] Successfully synced ${documents.length} products to Meilisearch.`);
    
  } catch (err) {
    console.error('[SyncMeilisearch] Error syncing products:', err);
    throw err;
  }
}

if (isDirectJobRun()) {
  syncAllProductsToMeilisearch()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
