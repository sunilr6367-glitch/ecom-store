export function CatalogGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[var(--ds-content-width)] px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10 sm:gap-x-6 lg:gap-y-16">
        {children}
      </div>
    </div>
  );
}
