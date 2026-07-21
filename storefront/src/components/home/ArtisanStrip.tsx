import Link from 'next/link';
import { Card, homepageSectionActionClassName } from '@/design-system';

const ARTISANS = [
  {
    name: 'Sunita Devi',
    craft: 'Kantha embroidery',
    region: 'Jaipur, Rajasthan',
    years: '22 years',
    initials: 'SD',
    color: 'bg-surface-soft',
  },
  {
    name: 'Rekha Kumari',
    craft: 'Hand block printing',
    region: 'Sanganer, Rajasthan',
    years: '15 years',
    initials: 'RK',
    color: 'bg-surface-soft',
  },
  {
    name: 'Champa Bai',
    craft: 'Kantha quilting',
    region: 'Murshidabad, West Bengal',
    years: '30 years',
    initials: 'CB',
    color: 'bg-surface-soft',
  },
  {
    name: 'Geeta Sharma',
    craft: 'Natural dyeing',
    region: 'Jaipur, Rajasthan',
    years: '18 years',
    initials: 'GS',
    color: 'bg-surface-soft',
  },
];

export function ArtisanStrip() {
  return (
    <section className="max-md:py-[var(--ds-space-md)] bg-surface">
      <div className="ds-home-container">
        <div className="mb-[var(--ds-space-md)] flex flex-col gap-[var(--ds-space-sm)] md:mb-[var(--ds-space-lg)] md:flex-row md:items-end md:justify-between">
          <div>
            <div className="kv-tag">The hands behind every piece</div>
            <h2 className="kv-title">Meet our <em className="italic">artisans</em></h2>
          </div>
          <Link href="/about#artisans" className={homepageSectionActionClassName}>
            All artisans
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-[var(--ds-space-sm)] sm:grid-cols-4 md:gap-[var(--ds-space-md)] lg:gap-[var(--ds-space-md)]">
          {ARTISANS.map((artisan) => (
            <Card
              key={artisan.name}
              className="group relative overflow-hidden p-[var(--ds-space-md)] transition-shadow hover:shadow-md"
            >
              <div
                className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${artisan.color} text-body-sm font-semibold text-primary`}
              >
                {artisan.initials}
              </div>

              <p className="text-body-sm font-semibold text-primary">
                {artisan.name}
              </p>
              <p className="mt-1 text-body-xs text-muted">
                {artisan.craft}
              </p>
              <p className="mt-1 text-body-xs tracking-[var(--ds-type-label-tracking)] text-muted">
                {artisan.region}
              </p>

              <div className="mt-4 border-t border-border-subtle pt-4">
                <span className="text-body-xs font-medium tracking-[var(--ds-type-label-tracking)] text-accent">
                  {artisan.years} of craft
                </span>
              </div>
            </Card>
          ))}
        </div>

        <p className="mt-8 text-body-sm leading-[var(--ds-leading-relaxed)] text-muted">
          Every Odhvica piece is signed by the artisan who made it - their name is on the care label inside.{' '}
          <Link href="/about" className="text-primary underline underline-offset-4 hover:text-accent">
            Learn about our makers {'->'}
          </Link>
        </p>
      </div>
    </section>
  );
}
