import Link from 'next/link';
import { OptimizedImage } from '@/design-system';
import type { HomepageCollection } from '@/types/homepage';

interface ShopByNeedProps {
  collections: HomepageCollection[];
}

function collectionSummary(title: string) {
  const value = title.toLowerCase();
  if (value.includes('wedding') || value.includes('festive')) return 'Dressed-up pieces for gifting, ceremonies, and special days.';
  if (value.includes('bag') || value.includes('tote') || value.includes('pouch')) return 'Quilted carry pieces for travel, errands, and gifting.';
  if (value.includes('jacket') || value.includes('kimono')) return 'Layerable cotton pieces with handmade surface detail.';
  if (value.includes('quilt') || value.includes('throw')) return 'Soft textile layers for home, travel, and keepsake gifting.';
  return 'A curated path into Odhvica small-batch handmade pieces.';
}

export function ShopByNeed({ collections }: ShopByNeedProps) {
  const displayed = collections
    .filter((collection) => Boolean(collection.image && collection.handle && collection.title))
    .slice(0, 4);

  if (displayed.length === 0) return null;

  return (
    <section className="max-md:py-[var(--ds-space-md)] shop-need-section bg-parchment">
      <div className="ds-home-container">
        <div className="flex flex-col gap-[var(--ds-space-sm)]">
          <div>
            <div className="kv-tag">Curated paths</div>
            <h2 className="kv-title">Shop by moment, mood, or use</h2>
            <p className="kv-sub mt-3">
              A faster route into festive dressing, travel layers, gifts, and home textiles.
            </p>
          </div>
        </div>

        <div className="shop-need-grid">
          {displayed.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.handle}`}
              className="shop-need-card group"
            >
              <div className="shop-need-media">
                <OptimizedImage
                  src={collection.image || ''}
                  alt={collection.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="shop-need-copy">
                <span>Curated edit</span>
                <h3 className="font-display text-display-sm text-primary">{collection.title}</h3>
                <p>{collectionSummary(collection.title)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
