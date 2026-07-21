interface TrustItem {
  id: string;
  label: string;
  sub: string;
  icon: string;
}

interface AsSeenOnProps {
  items: TrustItem[];
}

export function AsSeenOn({ items }: AsSeenOnProps) {
  if (items.length === 0) return null;

  return (
    <section className="border-y border-border-subtle bg-surface-paper py-6">
      <div className="ds-page-container mx-auto max-w-page">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 sm:gap-x-12 lg:gap-x-16">
          {items.map((item) => (
            <div key={item.id} className="flex flex-col items-center text-center">
              <span className="text-body-xs font-semibold  tracking-token-wider text-primary">
                {item.label}
              </span>
              <span className="mt-0.5 text-body-xs tracking-token-wider text-muted">
                {item.sub}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

