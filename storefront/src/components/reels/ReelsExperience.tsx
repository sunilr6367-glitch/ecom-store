'use client';

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type TouchEvent,
} from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Eye,
  Grid2X2,
  Grid3X3,
  Heart,
  Share2,
  ShoppingBag,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Button, IconButton, Modal, OptimizedImage, UnstyledButton } from '@/design-system';

interface TrendingReelItem {
  id: string;
  video_url: string;
  thumbnail_url: string;
  product_name: string;
  price: string;
  price_amount?: number | null;
  link_url: string;
  view_count?: number;
  category?: string | null;
}

interface ReelCollectionItem {
  id: string;
  title: string;
  handle: string;
  subtitle?: string | null;
  description?: string | null;
  hero_image_url?: string | null;
  hero_video_url?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  reel_ids?: string[];
  reels?: TrendingReelItem[];
}

interface ReelsExperienceProps {
  basePath?: string;
}

function formatPrice(price: string) {
  if (!price) return '';
  const num = parseFloat(price.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return price;
  return `\u20b9${num.toLocaleString('en-IN')}`;
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat('en-IN', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

function getSavedReels(): Set<string> {
  try {
    const raw = localStorage.getItem('odhvica_saved_reels');
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function toggleSavedReel(id: string): boolean {
  const saved = getSavedReels();
  if (saved.has(id)) {
    saved.delete(id);
  } else {
    saved.add(id);
  }
  try {
    localStorage.setItem('odhvica_saved_reels', JSON.stringify([...saved]));
  } catch {}
  return saved.has(id);
}

function inferReelGroup(reel: TrendingReelItem) {
  const text = `${reel.category || ''} ${reel.product_name || ''}`.toLowerCase();
  if (/(jacket|kimono|coat|shrug|overlay)/.test(text)) return 'jackets';
  if (/(bag|tote|pouch|toiletry|clutch)/.test(text)) return 'bags';
  return 'looks';
}

function createFallbackCollections(reels: TrendingReelItem[]): ReelCollectionItem[] {
  if (reels.length === 0) return [];

  const groups = [
    {
      handle: 'odhvica-reels-edit',
      title: 'Odhvica reels edit',
      subtitle: 'A curated reel rail for fabric movement, handwork details, scale, and quick product discovery.',
      reels,
    },
    {
      handle: 'jackets-in-motion',
      title: 'Jackets in motion',
      subtitle: 'See quilted jackets, kimono layers, and handmade outerwear from every angle.',
      reels: reels.filter((reel) => inferReelGroup(reel) === 'jackets'),
    },
    {
      handle: 'bags-in-motion',
      title: 'Bags in motion',
      subtitle: 'Inspect tote bags, pouches, scale, stitching, and everyday styling in motion.',
      reels: reels.filter((reel) => inferReelGroup(reel) === 'bags'),
    },
  ].filter((group) => group.reels.length > 0);

  return groups.map((group, index) => ({
    id: `fallback-${group.handle}`,
    title: group.title,
    handle: group.handle,
    subtitle: group.subtitle,
    hero_image_url: group.reels[0]?.thumbnail_url,
    hero_video_url: group.reels[0]?.video_url || null,
    cta_label: index === 0 ? 'Shop the edit' : 'Shop looks',
    cta_url: '/products',
    reel_ids: group.reels.map((reel) => reel.id),
    reels: group.reels,
  }));
}

// ─────────────────────────────────────────────────────────
// GRID
// ─────────────────────────────────────────────────────────
function ReelsExperienceContent({ basePath = '/reels' }: ReelsExperienceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [reels, setReels] = useState<TrendingReelItem[]>([]);
  const [collections, setCollections] = useState<ReelCollectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [gridCols, setGridCols] = useState<2 | 3>(3);
  const [showAll, setShowAll] = useState(false);
  const requestedReelId = searchParams.get('reel');
  const requestedCollection = searchParams.get('collection');
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);

  function setGrid(cols: 2 | 3) {
    setGridCols(cols);
    try { localStorage.setItem('odhvica_reels_grid', String(cols)); } catch {}
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setGridCols(localStorage.getItem('odhvica_reels_grid') === '2' ? 2 : 3);
      } catch {
        setGridCols(3);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([api.getTrendingReels(), api.getReelCollections()])
      .then(([reelsResponse, collectionsResponse]) => {
        if (cancelled) return;
        setReels(reelsResponse.reels || []);
        setCollections(collectionsResponse.collections || []);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (loading || !requestedReelId || activeIndex !== null) return;

    const requestedIndex = reels.findIndex((reel) => reel.id === requestedReelId);
    if (requestedIndex < 0) return;

    const openRequestedReel = window.setTimeout(() => {
      if (requestedIndex >= 12) setShowAll(true);
      setActiveIndex(requestedIndex);
    }, 0);

    return () => window.clearTimeout(openRequestedReel);
  }, [activeIndex, loading, reels, requestedReelId]);

  const fallbackCollections = useMemo<ReelCollectionItem[]>(
    () => createFallbackCollections(reels),
    [reels]
  );
  const displayCollections = collections.length > 0 ? collections : fallbackCollections;
  const activeCollectionHandle = requestedCollection && displayCollections.some(
    (collection) => collection.handle === requestedCollection
  )
    ? requestedCollection
    : null;
  const activeCollection = useMemo(
    () =>
      activeCollectionHandle
        ? displayCollections.find((collection) => collection.handle === activeCollectionHandle) || null
        : null,
    [activeCollectionHandle, displayCollections]
  );
  const filteredReels = useMemo(() => {
    if (!activeCollection) return reels;
    const collectionReelIds = new Set(activeCollection.reel_ids || []);
    return reels.filter((reel) => collectionReelIds.has(reel.id));
  }, [activeCollection, reels]);
  const visibleReels = useMemo(
    () => (showAll ? filteredReels : filteredReels.slice(0, 12)),
    [filteredReels, showAll]
  );
  const totalViews = useMemo(
    () => filteredReels.reduce((sum, reel) => sum + (reel.view_count || 0), 0),
    [filteredReels]
  );
  const heroReels = visibleReels.slice(0, 3);
  const carouselHeroCollection =
    displayCollections.length > 0
      ? displayCollections[activeHeroIndex % displayCollections.length] || displayCollections[0]
      : null;
  const activeHeroCollection = activeCollection || carouselHeroCollection;
  const heroCollectionReels = activeHeroCollection?.reels || [];
  const heroFallbackReel = heroCollectionReels[0] || reels[0] || null;

  useEffect(() => {
    if (displayCollections.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveHeroIndex((current) => (current + 1) % displayCollections.length);
    }, 5200);

    return () => window.clearInterval(timer);
  }, [displayCollections.length]);

  function selectCollection(handle: string | null) {
    setShowAll(false);
    if (handle) {
      const heroIndex = displayCollections.findIndex((collection) => collection.handle === handle);
      if (heroIndex >= 0) setActiveHeroIndex(heroIndex);
      router.replace(`${basePath}?collection=${handle}`, { scroll: false });
    } else {
      router.replace(basePath, { scroll: false });
    }
  }

  function getCollectionCtaHref(collection: ReelCollectionItem) {
    return collection.cta_url || `${basePath}?collection=${collection.handle}`;
  }

  function openReel(index: number) {
    setActiveIndex(index);
    // Keep the active reel shareable without a full navigation.
    const reelId = visibleReels[index]?.id;
    router.replace(reelId ? `${basePath}?reel=${reelId}` : basePath, { scroll: false });
  }

  function closeReel() {
    setActiveIndex(null);
    router.replace(basePath, { scroll: false });
  }

  function handleReelChange(index: number, updatedReel?: TrendingReelItem) {
    setActiveIndex(index);
    const reelId = visibleReels[index]?.id;
    if (reelId) router.replace(`${basePath}?reel=${reelId}`, { scroll: false });
    if (updatedReel) {
      setReels((prev) => prev.map((r) => r.id === updatedReel.id ? updatedReel : r));
    }
  }

  const gridClass = gridCols === 3 ? 'reels-grid-3' : 'reels-grid';

  return (
    <div className="reels-page">
      <section className="reels-shell reels-hero" aria-labelledby="reels-hero-title">
        {activeHeroCollection ? (
          <>
            <div className="reels-hero-media" aria-hidden="true">
              {activeHeroCollection.hero_video_url ? (
                <video
                  src={activeHeroCollection.hero_video_url}
                  poster={activeHeroCollection.hero_image_url || heroFallbackReel?.thumbnail_url || undefined}
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="metadata"
                />
              ) : activeHeroCollection.hero_image_url || heroFallbackReel?.thumbnail_url ? (
                <OptimizedImage
                  src={activeHeroCollection.hero_image_url || heroFallbackReel?.thumbnail_url || ''}
                  alt=""
                  fill
                  sizes="(min-width: 760px) 980px, 100vw"
                  className="object-cover"
                  priority
                />
              ) : (
                <span />
              )}
              <div className="reels-hero-scrim" />
            </div>
            <div className="reels-hero-copy">
              <p className="reels-hero-kicker">Watch &amp; Buy</p>
              <h1 id="reels-hero-title" className="font-display text-display-lg text-primary">{activeHeroCollection.title}</h1>
              <p>
                {activeHeroCollection.subtitle ||
                  activeHeroCollection.description ||
                  'See fabric, drape, scale, and styling before you choose your next handmade piece.'}
              </p>
              <div className="reels-hero-actions">
                <Link
                  href={getCollectionCtaHref(activeHeroCollection)}
                  className="reels-action-link reels-action-link-strong"
                >
                  {activeHeroCollection.cta_label || 'Shop Collection'}
                </Link>
                <span>{heroCollectionReels.length} reels</span>
                <span>{formatCompactNumber(totalViews)} views</span>
              </div>
            </div>
            <div className="reels-hero-preview reels-hero-preview-banner" aria-hidden="true">
              {(heroCollectionReels.length ? heroCollectionReels : heroReels).slice(0, 3).map((reel, slot) => (
                <div key={reel?.id || slot} className="reels-hero-frame">
                  {reel?.video_url ? (
                    <video
                      src={reel.video_url}
                      poster={reel.thumbnail_url || undefined}
                      muted
                      loop
                      playsInline
                      autoPlay
                      preload="metadata"
                    />
                  ) : reel?.thumbnail_url ? (
                    <OptimizedImage
                      src={reel.thumbnail_url}
                      alt=""
                      fill
                      sizes="(min-width: 760px) 120px, 30vw"
                      className="object-cover"
                    />
                  ) : (
                    <span />
                  )}
                </div>
              ))}
            </div>
            {displayCollections.length > 1 ? (
              <div className="reels-hero-dots" aria-label="Reel collections carousel">
                {displayCollections.map((collection, index) => (
                  <UnstyledButton
                    key={collection.id}
                    type="button"
                    className={index === activeHeroIndex ? 'active' : ''}
                    onClick={() => setActiveHeroIndex(index)}
                    aria-label={`Show ${collection.title}`}
                  />
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div className="reels-hero-copy">
              <p className="reels-hero-kicker">Watch &amp; Buy</p>
              <h1 id="reels-hero-title" className="font-display text-display-lg text-primary">Odhvica reels edit</h1>
              <p>See fabric movement, handwork detail, scale, and styling before you choose your piece.</p>
              <div className="reels-hero-actions">
                <Link href="/products" className="reels-action-link">
                  Shop the edit
                </Link>
                <span>{reels.length} reels</span>
                <span>{formatCompactNumber(totalViews)} views</span>
              </div>
            </div>
            <div className="reels-hero-preview" aria-hidden="true">
              {[0, 1, 2].map((slot) => {
                const reel = heroReels[slot];
                return (
                  <div key={reel?.id || slot} className="reels-hero-frame">
                    {reel?.video_url ? (
                      <video
                        src={reel.video_url}
                        poster={reel.thumbnail_url || undefined}
                        muted
                        loop
                        playsInline
                        autoPlay
                        preload="metadata"
                      />
                    ) : reel?.thumbnail_url ? (
                      <OptimizedImage
                        src={reel.thumbnail_url}
                        alt=""
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    ) : (
                      <span />
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {displayCollections.length > 0 ? (
        <div className="reels-shell reels-collections" aria-label="Reel collections">
          <UnstyledButton
            type="button"
            className={!activeCollectionHandle ? 'reels-collection-chip active' : 'reels-collection-chip'}
            onClick={() => selectCollection(null)}
          >
            All
          </UnstyledButton>
          {displayCollections.map((collection) => (
            <UnstyledButton
              key={collection.id}
              type="button"
              className={
                activeCollectionHandle === collection.handle
                  ? 'reels-collection-chip active'
                  : 'reels-collection-chip'
              }
              onClick={() => selectCollection(collection.handle)}
            >
              {collection.title}
            </UnstyledButton>
          ))}
        </div>
      ) : null}

      <div className="reels-shell reels-tabs" role="tablist" aria-label="Reels content">
        <UnstyledButton type="button" className="reels-tab active" role="tab" aria-selected="true">
          <Grid3X3 size={16} />
          {activeCollection ? activeCollection.title : 'Reels'}
        </UnstyledButton>
        <div className="reels-grid-toggle" aria-label="Grid layout">
          <IconButton
            type="button"
            onClick={() => setGrid(2)}
            aria-label="2-column grid"
            variant="ghost"
            size="sm"
            className={gridCols === 2 ? 'reels-toggle-button active' : 'reels-toggle-button'}
          >
            <Grid2X2 size={16} />
          </IconButton>
          <IconButton
            type="button"
            onClick={() => setGrid(3)}
            aria-label="3-column grid"
            variant="ghost"
            size="sm"
            className={gridCols === 3 ? 'reels-toggle-button active' : 'reels-toggle-button'}
          >
            <Grid3X3 size={16} />
          </IconButton>
        </div>
      </div>

      <div className="reels-shell reels-grid-shell">
        {loading ? (
          <div className={gridCols === 3 ? 'reels-loading-grid reels-loading-grid-3' : 'reels-loading-grid'}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="reel-skeleton" />
            ))}
          </div>
        ) : visibleReels.length === 0 ? (
          <div className="reels-empty-state">
            <p className="kv-tag">Watch &amp; Buy</p>
            <h2 className="mt-2 kv-title text-display-md">Reels are being curated</h2>
            <p className="mx-auto mt-3 max-w-md text-body-sm leading-token-relaxed text-secondary">
              Product videos will appear here once they are published from the admin.
              Until then, continue with the live catalog and curated collections.
            </p>
            <div className="mt-[var(--ds-space-md)] flex flex-wrap justify-center gap-[var(--ds-space-xs)]">
              <Link href="/products" className="reels-action-link">
                Browse Products
              </Link>
              <Link href="/collections" className="reels-action-link">
                Explore Collections
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className={gridClass}>
              {visibleReels.map((reel, idx) => (
                <UnstyledButton
                  key={reel.id}
                  type="button"
                  onClick={() => openReel(idx)}
                  className="reel-card group"
                  aria-label={`Watch ${reel.product_name}`}
                >
                  <div className="reel-media">
                    {reel.video_url ? (
                      <video
                        className="reel-video transition-transform duration-500 group-hover:scale-105"
                        src={reel.video_url}
                        poster={reel.thumbnail_url || undefined}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        aria-label={reel.product_name}
                      />
                    ) : reel.thumbnail_url ? (
                      <OptimizedImage
                        src={reel.thumbnail_url}
                        alt={reel.product_name}
                        fill
                        sizes={gridCols === 3 ? '33vw' : '50vw'}
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-surface-soft" />
                    )}
                    <div className="reel-grid-gradient" />
                    <div className="reel-grid-overlay">
                      <span className="reel-grid-copy">
                        <span className="reel-grid-kicker">{reel.category || 'Odhvica look'}</span>
                        <span className="reel-grid-title">{reel.product_name}</span>
                        <span className="reel-grid-price">{formatPrice(reel.price)}</span>
                      </span>
                      <span className="reel-grid-views">
                        <Eye size={12} />
                        {formatCompactNumber(reel.view_count || 0)}
                      </span>
                    </div>
                  </div>
                </UnstyledButton>
              ))}
            </div>

            {reels.length > 12 && !showAll && (
              <div className="mt-[var(--ds-space-xl)] text-center">
                <Button type="button" variant="outline" onClick={() => setShowAll(true)}>
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Player */}
      {activeIndex !== null && visibleReels[activeIndex] ? (
        <ReelPlayerModal
          reels={visibleReels}
          initialIndex={activeIndex}
          onClose={closeReel}
          onReelChange={handleReelChange}
        />
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SUSPENSE WRAPPER
// ─────────────────────────────────────────────────────────
function ReelsGridSkeleton() {
  return (
    <div className="min-h-screen bg-surface">
      <div className="sticky top-0 z-40 h-12 border-b border-border-subtle bg-surface-paper/95" />
      <div className="ds-home-container pt-6 pb-8">
        <div className="grid grid-cols-2 gap-[var(--ds-space-xs)]">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="aspect-[9/16] animate-pulse rounded-lg bg-surface-soft" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ReelsExperience(props: ReelsExperienceProps) {
  return (
    <Suspense fallback={<ReelsGridSkeleton />}>
      <ReelsExperienceContent {...props} />
    </Suspense>
  );
}

// ─────────────────────────────────────────────────────────
// INSTAGRAM-STYLE PLAYER MODAL
// ─────────────────────────────────────────────────────────
function ReelPlayerModal({
  reels,
  initialIndex,
  onClose,
  onReelChange,
}: {
  reels: TrendingReelItem[];
  initialIndex: number;
  onClose: () => void;
  onReelChange: (index: number, updated?: TrendingReelItem) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [saved, setSaved] = useState(false);
  const [localReels, setLocalReels] = useState(reels);

  const videoRef = useRef<HTMLVideoElement>(null);
  const seenRef = useRef<Set<string>>(new Set());
  const onReelChangeRef = useRef(onReelChange);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  useEffect(() => { onReelChangeRef.current = onReelChange; }, [onReelChange]);
  useEffect(() => { setLocalReels(reels); }, [reels]);

  const current = localReels[currentIndex];
  const currentId = current?.id;

  // Reset like/save state when reel changes
  useEffect(() => {
    if (!currentId) return;
    setSaved(getSavedReels().has(currentId));
    setLiked(false);
    setLikeCount(0);
  }, [currentId]);

  const goNext = useCallback(() => {
    if (currentIndex >= localReels.length - 1) return;
    const next = currentIndex + 1;
    setCurrentIndex(next);
    onReelChangeRef.current(next);
  }, [currentIndex, localReels.length]);

  const goPrev = useCallback(() => {
    if (currentIndex <= 0) return;
    const next = currentIndex - 1;
    setCurrentIndex(next);
    onReelChangeRef.current(next);
  }, [currentIndex]);

  // Autoplay + view count
  useEffect(() => {
    if (!current) return;
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
    }
    if (seenRef.current.has(current.id)) return;
    seenRef.current.add(current.id);
    void api.recordTrendingReelView(current.id).then((res) => {
      const updated = res?.reel;
      if (!updated) return;
      setLocalReels((prev) =>
        prev.map((r) => r.id === current.id ? { ...r, view_count: updated.view_count } : r)
      );
      onReelChangeRef.current(currentIndex, { ...current, view_count: updated.view_count });
    });
  }, [currentIndex, current]);

  // Modal owns scroll lock; this effect keeps reel-specific shell state and keyboard nav.
  useEffect(() => {
    document.body.classList.add('reel-player-open');
    window.dispatchEvent(new Event('reel-player-state-change'));
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') goNext();
      if (e.key === 'ArrowUp') goPrev();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.classList.remove('reel-player-open');
      window.dispatchEvent(new Event('reel-player-state-change'));
      window.removeEventListener('keydown', onKey);
    };
  }, [goNext, goPrev, onClose]);

  // Touch swipe (vertical)
  function onTouchStart(e: TouchEvent) {
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndY.current = e.targetTouches[0].clientY;
  }
  function onTouchMove(e: TouchEvent) {
    touchEndY.current = e.targetTouches[0].clientY;
  }
  function onTouchEnd() {
    const dy = touchStartY.current - touchEndY.current;
    if (Math.abs(dy) > 50) {
      if (dy > 0) goNext();
      else goPrev();
    }
  }

  async function handleShare() {
    try {
      const url = `${window.location.origin}/reels?reel=${encodeURIComponent(current.id)}`;
      if (navigator.share) {
        await navigator.share({ title: current.product_name, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {}
  }

  if (!current) return null;

  return (
    <Modal
      isOpen
      onClose={onClose}
      showHeader={false}
      rootClassName="z-[9999] p-0"
      className="reel-player-modal h-dvh max-h-none max-w-none border-0 bg-primary shadow-none lg:flex lg:items-center lg:justify-center"
      bodyClassName="h-full overflow-hidden p-0"
    >

      {/* Desktop side arrows */}
      <IconButton
        type="button"
        onClick={goPrev}
        disabled={currentIndex === 0}
        variant="ghost"
        size="lg"
        className="reel-player-nav reel-player-nav-prev absolute top-1/2 z-50 hidden -translate-y-1/2 rounded-full border-transparent bg-surface-paper/15 text-inverse backdrop-blur-md hover:bg-surface-paper/30 disabled:opacity-20 lg:flex"
        aria-label="Previous reel"
      >
        <ChevronLeft size={24} />
      </IconButton>
      <IconButton
        type="button"
        onClick={goNext}
        disabled={currentIndex === localReels.length - 1}
        variant="ghost"
        size="lg"
        className="reel-player-nav reel-player-nav-next absolute top-1/2 z-50 hidden -translate-y-1/2 rounded-full border-transparent bg-surface-paper/15 text-inverse backdrop-blur-md hover:bg-surface-paper/30 disabled:opacity-20 lg:flex"
        aria-label="Next reel"
      >
        <ChevronRight size={24} />
      </IconButton>

      {/*
       * Player shell:
       * Mobile: h-full w-full fills the fixed inset-0 parent exactly.
       * Desktop: h-[90dvh] max-w-[390px] with rounded corners.
       */}
      <div
        className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden bg-primary lg:h-[90dvh] lg:max-w-[430px] lg:rounded-lg"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <OptimizedImage
          src={current.thumbnail_url}
          alt=""
          fill
          sizes="100vw"
          className="scale-110 object-cover opacity-35 blur-xl"
          priority
        />

        <div className="absolute inset-0 bg-[rgba(var(--ds-black-rgb),0.54)]" />

        {/* Keep the full reel visible; non-9:16 uploads should not be cropped. */}
        <video
          key={current.id}
          ref={videoRef}
          src={current.video_url}
          poster={current.thumbnail_url}
          muted
          loop
          playsInline
          autoPlay
          className="reel-player-video absolute inset-0 h-full w-full object-contain"
        />

        {/* Gradients */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[rgba(var(--ds-black-rgb),0.80)] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-[rgba(var(--ds-black-rgb),0.95)] via-[rgba(var(--ds-black-rgb),0.50)] to-transparent" />

        {/* Top bar */}
        <div className="reel-player-topbar relative z-10 flex items-center gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top))] text-inverse">
          <IconButton
            type="button"
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="rounded-full border-transparent bg-primary/40 text-inverse backdrop-blur-sm hover:bg-primary/60"
            aria-label="Close reel player"
          >
            <ArrowLeft size={18} />
          </IconButton>
          <div className="min-w-0 flex-1">
            <p className="text-body-xs font-bold  tracking-token-wider text-inverse/65">
              {currentIndex + 1} / {localReels.length}
            </p>
            <p className="mt-0.5 line-clamp-1 text-body-sm font-semibold text-inverse">
              {current.product_name}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="reel-player-actions absolute bottom-32 right-4 z-20 flex flex-col items-center gap-5 text-inverse">
          {/* Like */}
          <Button
            type="button"
            onClick={() => {
              setLiked((prev) => {
                setLikeCount((c) => prev ? c - 1 : c + 1);
                return !prev;
              });
            }}
            variant="ghost"
            size="sm"
            className="flex min-h-0 flex-col items-center gap-0.5 border-transparent px-0 text-inverse hover:bg-transparent"
            aria-label={liked ? 'Unlike reel' : 'Like reel'}
          >
            <Heart
              size={28}
              fill={liked ? 'var(--ds-text-inverse)' : 'transparent'}
              color="var(--ds-text-inverse)"
              className="drop-shadow transition-transform active:scale-125"
            />
            <span className="text-body-xs font-semibold text-inverse drop-shadow">
              {likeCount > 0 ? likeCount : ''}
            </span>
          </Button>

          {/* Share */}
          <Button
            type="button"
            onClick={handleShare}
            variant="ghost"
            size="sm"
            className="flex min-h-0 flex-col items-center gap-0.5 border-transparent px-0 text-inverse hover:bg-transparent"
            aria-label="Share reel"
          >
            <Share2 size={26} className="text-inverse drop-shadow" />
            <span className="text-body-xs font-semibold text-inverse drop-shadow">Share</span>
          </Button>

          {/* Save */}
          <Button
            type="button"
            onClick={() => setSaved(toggleSavedReel(current.id))}
            variant="ghost"
            size="sm"
            className="flex min-h-0 flex-col items-center gap-0.5 border-transparent px-0 text-inverse hover:bg-transparent"
            aria-label={saved ? 'Remove saved reel' : 'Save reel'}
          >
            <Bookmark
              size={26}
              fill={saved ? 'var(--ds-text-inverse)' : 'transparent'}
              className="text-inverse drop-shadow transition-transform active:scale-125"
            />
            <span className="text-body-xs font-semibold text-inverse drop-shadow">
              {saved ? 'Saved' : 'Save'}
            </span>
          </Button>

          {/* Views */}
          <div
            className="flex flex-col items-center gap-0.5 text-inverse"
            aria-label={`${current.view_count || 0} views`}
          >
            <Eye size={24} className="text-inverse drop-shadow" />
            <span className="text-body-xs font-semibold text-inverse drop-shadow">
              {current.view_count || 0}
            </span>
          </div>
        </div>

        {/* Bottom product overlay */}
        <div className="relative z-10 mt-auto px-[var(--ds-space-xs)] pb-[max(1rem,env(safe-area-inset-bottom))]">
          {/* Product card */}
          <Link
            href={current.link_url || '/products'}
            className="reel-product-overlay flex min-w-0 items-center gap-3 rounded-lg border border-surface-paper/70 bg-surface-paper/[0.88] p-2.5 text-primary shadow-[0_18px_50px_rgba(var(--ds-black-rgb),0.24)] backdrop-blur-xl transition active:scale-[0.98]"
          >
            <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md border border-primary/10 bg-surface-paper">
              <OptimizedImage
                src={current.thumbnail_url}
                alt={current.product_name}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-body-sm font-semibold leading-token-snug text-primary">
                {current.product_name}
              </p>
              <p className="mt-1 text-body-sm font-bold text-accent">
                {formatPrice(current.price)}
              </p>
              <p className="mt-0.5 hidden text-body-xs text-muted sm:block">
                View details, fabric, care, and shipping
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-3.5 py-2 text-body-xs font-bold  tracking-token-wider text-inverse shadow-lg">
              <ShoppingBag size={14} aria-hidden="true" />
              Shop
            </span>
          </Link>
        </div>

        {/* Swipe hint on first reel */}
        {localReels.length > 1 && currentIndex === 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-44 z-10 flex justify-center lg:hidden">
            <span className="rounded-full bg-primary/40 px-4 py-1.5 text-body-xs text-inverse/70 backdrop-blur-sm">
              Swipe up for next
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}
