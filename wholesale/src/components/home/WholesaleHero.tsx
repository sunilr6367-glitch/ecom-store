import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function WholesaleHero() {
  return (
    <section className="relative w-full bg-[var(--ds-surface-dark)] overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1558769132-cb1fac08b4af?auto=format&fit=crop&q=80" 
          alt="Artisans at work" 
          className="w-full h-full object-cover opacity-40 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/20" />
      </div>
      
      <div className="relative z-10 mx-auto max-w-[var(--ds-content-width)] px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="max-w-2xl">
          <h1 className="font-heading text-display-md sm:text-display-lg text-white font-bold leading-tight mb-6">
            Authentic Handcrafted Textiles, Ready for Export.
          </h1>
          <p className="text-body-lg text-white/90 mb-10 max-w-xl">
            Partner with Odhvica for ethical sourcing and premium quality. Request a single sample or place bulk orders with transparent MOQ pricing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button variant="primary" size="lg" className="px-8">
              <Link href="/products">Browse Catalog</Link>
            </Button>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-black">
              <Link href="#request-catalog">Request PDF Catalog</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
