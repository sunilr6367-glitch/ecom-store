import { Globe2, Hand, MessageCircle, ShieldCheck } from 'lucide-react';
import { ButtonLink } from '@/design-system';

const promises = [
  {
    icon: Hand,
    title: 'Only sellable pieces make it online',
    copy: 'Every homepage piece needs real media, clear price, and enough detail to shop with confidence.',
  },
  {
    icon: ShieldCheck,
    title: 'Honest photos and clear details',
    copy: 'Texture, fabric, color, and handmade variation should be visible before you open the product page.',
  },
  {
    icon: Globe2,
    title: 'Small-batch, not mass-produced',
    copy: 'Kantha, block print, and quilted cotton pieces are selected as limited textile edits.',
  },
  {
    icon: MessageCircle,
    title: 'Sizing and gift help on WhatsApp',
    copy: 'Ask for extra photos, measurements, styling help, or gifting guidance before checkout.',
  },
];

export function CraftPromise() {
  return (
    <section className="max-md:py-[var(--ds-space-md)] bg-parchment border-y border-border-subtle">
      <div className="ds-home-container grid gap-[28px] items-start md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="max-w-[620px]">
          <div className="kv-tag">Why Odhvica</div>
          <h2 className="kv-title">Handmade, edited, and ready to wear.</h2>
          <p className="kv-sub mt-4">
            The homepage is designed around real product media, short shopping paths,
            craft proof near buying moments, and fast routes to help.
          </p>
          <div className="flex flex-wrap gap-[10px] mt-[24px]">
            <ButtonLink href="/about/our-craft" variant="primary" size="md">
              Explore Craft
            </ButtonLink>
            <ButtonLink href="/products" variant="outline" size="md">
              Shop The Edit
            </ButtonLink>
          </div>
        </div>

        <div className="grid gap-[1px] overflow-hidden border border-border-subtle bg-border-subtle md:grid-cols-2" aria-label="Odhvica commerce promises">
          {promises.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="grid grid-cols-[auto_1fr] gap-[12px] p-[18px] bg-surface-paper">
              <Icon size={18} strokeWidth={1.7} aria-hidden="true" className="mt-[2px] text-accent" />
              <div>
                <strong className="block text-primary font-label text-body-sm font-[var(--ds-type-label-weight)] tracking-[var(--ds-type-label-tracking)]">{title}</strong>
                <p className="mt-[6px] text-muted font-body text-body-sm leading-[var(--ds-leading-normal)]">{copy}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
