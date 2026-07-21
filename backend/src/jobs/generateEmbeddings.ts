import { createHash } from 'crypto';
import { eq, inArray, sql } from 'drizzle-orm';

import { db } from '../db/client';
import {
  attribute_values,
  product_attribute_values,
  product_attributes,
  product_embeddings,
  products,
} from '../db/schema';

const OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
const EMBEDDING_DIMENSIONS = 1536;

function isDirectJobRun() {
  return (process.argv[1] || '').replace(/\\/g, '/').includes('/generateEmbeddings');
}

function hashDocument(document: string) {
  return createHash('sha256').update(document).digest('hex');
}

export function toVectorLiteral(values: number[]) {
  return `[${values.map((value) => Number(value).toFixed(8)).join(',')}]`;
}

export async function embedText(document: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: document,
      dimensions: EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI embedding request failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: Array<{ embedding?: number[] }>;
  };
  const embedding = payload.data?.[0]?.embedding;
  return Array.isArray(embedding) && embedding.length === EMBEDDING_DIMENSIONS
    ? embedding
    : null;
}

export async function buildProductEmbeddingDocument(productId: string) {
  const [product] = await db.select().from(products).where(eq(products.id, productId)).limit(1);
  if (!product) return null;

  const attributes = await db
    .select({
      attribute: product_attributes.label,
      value: attribute_values.label,
      raw: product_attribute_values.raw_value,
    })
    .from(product_attribute_values)
    .leftJoin(product_attributes, eq(product_attribute_values.attribute_id, product_attributes.id))
    .leftJoin(attribute_values, eq(product_attribute_values.value_id, attribute_values.id))
    .where(eq(product_attribute_values.product_id, productId));

  return [
    product.title,
    product.subtitle,
    product.description,
    product.material,
    product.handle,
    ...attributes.map((row) => `${row.attribute || ''}: ${row.value || row.raw || ''}`),
  ]
    .filter(Boolean)
    .join('\n')
    .trim();
}

export async function generateEmbeddingsForProducts(productIds?: string[]) {
  if (process.env.ENABLE_PRODUCT_EMBEDDINGS !== 'true') {
    return { generated: 0, skipped: 0, total: 0 };
  }

  const productRows = productIds?.length
    ? await db.select({ id: products.id }).from(products).where(inArray(products.id, productIds))
    : await db.select({ id: products.id }).from(products).where(eq(products.status, 'published'));

  let generated = 0;
  let skipped = 0;

  for (const row of productRows) {
    const document = await buildProductEmbeddingDocument(row.id);
    if (!document) {
      skipped++;
      continue;
    }

    const sourceHash = hashDocument(document);
    const embedding = await embedText(document);
    if (!embedding) {
      await db
        .insert(product_embeddings)
        .values({
          product_id: row.id,
          locale: 'en',
          source_hash: sourceHash,
          document,
          metadata: { provider: 'openai', status: 'pending_api_key' },
          updated_at: new Date(),
        })
        .onConflictDoUpdate({
          target: product_embeddings.product_id,
          set: {
            source_hash: sourceHash,
            document,
            metadata: { provider: 'openai', status: 'pending_api_key' },
            updated_at: new Date(),
          },
        });
      skipped++;
      continue;
    }

    const metadata = JSON.stringify({ provider: 'openai', model: OPENAI_EMBEDDING_MODEL });
    await db.execute(sql`
      INSERT INTO product_embeddings (product_id, locale, source_hash, document, embedding, metadata, updated_at)
      VALUES (${row.id}, 'en', ${sourceHash}, ${document}, ${toVectorLiteral(embedding)}::vector, ${metadata}::jsonb, now())
      ON CONFLICT (product_id)
      DO UPDATE SET
        source_hash = excluded.source_hash,
        document = excluded.document,
        embedding = excluded.embedding,
        metadata = excluded.metadata,
        updated_at = now()
    `);
    generated++;
  }

  return { generated, skipped, total: productRows.length };
}

if (require.main === module && isDirectJobRun()) {
  generateEmbeddingsForProducts()
    .then((result) => {
      console.log(result);
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
