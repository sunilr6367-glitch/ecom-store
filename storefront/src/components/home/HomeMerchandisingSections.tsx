'use client';

import Link from 'next/link';
import { OptimizedImage, homepageSectionActionClassName } from '@/design-system';
import type { HomepageMerchandisingSlot } from '@/types/homepage';



function SectionHead({
  eyebrow,
  action,
}: {
  eyebrow: string;
  copy?: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="mb-[var(--ds-space-md)] flex flex-col gap-[var(--ds-space-sm)] md:mb-[var(--ds-space-lg)] md:flex-row md:items-end md:justify-between">
      <div className="kv-tag">{eyebrow}</div>
      {action ? (
        <Link href={action.href} className={homepageSectionActionClassName}>
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}

function slotHref(slot: HomepageMerchandisingSlot) {
  if (slot.link_url) return slot.link_url;
  if (slot.linked_product_id) return `/products/${slot.linked_product_id}`;
  if (slot.linked_collection_id) return `/products?collection_id=${slot.linked_collection_id}`;
  if (slot.linked_category_id) return `/products?category_id=${slot.linked_category_id}`;
  if (slot.linked_tag_id) return `/products?tag_id=${slot.linked_tag_id}`;
  return '/products';
}

type MerchSlotCardVariant = 'default' | 'categoryOverlay';

function MerchSlotCard({
  slot,
  variant = 'default',
}: {
  slot: HomepageMerchandisingSlot;
  variant?: MerchSlotCardVariant;
}) {
  const isCategoryOverlay = variant === 'categoryOverlay';
  const cardClassName = isCategoryOverlay
    ? 'relative block flex-none snap-start aspect-[5/7] min-w-[80vw] overflow-hidden bg-[linear-gradient(135deg,var(--ds-accent-hover),var(--ds-accent-primary)_48%,var(--ds-accent-soft))] text-inverse before:content-[\'\'] before:absolute before:inset-0 before:z-[1] before:pointer-events-none before:bg-[linear-gradient(180deg,rgba(var(--ds-black-rgb),.05),rgba(var(--ds-black-rgb),.72))] min-[741px]:min-w-[60vw] min-[1000px]:min-w-[23vw] group'
    : 'relative min-h-[320px] min-w-[78%] snap-start overflow-hidden rounded-lg bg-gradient-to-br from-[var(--ds-accent-hover)] via-[var(--ds-accent-primary)] to-[var(--ds-accent-soft)] p-8 text-inverse sm:min-w-[42%] lg:min-w-[31%]';
  const imageSizes = isCategoryOverlay
    ? '(max-width: 740px) 80vw, (max-width: 999px) 60vw, 23vw'
    : '(max-width: 768px) 78vw, 31vw';

  return (
    <Link
      href={slotHref(slot)}
      className={cardClassName}
    >
      {slot.image_url ? (
        <OptimizedImage
          src={slot.image_url}
          alt={slot.title}
          fill
          sizes={imageSizes}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : null}

      {isCategoryOverlay ? (
        <div className="absolute inset-x-0 bottom-6 z-[2] w-full px-[var(--ds-space-md)] text-center">
          <h3 className="inline-block max-w-full m-0 px-2 pb-2 border-b-2 border-[rgba(var(--ds-surface-paper-rgb),0.85)] text-inverse font-display text-display-sm font-[var(--ds-type-body-weight)] [overflow-wrap:anywhere]">{slot.title}</h3>
        </div>
      ) : (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(var(--ds-black-rgb),0.06),rgba(var(--ds-black-rgb),0.54))]" />
          <div className="relative z-10 flex h-full flex-col justify-end">
            <div className="text-body-xs  tracking-token-wider text-inverse/75">
              {slot.eyebrow || 'Odhvica Edit'}
            </div>
            <h3 className="mt-[var(--ds-space-xs)] font-display text-display-md leading-token-tight">
              {slot.title}
            </h3>
            {slot.copy ? (
              <p className="mt-3 max-w-[18rem] text-body-sm leading-token-relaxed text-inverse/82">
                {slot.copy}
              </p>
            ) : null}
          </div>
        </>
      )}
    </Link>
  );
}

function groupSlots(slots: HomepageMerchandisingSlot[], key: string) {
  return slots
    .filter((slot) => slot.slot_key === key && slot.is_active)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

function MerchRow({
  slots,
  eyebrow,
  actionHref,
  variant,
}: {
  slots: HomepageMerchandisingSlot[];
  eyebrow: string;
  actionHref: string;
  variant: MerchSlotCardVariant;
}) {
  if (slots.length === 0) return null;

  return (
    <div className="mb-12 last:mb-0">
      <SectionHead
        eyebrow={eyebrow}
        action={{ label: 'View All', href: actionHref }}
      />
      <div className="flex snap-x snap-mandatory gap-[var(--ds-space-sm)] overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {slots.map((slot) => (
          <MerchSlotCard key={slot.id} slot={slot} variant={variant} />
        ))}
      </div>
    </div>
  );
}

export function CuratedEditsSection({
  merchandisingSlots,
}: {
  merchandisingSlots: HomepageMerchandisingSlot[];
}) {
  if (!merchandisingSlots || merchandisingSlots.length === 0) return null;

  const seasonal = groupSlots(merchandisingSlots, 'seasonal_edits');
  const fabric = groupSlots(merchandisingSlots, 'fabric_edits');
  const occasion = groupSlots(merchandisingSlots, 'occasion_edits');

  if (seasonal.length === 0 && fabric.length === 0 && occasion.length === 0) return null;

  return (
    <section className="py-[var(--ds-space-md)] md:py-[var(--ds-space-xl)] bg-[var(--ds-surface-paper)] border-y border-[var(--ds-border-subtle)]" data-home-section="7-curated-edits">
      <div className="ds-home-container">
        <MerchRow
          slots={seasonal}
          eyebrow="Limited editions"
          actionHref="/products"
          variant="default"
        />
        <MerchRow
          slots={fabric}
          eyebrow="Craft & material"
          actionHref="/collections"
          variant="categoryOverlay"
        />
        <MerchRow
          slots={occasion}
          eyebrow="Dress for the moment"
          actionHref="/collections"
          variant="categoryOverlay"
        />
      </div>
    </section>
  );
}
