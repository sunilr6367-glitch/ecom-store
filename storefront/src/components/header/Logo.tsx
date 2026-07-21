import Link from 'next/link';

interface LogoProps {
  size?: 'desktop' | 'mobile';
  isTransparent?: boolean;
}

export function Logo({ size = 'desktop', isTransparent = false }: LogoProps) {
  const cls =
    size === 'mobile'
      ? 'font-display text-display-sm font-medium tracking-token-normal transition-colors duration-300'
      : 'font-display text-display-md font-medium tracking-token-normal transition-colors duration-300';

  const textColor = isTransparent ? 'text-inverse' : 'text-primary';

  return (
    <Link href="/" aria-label="Odhvica — Home" className={`${cls} ${textColor}`}>
      Odhvi<span className="text-accent">c</span>a
    </Link>
  );
}
