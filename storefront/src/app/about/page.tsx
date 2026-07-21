
import { Heading } from '@/design-system';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Our Story | Odhvica — Handmade in Jaipur, India',
  description:
    'Odhvica is a small workshop in Jaipur run by skilled artisan women who practice Kantha — a 300-year-old Indian embroidery art. Every piece is handmade, fairly paid, and shipped worldwide.',
};

const ARTISANS = [
  {
    name: 'Sunita Devi',
    craft: 'Kantha embroidery',
    region: 'Jaipur, Rajasthan',
    years: '22 years of craft',
    story:
      'Sunita learned Kantha from her mother at age nine. She now teaches the stitch to younger women in the neighbourhood, keeping the tradition alive for another generation.',
    initials: 'SD',
    color: 'bg-warning-bg',
  },
  {
    name: 'Rekha Kumari',
    craft: 'Hand block printing',
    region: 'Sanganer, Rajasthan',
    years: '15 years of craft',
    story:
      'Rekha\'s family has been block-printing fabric in Sanganer for three generations. She carves each wooden block herself — a process that takes longer than the printing.',
    initials: 'RK',
    color: 'bg-danger-bg',
  },
  {
    name: 'Champa Bai',
    craft: 'Kantha quilting',
    region: 'Murshidabad, West Bengal',
    years: '30 years of craft',
    story:
      'Champa grew up in West Bengal where Kantha quilting was a daily practice — women would recycle worn-out saris into layered quilts during the long evenings. She brought that tradition to Jaipur when she moved here 12 years ago.',
    initials: 'CB',
    color: 'bg-success-bg',
  },
  {
    name: 'Geeta Sharma',
    craft: 'Natural dyeing',
    region: 'Jaipur, Rajasthan',
    years: '18 years of craft',
    story:
      'Geeta works only with natural dyes — indigo, turmeric, pomegranate rind. She says synthetic dyes smell wrong. She can read the colour of a sunset and name the plant that would make it.',
    initials: 'GS',
    color: 'bg-indigo-100',
  },
];

