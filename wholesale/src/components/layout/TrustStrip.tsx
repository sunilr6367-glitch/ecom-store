export function TrustStrip() {
  return (
    <div className="bg-[var(--ds-accent-primary)] text-inverse py-2 px-4 text-center text-xs sm:text-sm font-medium tracking-wide">
      <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-6">
        <span>Bulk Orders Welcome</span>
        <span className="hidden sm:inline">&bull;</span>
        <span>MOQ starts at 50 pcs</span>
        <span className="hidden sm:inline">&bull;</span>
        <span>Worldwide Shipping</span>
      </div>
    </div>
  );
}
