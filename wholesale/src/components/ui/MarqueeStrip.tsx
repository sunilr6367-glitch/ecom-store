interface MarqueeStripProps {
  items: string[];
  speed?: string;
  className?: string;
}

export function MarqueeStrip({
  items,
  speed = '20s',
  className = '',
}: MarqueeStripProps) {
  // Double the items for seamless infinite loop
  const doubled = [...items, ...items];

  return (
    <div className={`marquee-section-prem ${className}`} aria-hidden="true">
      <div className="marquee-track-prem" style={{ animationDuration: speed }}>
        {doubled.map((item, i) => (
          <span key={i} className="marquee-item-prem">
            {item}
            {i < doubled.length - 1 && <span className="marquee-dot-prem" />}
          </span>
        ))}
      </div>
    </div>
  );
}
