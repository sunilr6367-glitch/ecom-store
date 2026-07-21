import { redirect } from 'next/navigation';

type Props = {
  searchParams: Promise<{ reel?: string | string[] }>;
};

export default async function TrendingNowRedirect({ searchParams }: Props) {
  const { reel } = await searchParams;
  const reelId = Array.isArray(reel) ? reel[0] : reel;

  redirect(reelId ? `/reels?reel=${encodeURIComponent(reelId)}` : '/reels');
}
