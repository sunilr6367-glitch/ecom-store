'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PromoBar } from './PromoBar';
import { HeaderMain } from './HeaderMain';
import { SearchBar } from './SearchBar';
import { MegaMenu } from './MegaMenu';
import { MobileTopBar } from './mobile/MobileTopBar';
import MobileMenu from '@/components/layout/MobileMenu';
import CartDrawer from '@/components/layout/CartDrawer';
import SearchOverlay from '@/components/search/SearchOverlay';

interface Collection {
  id: string;
  title?: string;
  name?: string;
  handle: string;
  status?: string;
  show_in_megamenu?: boolean;
  display_order?: number;
  cover_image_url?: string | null;
  image?: string | null;
}

interface HeaderCategory {
  id: string;
  name: string;
  slug: string;
  handle?: string;
  image?: string | null;
  header_image_url?: string | null;
  show_in_header?: boolean;
  is_active?: boolean;
  display_order?: number;
  children?: HeaderCategory[];
}

export function SiteHeader() {
  const [isSticky, setIsSticky] = useState(false);
  const [activeMega, setActiveMega] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [categories, setCategories] = useState<HeaderCategory[]>([]);

  const megaLeaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sticky scroll detection
  useEffect(() => {
    const handleScroll = () => setIsSticky(window.scrollY > 32);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch categories and collections for navigation.
  useEffect(() => {
    import('@/lib/api').then(({ api }) => {
      Promise.all([api.getCategoriesTree(), api.getCollections()])
        .then(([categoriesData, collectionsData]: [
          { categories?: HeaderCategory[] },
          { collections?: Collection[] },
        ]) => {
          setCategories(categoriesData.categories ?? []);
          setCollections(collectionsData.collections ?? []);
        })
        .catch(() => {});
    });
  }, []);

  const handleMegaEnter = useCallback((label: string) => {
    if (megaLeaveTimer.current) clearTimeout(megaLeaveTimer.current);
    setActiveMega(label);
  }, []);

  const handleMegaLeave = useCallback(() => {
    megaLeaveTimer.current = setTimeout(() => setActiveMega(null), 180);
  }, []);

  // The homepage no longer begins with a full-bleed dark hero. Its first section is
  // a light category discovery strip, so transparent/inverse header chrome makes the
  // brand mark and navigation disappear into the page background on first paint.
  const isTransparent = false;

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
  }, []);

  const headerCls = isTransparent
    ? 'sticky top-0 z-50 w-full bg-transparent transition-all duration-300'
    : 'sticky top-0 z-50 w-full bg-transparent shadow-sm transition-all duration-300';

  return (
    <>
      <header
        className={headerCls}
        onMouseLeave={handleMegaLeave}
      >
        {/* PromoBar — hidden when sticky or transparent */}
        {!isTransparent && <PromoBar isSticky={isSticky} />}

        {/* Desktop header */}
        <HeaderMain
          activeMega={activeMega}
          onMegaEnter={handleMegaEnter}
          onMegaLeave={handleMegaLeave}
          onSearchOpen={() => setSearchOpen(true)}
          onCartOpen={() => setCartOpen(true)}
          isTransparent={isTransparent}
        />

        {/* Desktop search bar */}
        <div className="hidden md:block relative">
          <SearchBar isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
        </div>

        {/* Desktop mega menu */}
        <div className="hidden md:block relative">
          <MegaMenu
            isOpen={activeMega !== null}
            onClose={() => setActiveMega(null)}
            categories={categories}
            collections={collections}
          />
        </div>

        {/* Mobile top bar */}
        <MobileTopBar
          isDrawerOpen={drawerOpen}
          onToggleDrawer={() => setDrawerOpen((v) => !v)}
          onSearchOpen={() => setSearchOpen(true)}
          onCartOpen={() => setCartOpen(true)}
          isTransparent={isTransparent}
        />

      </header>

      {/* Mobile drawer — outside header to escape stacking context */}
      <MobileMenu
        isOpen={drawerOpen}
        onClose={closeDrawer}
        categories={categories}
        collections={collections}
      />

      {/* Mobile search overlay */}
      <div className="md:hidden">
        <SearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      </div>

      {/* Cart drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
