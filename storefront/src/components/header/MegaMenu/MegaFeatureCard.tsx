import Link from 'next/link';

import { OptimizedImage } from '@/design-system';

interface MegaFeatureCardProps {
  name: string;
  handle: string;
  image?: string | null;
  onClick?: () => void;
}

export function MegaFeatureCard({
  name,
  handle,
  image,
  onClick,
}: MegaFeatureCardProps) {
  return (
    <Link
      href={`/collections/${handle}`}
      onClick={onClick}
      className="group relative flex h-full min-h-[240px] cursor-pointer flex-col justify-end overflow-hidden bg-primary p-5"
    >
      {image ? (
        <OptimizedImage
          src={image}
          alt={name}
          fill
          sizes="180px"
          className="object-cover opacity-75 transition-transform duration-500 group-hover:scale-105"
        />
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(var(--ds-black-rgb),0.10),rgba(var(--ds-black-rgb),0.64))]" />
      <p className="relative z-10 mb-2 font-label text-body-xs tracking-token-wide text-inverse/70">
        Featured this season
      </p>
      <h3 className="relative z-10 mb-3 font-display text-display-sm italic font-normal leading-token-tight text-inverse">
        {name}
      </h3>
      <span className="relative z-10 inline-block border-b border-surface-paper/25 pb-0.5 font-ui text-body-xs tracking-token-wide text-inverse/80 transition-colors group-hover:text-inverse">
        Shop the edit
      </span>
    </Link>
  );
}
