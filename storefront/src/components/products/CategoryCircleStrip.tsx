import Link from 'next/link';
import { OptimizedImage } from '@/design-system';

interface CategoryCircle {
  id: string;
  image_url: string;
  label: string;
  link_url: string;
}

interface Props {
  circles: CategoryCircle[];
}

export default function CategoryCircleStrip({ circles }: Props) {
  if (circles.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-border-subtle bg-surface-paper px-4 py-4 md:hidden">
      <div className="flex snap-x snap-mandatory gap-[var(--ds-space-sm)] overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {circles.map((circle) => (
          <Link
            key={circle.id}
            href={circle.link_url}
            className="flex min-w-[84px] snap-start flex-col items-center gap-[var(--ds-space-xs)]"
          >
            <div className="relative h-[78px] w-[78px] overflow-hidden rounded-full bg-surface-soft">
              <OptimizedImage
                src={circle.image_url}
                alt={circle.label}
                fill
                sizes="78px"
                className="object-cover"
              />
            </div>
            <span className="category-circle-label text-center">
              {circle.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
