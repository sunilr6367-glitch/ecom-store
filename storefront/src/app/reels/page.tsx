import type { Metadata } from 'next';

import { ReelsExperience } from '@/components/reels/ReelsExperience';
import { buildBasicPageMetadata, DEFAULT_OG_IMAGE } from '@/lib/seo';

export const metadata: Metadata = buildBasicPageMetadata({
  title: 'Watch & Buy Shoppable Reels | Odhvica',
  description:
    'See Odhvica ethnic wear in motion. Watch shoppable reels for drape, fit, styling inspiration, and quick product discovery.',
  path: '/reels',
  image: DEFAULT_OG_IMAGE,
  keywords: [
    'shoppable reels ethnic wear',
    'watch and buy indian clothing',
    'odhvica reels',
    'ethnic wear styling videos',
  ],
});

export default function ReelsPage() {
  return <ReelsExperience basePath="/reels" />;
}
