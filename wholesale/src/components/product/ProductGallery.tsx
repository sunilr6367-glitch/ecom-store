'use client';

import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import type { ProductImage, ProductVideo } from '@/types';
import { UnstyledButton } from '@/components/ui/Button';

interface ProductGalleryProps {
  media: ProductImage[];
  title: string;
  videos?: ProductVideo[];
  scarcityLabel?: string;
  wishlistButton?: ReactNode;
}

type GalleryItem = {
  id: string;
  type: 'image' | 'video';
  src: string;
  thumbnail?: string;
  alt: string;
};

function buildGalleryItems(
  media: ProductImage[],
  title: string,
  videos: ProductVideo[] = []
): GalleryItem[] {
  const mediaItems: GalleryItem[] = media.map((item, index) => ({
    id: item.id || `${item.url}-${index}`,
    type: item.metadata?.media_type === 'video' ? 'video' : 'image',
    src: item.url,
    thumbnail: item.metadata?.thumbnail_url,
    alt: item.alt_text || item.alt || `${title} view ${index + 1}`,
  }));

  const fallbackVideos: GalleryItem[] = videos
    .filter(
      (video) =>
        !mediaItems.some(
          (item) => item.type === 'video' && item.src === video.url
        )
    )
    .map((video, index) => ({
      id: video.id || `gallery-video-${index}`,
      type: 'video',
      src: video.url,
      thumbnail: video.thumbnail,
      alt: `${title} video ${index + 1}`,
    }));

  return [...mediaItems, ...fallbackVideos];
}

