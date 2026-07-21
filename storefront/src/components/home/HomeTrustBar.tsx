import { HandHeart, RotateCcw, ShieldCheck, Truck } from 'lucide-react';
import { HomepageContainer } from '@/design-system';

const trustItems = [
  {
    icon: HandHeart,
    label: 'Handmade by Jaipur artisans',
  },
  {
    icon: Truck,
    label: 'Free intl shipping $150+',
  },
  {
    icon: RotateCcw,
    label: '14-day easy returns',
  },
  {
    icon: ShieldCheck,
    label: 'Secure PayPal/Cards',
  },
];

export function HomeTrustBar() {
  return (
    <section className="bg-surface-paper border-b border-border-subtle" aria-label="Odhvica shopping promises" data-home-section="3-trust-bar">
      <HomepageContainer>
        <div className="grid grid-cols-2 gap-y-4 gap-x-2 py-4 md:grid-cols-4 md:gap-4 divide-x-0 md:divide-x divide-border-subtle md:py-6">
          {trustItems.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.label} className="flex items-center justify-center gap-3 px-2 text-center md:px-4 md:text-left text-primary">
                <Icon aria-hidden="true" size={24} strokeWidth={1.5} className="flex-shrink-0 text-accent" />
                <span className="font-ui text-[13px] md:text-[14px] font-medium leading-snug tracking-wide uppercase text-primary/85 whitespace-normal">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>
      </HomepageContainer>
    </section>
  );
}
