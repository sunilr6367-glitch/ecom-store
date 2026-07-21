import Link from 'next/link';
import { HelpCircle, MessageCircle, PackageCheck, Ruler, Shirt, Sparkles } from 'lucide-react';
import { ButtonLink, homepageSectionActionClassName } from '@/design-system';

function whatsappHref(message: string) {
  return `https://wa.me/message/odhvica?text=${encodeURIComponent(message)}&utm_source=homepage&utm_medium=cta`;
}

export function WhatsAppHelpStrip() {
  return (
    <section className="border-y border-border-subtle bg-surface-paper" aria-label="Product help">
      <div className="ds-home-container grid gap-[var(--ds-space-sm)] items-center py-[var(--ds-space-sm)] md:grid-cols-[1fr_auto]">
        <div>
          <span className="block text-primary font-label text-body-sm font-[var(--ds-type-label-weight)] tracking-[var(--ds-type-label-tracking)] [text-transform:var(--ds-type-label-transform)]">Need size, fabric, or more photos?</span>
          <p className="mt-[var(--ds-space-2xs)] text-muted text-body-sm">Ask before you buy. It is especially useful for jackets, kimonos, bags, and gifts.</p>
        </div>
        <ButtonLink
          href={whatsappHref('Hi, I need help choosing a Odhvica piece')}
          target="_blank"
          rel="noopener noreferrer"
          variant="primary"
          size="md"
        >
          Message on WhatsApp
        </ButtonLink>
      </div>
    </section>
  );
}

const craftCards = [
  {
    icon: Sparkles,
    title: 'What is Kantha?',
    copy: 'Understand the layered stitch language behind Odhvica quilted pieces.',
    href: '/about/kantha',
  },
  {
    icon: Shirt,
    title: 'Why block print varies',
    copy: 'Small variations are part of hand block printed textile character.',
    href: '/about/block-printing',
  },
  {
    icon: PackageCheck,
    title: 'Care for quilted cotton',
    copy: 'Read how to handle, wash, and store handmade textile pieces.',
    href: '/about/our-craft',
  },
];

export function CraftEducationStrip() {
  return (
    <section className="max-md:py-[var(--ds-space-md)] bg-surface-paper">
      <div className="ds-home-container">
        <div className="grid gap-[var(--ds-space-xs)] md:grid-cols-3">
          {craftCards.map(({ icon: Icon, title, copy, href }) => (
            <Link key={title} href={href} className="grid gap-[var(--ds-space-xs)] grid-cols-[auto_1fr] border border-border-subtle rounded-md bg-surface-paper p-[var(--ds-space-sm)] text-primary no-underline">
              <Icon aria-hidden="true" size={18} strokeWidth={1.7} className="text-accent" />
              <div>
                <h3 className="m-0 text-primary font-label text-body-sm font-[var(--ds-type-label-weight)] tracking-[var(--ds-type-label-tracking)]">{title}</h3>
                <p className="mt-[var(--ds-space-2xs)] text-muted text-body-sm">{copy}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FitScaleHelp() {
  return (
    <section className="max-md:py-[var(--ds-space-md)] bg-parchment">
      <div className="ds-home-container grid gap-[var(--ds-space-md)] items-center md:grid-cols-[1fr_auto]">
        <div>
          <div className="kv-tag">Fit &amp; scale help</div>
          <h2 className="kv-title">Unsure about fit or size?</h2>
          <p className="kv-sub mt-[var(--ds-space-xs)]">
            See pieces in motion, check measurements, or ask for extra photos before checkout.
          </p>
        </div>
        <div className="flex flex-wrap gap-[var(--ds-space-xs)]">
          <ButtonLink href="/reels" variant="primary" size="md">
            Watch fit reels
          </ButtonLink>
          <ButtonLink
            href={whatsappHref('Hi, I need sizing help for a Odhvica product')}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            size="md"
          >
            WhatsApp help
          </ButtonLink>
          <ButtonLink href="/size-guide" variant="outline" size="md">
            Size guide
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

const faqItems = [
  {
    icon: PackageCheck,
    title: 'Where do products ship from?',
    copy: 'Odhvica ships from Jaipur, Rajasthan, India.',
  },
  {
    icon: HelpCircle,
    title: 'How long does delivery take?',
    copy: 'Delivery timing depends on location and shipping method. Check shipping guidance before checkout.',
  },
  {
    icon: Ruler,
    title: 'Can I exchange?',
    copy: 'Eligible exchange and return support is handled through the Odhvica returns flow.',
  },
  {
    icon: MessageCircle,
    title: 'Need help before buying?',
    copy: 'Use WhatsApp for sizing, gifting, fabric, and product photo questions.',
  },
];

export function ShippingReturnsMiniFAQ() {
  return (
    <section className="max-md:py-[var(--ds-space-md)] bg-surface-paper">
      <div className="ds-home-container">
        <div className="flex flex-col gap-[var(--ds-space-sm)] md:flex-row md:items-end md:justify-between">
          <div>
            <div className="kv-tag">Before checkout</div>
            <h2 className="kv-title">Shipping and support, answered quickly</h2>
          </div>
          <Link href="/returns" className={homepageSectionActionClassName}>
            Returns Help
          </Link>
        </div>
        <div className="grid gap-[var(--ds-space-xs)] md:grid-cols-4">
          {faqItems.map(({ icon: Icon, title, copy }) => (
            <article key={title} className="grid content-start gap-[var(--ds-space-xs)] border border-border-subtle rounded-md bg-surface-paper p-[var(--ds-space-sm)] text-primary no-underline">
              <Icon aria-hidden="true" size={18} strokeWidth={1.7} className="text-accent" />
              <h3 className="m-0 text-primary font-label text-body-sm font-[var(--ds-type-label-weight)] tracking-[var(--ds-type-label-tracking)]">{title}</h3>
              <p className="mt-[var(--ds-space-2xs)] text-muted text-body-sm">{copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