export default function ProductGallery({
  media,
  title,
  videos = [],
  scarcityLabel,
  wishlistButton,
}: ProductGalleryProps) {
  const items = useMemo(
    () => buildGalleryItems(media, title, videos),
    [media, title, videos]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const slideRefs = useRef<Array<HTMLDivElement | null>>([]);
  const mobileVideoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const desktopVideoRefs = useRef<Array<HTMLVideoElement | null>>([]);

  useEffect(() => {
    slideRefs.current = slideRefs.current.slice(0, items.length);
    mobileVideoRefs.current = mobileVideoRefs.current.slice(0, items.length);
    desktopVideoRefs.current = desktopVideoRefs.current.slice(0, items.length);
  }, [items.length]);

  useEffect(() => {
    const slides = slideRefs.current.filter(Boolean) as HTMLDivElement[];
    if (slides.length === 0 || typeof IntersectionObserver === 'undefined') {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visibleEntry) return;

        const nextIndex = Number(
          (visibleEntry.target as HTMLElement).dataset.index || 0
        );
        setActiveIndex((current) => (current === nextIndex ? current : nextIndex));
      },
      { threshold: [0.55, 0.75] }
    );

    slides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [items.length]);

  useEffect(() => {
    const allRefs = [mobileVideoRefs.current, desktopVideoRefs.current];

    allRefs.forEach((group) => {
      group.forEach((video, index) => {
        if (!video || typeof window === 'undefined') return;

        video.muted = isMuted;

        const isVisible =
          video.offsetParent !== null &&
          window.getComputedStyle(video).display !== 'none';

        if (
          index === activeIndex &&
          items[index]?.type === 'video' &&
          isVisible
        ) {
          const playPromise = video.play();
          if (playPromise) playPromise.catch(() => undefined);
          return;
        }

        video.pause();
      });
    });
  }, [activeIndex, isMuted, items]);

  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxOpen(false);
      if (event.key === 'ArrowLeft') {
        setActiveIndex((current) =>
          current === 0 ? items.length - 1 : current - 1
        );
      }
      if (event.key === 'ArrowRight') {
        setActiveIndex((current) =>
          current === items.length - 1 ? 0 : current + 1
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length, lightboxOpen]);

  if (items.length === 0) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-[var(--radius-lg)] bg-surface-soft text-muted">
        No media
      </div>
    );
  }

  const goToIndex = (index: number, scrollGallery = false) => {
    setActiveIndex(index);

    if (!scrollGallery) return;

    slideRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'start',
      block: 'nearest',
    });
  };

  const scrollToIndex = (index: number) => goToIndex(index, true);
  const showPrev = (scrollGallery = false) =>
    goToIndex(activeIndex === 0 ? items.length - 1 : activeIndex - 1, scrollGallery);
  const showNext = (scrollGallery = false) =>
    goToIndex(activeIndex === items.length - 1 ? 0 : activeIndex + 1, scrollGallery);

  const activeItem = items[activeIndex];

  return (
    <div className="space-y-4 lg:sticky lg:top-24">
      <div className="lg:hidden">
        <div className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item, index) => (
            <div
              key={item.id}
              ref={(node) => {
                slideRefs.current[index] = node;
              }}
              data-index={index}
              className="relative w-full shrink-0 snap-center bg-surface-soft"
            >
              <div className="pdp-gallery-frame relative overflow-hidden">
                {item.type === 'video' ? (
                  <>
                    <video
                      ref={(node) => {
                        mobileVideoRefs.current[index] = node;
                      }}
                      src={item.src}
                      poster={item.thumbnail}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="h-full w-full object-cover"
                    />
                    <UnstyledButton
                      type="button"
                      onClick={() => setIsMuted((current) => !current)}
                      className="absolute bottom-4 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ds-text-primary)]/40 text-inverse backdrop-blur-sm"
                      aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                    >
                      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </UnstyledButton>
                  </>
                ) : (
                  <UnstyledButton
                    type="button"
                    onClick={() => {
                      setActiveIndex(index);
                      setLightboxOpen(true);
                    }}
                    className="relative block h-full w-full"
                    aria-label="Open product image in fullscreen"
                  >
                    <OptimizedImage
                      src={item.src}
                      alt={item.alt}
                      fill
                      priority={index === 0}
                      className="object-cover"
                      sizes="100vw"
                    />
                  </UnstyledButton>
                )}

                {item.type === 'video' && (
                  <div className="media-badge absolute left-4 top-4 flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--ds-text-primary)]/45 px-3 py-1.5">
                    <Play size={12} fill="currentColor" />
                    Reel
                  </div>
                )}
                {scarcityLabel && item.type !== 'video' ? (
                  <Badge variant="accent" className="pdp-gallery-badge">
                    {scarcityLabel}
                  </Badge>
                ) : null}
                {wishlistButton ? (
                  <div className="pdp-gallery-wishlist">{wishlistButton}</div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {items.length > 1 && (
          <div className="mt-4 space-y-4">
            <div className="flex justify-center gap-[var(--ds-space-xs)]">
              {items.map((item, index) => (
                <UnstyledButton
                  key={`${item.id}-dot`}
                  type="button"
                  onClick={() => scrollToIndex(index)}
                  className={`pdp-gallery-dot ${
                    activeIndex === index ? 'active' : ''
                  }`}
                  aria-label={`View media ${index + 1}`}
                />
              ))}
            </div>

            <div className="flex gap-[var(--ds-space-xs)] overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {items.map((item, index) => (
                <UnstyledButton
                  key={`${item.id}-thumb`}
                  type="button"
                  onClick={() => scrollToIndex(index)}
                  className={`relative h-16 w-12 shrink-0 overflow-hidden rounded-[var(--radius-md)] border bg-surface-soft ${
                    activeIndex === index
                      ? 'border-[var(--ds-text-primary)]'
                      : 'border-transparent opacity-70'
                  }`}
                  aria-label={`Select media ${index + 1}`}
                >
                  {item.type === 'video' ? (
                    <>
                      {item.thumbnail ? (
                        <OptimizedImage
                          src={item.thumbnail}
                          alt={item.alt}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-surface-warm text-muted">
                          <Play size={14} />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-[var(--ds-text-primary)]/10">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--ds-text-primary)]/60 text-inverse">
                          <Play size={12} fill="currentColor" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <OptimizedImage
                      src={item.src}
                      alt={item.alt}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  )}
                </UnstyledButton>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="hidden lg:block">
        <div className="space-y-4">
          <div className="pdp-gallery-frame pdp-gallery-frame-desktop relative overflow-hidden bg-surface-soft">
            {activeItem.type === 'video' ? (
              <>
                <video
                  ref={(node) => {
                    desktopVideoRefs.current[activeIndex] = node;
                  }}
                  src={activeItem.src}
                  poster={activeItem.thumbnail}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
                <UnstyledButton
                  type="button"
                  onClick={() => setIsMuted((current) => !current)}
                  className="absolute bottom-5 right-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ds-text-primary)]/40 text-inverse backdrop-blur-sm"
                  aria-label={isMuted ? 'Unmute video' : 'Mute video'}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </UnstyledButton>
                <div className="media-badge absolute left-5 top-5 flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--ds-text-primary)]/45 px-3 py-1.5">
                  <Play size={12} fill="currentColor" />
                  Reel
                </div>
              </>
            ) : (
              <UnstyledButton
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="relative block h-full w-full"
                aria-label="Open product image in fullscreen"
              >
                <OptimizedImage
                  src={activeItem.src}
                  alt={activeItem.alt}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1280px) 50vw, 700px"
                />
              </UnstyledButton>
            )}

            {items.length > 1 && (
              <>
                <UnstyledButton
                  type="button"
                  onClick={() => showPrev()}
                  className="absolute left-5 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--ds-surface-paper)]/90 text-primary shadow-sm"
                  aria-label="Previous media"
                >
                  <ChevronLeft size={20} />
                </UnstyledButton>
                <UnstyledButton
                  type="button"
                  onClick={() => showNext()}
                  className="absolute right-5 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--ds-surface-paper)]/90 text-primary shadow-sm"
                  aria-label="Next media"
                >
                  <ChevronRight size={20} />
                </UnstyledButton>
              </>
            )}
            {scarcityLabel && activeItem.type !== 'video' ? (
              <Badge variant="accent" className="pdp-gallery-badge">
                {scarcityLabel}
              </Badge>
            ) : null}
            {wishlistButton ? (
              <div className="pdp-gallery-wishlist">{wishlistButton}</div>
            ) : null}
          </div>

          {items.length > 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-[var(--ds-space-xs)]">
                {items.map((item, index) => (
                  <UnstyledButton
                    key={`${item.id}-desktop-dot`}
                    type="button"
                    onClick={() => goToIndex(index)}
                    className={`h-2 rounded-[var(--ds-radius-pill)] transition-all ${
                      activeIndex === index ? 'w-8 bg-[var(--ds-text-primary)]' : 'w-2 bg-[var(--ds-border-strong)]'
                    }`}
                    aria-label={`Go to media ${index + 1}`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-4 gap-[var(--ds-space-xs)]">
                {items.map((item, index) => (
                  <UnstyledButton
                    key={`${item.id}-desktop-thumb`}
                    type="button"
                    onMouseEnter={() => goToIndex(index)}
                    onFocus={() => goToIndex(index)}
                    onClick={() => goToIndex(index)}
                    className={`relative aspect-[4/5] overflow-hidden rounded-[var(--radius-md)] border ${
                      activeIndex === index
                        ? 'border-[var(--ds-text-primary)]'
                        : 'border-transparent opacity-75'
                    }`}
                    aria-label={`Select media ${index + 1}`}
                  >
                    {item.type === 'video' ? (
                      <>
                        {item.thumbnail ? (
                          <OptimizedImage
                            src={item.thumbnail}
                            alt={item.alt}
                            fill
                            className="object-cover"
                            sizes="120px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-surface-warm text-muted">
                            <Play size={16} />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-[var(--ds-text-primary)]/10">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--ds-text-primary)]/60 text-inverse">
                            <Play size={12} fill="currentColor" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <OptimizedImage
                        src={item.src}
                        alt={item.alt}
                        fill
                        className="object-cover"
                        sizes="120px"
                      />
                    )}
                  </UnstyledButton>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={lightboxOpen && activeItem.type === 'image'}
        onClose={() => setLightboxOpen(false)}
        showHeader={false}
        rootClassName="z-[120] p-[var(--ds-space-sm)]"
        className="h-full max-h-none max-w-5xl border-0 bg-transparent shadow-none"
        bodyClassName="relative h-full p-0"
      >
          <UnstyledButton
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-5 top-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--ds-surface-paper)]/10 text-inverse"
            aria-label="Close fullscreen image"
          >
            <X size={22} />
          </UnstyledButton>

          {items.length > 1 && (
            <>
              <UnstyledButton
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showPrev();
                }}
                className="absolute left-5 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--ds-surface-paper)]/10 text-inverse"
                aria-label="Previous image"
              >
                <ChevronLeft size={22} />
              </UnstyledButton>
              <UnstyledButton
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  showNext();
                }}
                className="absolute right-5 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-[var(--ds-surface-paper)]/10 text-inverse"
                aria-label="Next image"
              >
                <ChevronRight size={22} />
              </UnstyledButton>
            </>
          )}

          <div
            className="relative h-full w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <OptimizedImage
              src={activeItem.src}
              alt={activeItem.alt}
              fill
              priority
              className="object-contain"
              sizes="100vw"
            />
          </div>
      </Modal>
    </div>
  );
}
