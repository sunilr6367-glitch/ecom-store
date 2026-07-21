import { ButtonLink, HomepageContainer } from '@/design-system';
import { Ruler, HelpCircle, MessageCircle } from 'lucide-react';

function whatsappHref(message: string) {
  return `https://wa.me/message/odhvica?text=${encodeURIComponent(message)}&utm_source=homepage&utm_medium=cta`;
}

export function ShoppingHelpStrip() {
  return (
    <section className="bg-[var(--ds-surface-paper)] border-y border-[var(--ds-border-subtle)] py-8 md:py-16" aria-label="Shopping and Fit Help" data-home-section="6-shopping-help">
      <HomepageContainer>
        <div className="grid gap-8 md:grid-cols-2 md:gap-12 md:divide-x divide-[var(--ds-border-subtle)]">
          
          {/* Left Column */}
          <div className="flex flex-col items-start text-primary md:pr-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-soft text-accent">
                <HelpCircle strokeWidth={1.5} size={22} />
              </span>
              <h2 className="font-display text-display-sm leading-tight m-0">Need size, fabric, or more photos?</h2>
            </div>
            <p className="font-body text-body-md text-muted leading-relaxed mb-6">
              Ask before you buy — especially for jackets, kimonos, bags & gifts.
            </p>
            <ButtonLink
              href={whatsappHref('Hi, I need help with an order')}
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              size="md"
              className="mt-auto"
            >
              Message on WhatsApp
            </ButtonLink>
          </div>

          {/* Right Column */}
          <div className="flex flex-col items-start text-primary md:pl-12">
            <div className="flex items-center gap-3 mb-4">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-surface-soft text-accent">
                <Ruler strokeWidth={1.5} size={22} />
              </span>
              <h2 className="font-display text-display-sm leading-tight m-0">Unsure about fit?</h2>
            </div>
            <div className="flex flex-col gap-3 w-full max-w-sm mt-4">
              <ButtonLink href="/reels" variant="outline" size="md" className="w-full justify-between group">
                Watch Fit Reels <span className="opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">→</span>
              </ButtonLink>
              <ButtonLink href="/size-guide" variant="outline" size="md" className="w-full justify-between group">
                Size Guide <span className="opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0">→</span>
              </ButtonLink>
              <ButtonLink
                href={whatsappHref('Hi, I need sizing help for a Odhvica product')}
                target="_blank"
                rel="noopener noreferrer"
                variant="primary"
                size="md"
                className="w-full justify-center gap-2"
              >
                <MessageCircle size={18} /> WhatsApp Help
              </ButtonLink>
            </div>
          </div>

        </div>
      </HomepageContainer>
    </section>
  );
}
