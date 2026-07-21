import { FileSearch, CheckCircle2, Truck } from 'lucide-react';

const STEPS = [
  {
    title: 'Order a Sample',
    description: 'Browse our catalog and order a single unit at the sample price to review our quality and craftsmanship firsthand.',
    icon: FileSearch,
  },
  {
    title: 'Request a Quote',
    description: 'Satisfied with the sample? Submit a quote request for bulk variants. MOQs are clearly listed on every product.',
    icon: CheckCircle2,
  },
  {
    title: 'Global Delivery',
    description: 'We handle export documentation and coordinate secure worldwide shipping for your bulk order.',
    icon: Truck,
  }
];

export function HowItWorksSteps() {
  return (
    <section className="py-20 bg-[var(--ds-surface-soft)]">
      <div className="mx-auto max-w-[var(--ds-content-width)] px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-heading text-display-sm text-[var(--ds-text-primary)] mb-4">How B2B Ordering Works</h2>
          <p className="text-body-md text-[var(--ds-text-secondary)] max-w-2xl mx-auto">
            Our streamlined process is designed for international buyers, boutiques, and distributors.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-[var(--ds-border-subtle)] z-0" />
          
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="relative z-10 flex flex-col items-center text-center group">
                <div className="w-24 h-24 rounded-full bg-[var(--ds-surface-page)] border-2 border-[var(--ds-accent-primary)] flex items-center justify-center mb-6 shadow-sm group-hover:scale-105 transition-transform">
                  <Icon size={40} className="text-[var(--ds-accent-primary)]" />
                </div>
                <div className="w-8 h-8 rounded-full bg-[var(--ds-accent-primary)] text-inverse flex items-center justify-center font-bold text-sm absolute top-20 -right-2 md:right-auto md:left-1/2 md:ml-6 border-4 border-[var(--ds-surface-soft)]">
                  {index + 1}
                </div>
                <h3 className="font-heading text-xl font-bold text-[var(--ds-text-primary)] mb-3">{step.title}</h3>
                <p className="text-sm text-[var(--ds-text-secondary)] max-w-xs">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
