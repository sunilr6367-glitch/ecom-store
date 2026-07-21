'use client';

import { WholesaleHero } from '@/components/home/WholesaleHero';
import { HowItWorksSteps } from '@/components/home/HowItWorksSteps';
import { CatalogRequestForm } from '@/components/home/CatalogRequestForm';

export default function Home() {
  return (
    <div className="w-full">
      <WholesaleHero />
      <HowItWorksSteps />
      
      <section className="py-24 bg-[var(--ds-surface-page)]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <CatalogRequestForm />
        </div>
      </section>
    </div>
  );
}