export default function AboutPage() {
  return (
    <div className="bg-surface-paper">
      {/* Hero */}
      <div className="kv-page-gutter bg-surface-soft px-6 py-16 text-center md:px-12 md:py-20 lg:px-20 lg:py-32">
        <span className="text-body-xs font-semibold  tracking-token-wider text-muted">
          Made in Jaipur, India
        </span>
        <Heading role="page" className="mx-auto mt-4 max-w-3xl font-display text-display-xl font-medium leading-token-tight tracking-token-tight text-primary">
          Not a factory.{' '}
          <em className="italic">A family of hands.</em>
        </Heading>
        <p className="mx-auto mt-6 max-w-xl text-body-lg leading-token-relaxed text-secondary">
          Odhvica is a small workshop run by artisan women in Jaipur who practice
          Kantha — a 300-year-old Indian embroidery tradition. Every piece is
          handmade, fairly paid, and carries the signature of the woman who made it.
        </p>
      </div>

      {/* The Story */}
      <div className="ds-page-container mx-auto max-w-page py-token-xl md:py-token-2xl lg:py-token-3xl">
        <div className="grid items-start gap-8 md:gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <div className="text-body-xs  tracking-token-wider text-muted">
              How it started
            </div>
            <h2 className="mt-4 font-display text-display-xl font-medium leading-token-tight tracking-token-tight text-primary">
              A craft that almost disappeared
            </h2>
            <div className="mt-6 space-y-5 text-body-lg leading-token-relaxed text-secondary">
              <p>
                Kantha is not decorative embroidery. It is survival art. For centuries,
                women in Rajasthan and West Bengal would take the worn saris of their
                families — the ones too thin to wear, too precious to throw — layer them
                together, and stitch them into something new. A quilt. A wrap. A bag.
                Nothing wasted. Everything transformed.
              </p>
              <p>
                By the 1990s, mass production had pushed most Kantha artisans out of
                work. The craft began to disappear from households. The women who knew
                it were getting older.
              </p>
              <p>
                Odhvica started because we believed that shouldn&apos;t happen. We found
                these women — in workshops and homes and small village cooperatives — and
                asked them a simple question: if the world was willing to pay fairly,
                would you teach others and keep making?
              </p>
              <p>
                The answer was yes. Every time.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="aspect-[4/5] bg-surface-warm relative overflow-hidden">
              {/* Replace with real workshop photo via Cloudinary */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-body-sm italic text-muted">Workshop photo — Jaipur</span>
              </div>
            </div>
            <p className="text-body-sm italic leading-token-relaxed text-muted">
              Our workshop in the old city of Jaipur, where every piece begins.
            </p>
          </div>
        </div>
      </div>

      {/* How we work */}
      <div className="kv-page-gutter border-y border-border-subtle bg-parchment py-token-xl md:py-token-2xl lg:py-token-3xl">
        <div className="kv-page-frame mx-auto max-w-page">
          <div className="text-body-xs  tracking-token-wider text-warning-text">
            How Odhvica works
          </div>
          <h2 className="mt-4 font-display text-display-xl font-medium leading-token-tight tracking-token-tight text-primary">
            From hands in Jaipur to your door
          </h2>

          <div className="mt-8 grid gap-8 sm:grid-cols-3 md:mt-12">
            {[
              {
                step: '01',
                title: 'Made by artisan women',
                body: 'Each piece is made entirely by hand — no factories, no machines. The artisan who makes your piece signs the care label inside with her name.',
              },
              {
                step: '02',
                title: 'Fairly paid, always',
                body: 'We pay above the regional market rate, provide consistent work through the year, and split a portion of every sale back into artisan welfare programmes.',
              },
              {
                step: '03',
                title: 'Shipped to your door',
                body: 'We pack each order carefully in Jaipur and ship via tracked courier to 50+ countries. US orders typically arrive in 10–14 days.',
              },
            ].map((item) => (
              <div key={item.step} className="border-t border-border pt-6">
                <div className="font-display text-display-lg font-medium text-warning-text">
                  {item.step}
                </div>
                <h3 className="mt-3 text-body-lg font-semibold text-primary">{item.title}</h3>
                <p className="mt-3 text-body-md leading-token-relaxed text-secondary">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Artisans */}
      <div id="artisans" className="kv-page-gutter py-token-xl md:py-token-2xl lg:py-token-3xl">
        <div className="kv-page-frame mx-auto max-w-page">
          <div className="text-body-xs  tracking-token-wider text-muted">
            The people behind every piece
          </div>
          <h2 className="mt-4 font-display text-display-xl font-medium leading-token-tight tracking-token-tight text-primary">
            Meet our artisans
          </h2>
          <p className="mt-4 max-w-xl text-body-lg leading-token-relaxed text-muted">
            These are not stock photos. These are real women, real names, real craft.
            When you buy a Odhvica piece, one of them made it.
          </p>

          <div className="mt-8 grid gap-x-4 gap-y-8 sm:grid-cols-2 md:mt-12 md:gap-x-6 md:gap-y-12 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-16">
            {ARTISANS.map((artisan) => (
              <div key={artisan.name} className="border border-border-subtle p-6">
                <div
                  className={`mb-5 flex h-16 w-16 items-center justify-center rounded-full ${artisan.color} text-body-lg font-semibold text-secondary`}
                >
                  {artisan.initials}
                  {/* Replace with <Image> once you have real photos */}
                </div>
                <p className="text-body-md font-semibold text-primary">{artisan.name}</p>
                <p className="mt-1 text-body-sm font-medium text-warning-text">{artisan.craft}</p>
                <p className="mt-0.5 text-body-xs  tracking-token-wider text-muted">
                  {artisan.region}
                </p>
                <p className="mt-4 text-body-sm leading-token-relaxed text-muted">{artisan.story}</p>
                <p className="mt-4 text-body-xs font-semibold  tracking-token-wider text-disabled">
                  {artisan.years}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sustainability */}
      <div id="sustainability" className="kv-page-gutter bg-surface-soft py-token-xl md:py-token-2xl lg:py-token-3xl">
        <div className="kv-page-frame mx-auto max-w-page">
          <div className="grid items-center gap-8 md:gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="text-body-xs  tracking-token-wider text-muted">
                Slow fashion
              </div>
              <h2 className="mt-4 font-display text-display-xl font-medium leading-token-tight tracking-token-tight text-primary">
                The opposite of fast fashion
              </h2>
              <div className="mt-6 space-y-5 text-body-lg leading-token-relaxed text-secondary">
                <p>
                  A single Kantha jacket takes one artisan between 4 and 7 days to
                  complete. A large quilt, up to two weeks. We don&apos;t rush it.
                </p>
                <p>
                  We make in small batches — never more than we need — so nothing goes
                  to waste. Our fabric is sourced from mills in Rajasthan that use
                  natural dyes wherever possible. When we use recycled sari fabric
                  (as in our vintage Kantha line), we give new life to cloth that might
                  otherwise be discarded.
                </p>
                <p>
                  We&apos;re not perfect. But we&apos;re honest about where we are and where
                  we&apos;re going.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { num: '100%', label: 'Handmade, no machines' },
                { num: 'Small batch', label: 'Made to order where possible' },
                { num: 'Natural dyes', label: 'No azo dyes in our workshop' },
                { num: 'Fairly paid', label: 'Above regional market rate' },
              ].map((item) => (
                <div key={item.label} className="bg-surface-paper p-6">
                  <p className="font-display text-display-sm font-semibold text-primary">
                    {item.num}
                  </p>
                  <p className="mt-2 text-body-sm leading-token-normal text-muted">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="kv-page-gutter px-6 py-12 text-center md:px-12 md:py-16 lg:px-20 lg:py-24">
        <h2 className="font-display text-display-xl font-medium leading-token-tight tracking-token-tight text-primary">
          Ready to own something real?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-body-lg leading-token-relaxed text-muted">
          Every Odhvica piece ships with a handwritten note from the artisan who
          made it — and their name on the care label inside.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/products"
            className="inline-flex items-center bg-primary px-8 py-4 text-body-xs font-semibold  tracking-token-wider text-inverse transition-colors hover:bg-secondary"
          >
            Shop the collection
          </Link>
          <Link
            href="/journal/what-is-kantha"
            className="inline-flex items-center border border-border px-8 py-4 text-body-xs font-semibold  tracking-token-wider text-secondary transition-colors hover:border-primary"
          >
            What is Kantha?
          </Link>
        </div>
      </div>
    </div>
  );
}

