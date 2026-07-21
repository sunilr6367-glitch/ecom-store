'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  Rows3,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import FilterSidebar from '@/components/products/FilterSidebar';
import ProductGrid from '@/components/ProductGrid';
import { RecentlyViewedRow } from '@/components/product/RecentlyViewedRow';
import { Button, Drawer, IconButton, Select, UnstyledButton } from '@/design-system';
import { api } from '@/lib/api';
import { filterStorefrontReadyProducts } from '@/lib/storefront-product-quality';
import { Product } from '@/types';

interface Category {
  id: string;
  name: string;
  slug?: string;
  handle?: string;
  children?: Category[];
}

interface Tag {
  id: string;
  name: string;
}

interface Collection {
  id: string;
  title: string;
  handle?: string;
}

interface CatalogClientProps {
  initialProducts: Product[];
  categories: Category[];
  tags: Tag[];
  collections?: Collection[];
  totalProducts?: number;
  categoryPageBanners?: Array<{
    id: string;
    image_url: string;
    headline?: string | null;
    button_label?: string | null;
    button_url?: string | null;
  }>;
  categoryCircles?: Array<{
    id: string;
    image_url: string;
    label: string;
    link_url: string;
  }>;
  spotlightProducts?: Array<{
    id: string;
    custom_image_url?: string | null;
    badge_text?: string | null;
    product: Product | null;
  }>;
}

const DEFAULT_LIMIT = 12;

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

const QUICK_SHOP_CHIPS = [
  { label: 'Jackets', href: '/search?q=jackets' },
  { label: 'Tote Bags', href: '/search?q=tote%20bags' },
  { label: 'Kantha', href: '/search?q=kantha' },
  { label: 'Block Print', href: '/search?q=block%20print' },
  { label: 'Under Rs. 2,000', href: '/products?max_price=200000' },
];

function findCategoryById(categories: Category[], id: string): Category | null {
  for (const category of categories) {
    if (category.id === id) return category;
    if (category.children?.length) {
      const match = findCategoryById(category.children, id);
      if (match) return match;
    }
  }
  return null;
}

export default function CatalogClient({
  initialProducts,
  categories,
  tags,
  collections = [],
  totalProducts,
  spotlightProducts = [],
}: CatalogClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement | null>(null);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [total, setTotal] = useState(totalProducts || initialProducts.length);
  const [page, setPage] = useState(1);
  const [limit] = useState(DEFAULT_LIMIT);
  const [loading, setLoading] = useState(false);
  const [gridDensity, setGridDensity] = useState<'grid' | 'compact'>('grid');

  const currentSort = searchParams.get('sort') || 'newest';
  const currentCategoryId = searchParams.get('category_id');
  const currentTagId = searchParams.get('tag_id');
  const currentCollectionId = searchParams.get('collection_id');
  const currentAttributeCode = searchParams.get('attribute_code');
  const currentAttributeValue = searchParams.get('attribute_value');
  const currentMinPrice = searchParams.get('min_price');
  const currentMaxPrice = searchParams.get('max_price');

  const activeCategory = currentCategoryId
    ? findCategoryById(categories, currentCategoryId)
    : null;
  const activeTag = currentTagId
    ? tags.find((tag) => tag.id === currentTagId)
    : null;
  const activeCollection = currentCollectionId
    ? collections.find((collection) => collection.id === currentCollectionId)
    : null;
  const activeFilterCount = [
    currentCategoryId,
    currentTagId,
    currentCollectionId,
    currentAttributeCode && currentAttributeValue,
    currentMinPrice || currentMaxPrice,
  ].filter(Boolean).length;

  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    setProducts(initialProducts);
    setTotal(totalProducts || initialProducts.length);
    setPage(1);
  }, [initialProducts, totalProducts]);

  useEffect(() => {
    if (!filterDrawerOpen) return;

    const triggerButton = filterButtonRef.current;

    return () => {
      triggerButton?.focus();
    };
  }, [filterDrawerOpen]);

  const fetchProducts = useCallback(
    async (pageNum: number, sortValue?: string) => {
      setLoading(true);
      try {
        const offset = (pageNum - 1) * limit;
        const result = await api.getProducts({
          limit,
          offset,
          sort: sortValue || currentSort,
          category_id: currentCategoryId || undefined,
          tag_id: currentTagId || undefined,
          collection_id: currentCollectionId || undefined,
          attribute_code: currentAttributeCode || undefined,
          attribute_value: currentAttributeValue || undefined,
          min_price: currentMinPrice ? Number(currentMinPrice) : undefined,
          max_price: currentMaxPrice ? Number(currentMaxPrice) : undefined,
        });

        if (result.products) {
          const readyProducts = filterStorefrontReadyProducts(result.products);
          setProducts(readyProducts);
          setTotal(readyProducts.length);
        }
      } catch (error) {
        console.warn('[CatalogClient] Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    },
    [
      limit,
      currentSort,
      currentCategoryId,
      currentTagId,
      currentCollectionId,
      currentAttributeCode,
      currentAttributeValue,
      currentMinPrice,
      currentMaxPrice,
    ]
  );

  const updateQuery = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const nextQuery = params.toString();
    router.push(nextQuery ? `/products?${nextQuery}` : '/products');
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
    fetchProducts(newPage);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleSortChange = (newSort: string) => {
    updateQuery((params) => {
      if (newSort && newSort !== 'newest') {
        params.set('sort', newSort);
      } else {
        params.delete('sort');
      }
    });
    setPage(1);
    fetchProducts(1, newSort);
  };

  const clearFilter = (
    key:
      | 'category_id'
      | 'tag_id'
      | 'collection_id'
      | 'attribute_code'
      | 'attribute_value'
      | 'min_price'
      | 'max_price'
  ) => {
    updateQuery((params) => params.delete(key));
  };

  const startItem = total > 0 ? (page - 1) * limit + 1 : 0;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="min-h-screen bg-surface-paper">
      <div className="bg-surface-paper">
        <div className="ds-home-container pb-12 pt-6 md:pb-16 md:pt-8 lg:pb-24">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-4">
            <div className="min-w-0">
              <h1 className="catalog-page-heading">Products</h1>
              <p className="catalog-page-subcopy">
                Handmade jackets, quilted bags, and textile-led edits from Jaipur.
              </p>
              <div className="catalog-quick-chips" aria-label="Quick shop filters">
                {QUICK_SHOP_CHIPS.map((chip) => (
                  <Link key={chip.label} href={chip.href} className="catalog-quick-chip">
                    {chip.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-[var(--ds-space-xs)]">
              <UnstyledButton
                ref={filterButtonRef}
                type="button"
                onClick={() => setFilterDrawerOpen(true)}
                className="group inline-flex h-10 items-center gap-2 border border-primary bg-surface-paper px-4 text-body-xs font-bold  tracking-token-wider text-primary transition-colors hover:bg-primary hover:text-inverse"
                aria-label="Open filters"
              >
                <SlidersHorizontal size={14} />
                Filter
                {activeFilterCount > 0 ? (
                  <span className="kv-count-badge inline-flex h-5 min-w-5 rounded-full bg-primary px-1.5 text-inverse group-hover:bg-surface-paper group-hover:text-primary">
                    {activeFilterCount}
                  </span>
                ) : null}
              </UnstyledButton>

              <div className="catalog-count">
                {total > 0
                  ? `${startItem}-${endItem} of ${total} Items`
                  : `${total} Items`}
              </div>

              <div
                className="hidden items-center overflow-hidden border border-border-subtle bg-surface-paper sm:flex"
                aria-label="Product grid density"
              >
                <UnstyledButton
                  type="button"
                  onClick={() => setGridDensity('grid')}
                  className={`flex h-10 w-10 items-center justify-center border transition-colors ${
                    gridDensity === 'grid'
                      ? 'border-primary bg-surface-paper text-primary'
                      : 'border-transparent text-muted hover:bg-parchment hover:text-primary'
                  }`}
                  aria-label="Grid view"
                  title="Grid view"
                >
                  <Grid2X2 size={15} />
                </UnstyledButton>
                <UnstyledButton
                  type="button"
                  onClick={() => setGridDensity('compact')}
                  className={`flex h-10 w-10 items-center justify-center border transition-colors ${
                    gridDensity === 'compact'
                      ? 'border-primary bg-surface-paper text-primary'
                      : 'border-transparent text-muted hover:bg-parchment hover:text-primary'
                  }`}
                  aria-label="Compact view"
                  title="Compact view"
                >
                  <Rows3 size={15} />
                </UnstyledButton>
              </div>

              <div className="flex h-10 items-center gap-2 border border-border-subtle px-3">
                <ArrowUpDown size={14} className="text-muted" />
                <Select
                  aria-label="Sort products"
                  value={currentSort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="h-auto cursor-pointer border-0 bg-transparent px-0 py-0 focus:border-transparent"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          {activeFilterCount > 0 ? (
            <div className="mt-[var(--ds-space-sm)] flex flex-wrap items-center gap-[var(--ds-space-xs)]">
              {activeCategory ? (
                <Button
                  type="button"
                  onClick={() => clearFilter('category_id')}
                  variant="chipSelected"
                  size="sm"
                  className="catalog-active-chip px-3 py-1"
                  aria-label={`Remove category filter ${activeCategory.name}`}
                >
                  {activeCategory.name}
                  <X size={12} />
                </Button>
              ) : null}

              {activeTag ? (
                <Button
                  type="button"
                  onClick={() => clearFilter('tag_id')}
                  variant="chipSelected"
                  size="sm"
                  className="catalog-active-chip px-3 py-1"
                  aria-label={`Remove tag filter ${activeTag.name}`}
                >
                  {activeTag.name}
                  <X size={12} />
                </Button>
              ) : null}

              {activeCollection ? (
                <Button
                  type="button"
                  onClick={() => clearFilter('collection_id')}
                  variant="chipSelected"
                  size="sm"
                  className="catalog-active-chip px-3 py-1"
                  aria-label={`Remove collection filter ${activeCollection.title}`}
                >
                  {activeCollection.title}
                  <X size={12} />
                </Button>
              ) : null}

              {currentAttributeCode && currentAttributeValue ? (
                <span className="catalog-active-chip inline-flex items-center gap-2 rounded-full border border-border-subtle bg-parchment px-3 py-1">
                  Attribute filter
                  <UnstyledButton
                    onClick={() =>
                      updateQuery((params) => {
                        params.delete('attribute_code');
                        params.delete('attribute_value');
                      })
                    }
                    aria-label="Remove attribute filter"
                    className="text-muted transition-colors hover:text-primary"
                  >
                    <X size={12} />
                  </UnstyledButton>
                </span>
              ) : null}

              {(currentMinPrice || currentMaxPrice) ? (
                <Button
                  type="button"
                  onClick={() =>
                    updateQuery((params) => {
                      params.delete('min_price');
                      params.delete('max_price');
                    })
                  }
                  variant="chipSelected"
                  size="sm"
                  className="catalog-active-chip px-3 py-1"
                  aria-label="Remove price filter"
                >
                  Price:{' '}
                  {[
                    currentMinPrice
                      ? `${Math.round(Number(currentMinPrice) / 100)}+`
                      : null,
                    currentMaxPrice
                      ? `up to ${Math.round(Number(currentMaxPrice) / 100)}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  <X size={12} />
                </Button>
              ) : null}
            </div>
          ) : null}

          <main className="mt-[var(--ds-space-md)] min-w-0">
            <ProductGrid
              initialProducts={products}
              loading={loading}
              spotlightProducts={spotlightProducts}
              density={gridDensity}
            />

            {totalPages > 1 ? (
              <div className="mt-[var(--ds-space-2xl)] flex items-center justify-center gap-[var(--ds-space-xs)]">
                <IconButton
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1 || loading}
                  variant="ghost"
                  size="sm"
                  className="rounded-md border border-border-subtle text-secondary hover:bg-parchment hover:text-primary"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={20} />
                </IconButton>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      disabled={loading}
                      variant={page === pageNum ? 'paginationSelected' : 'pagination'}
                      size="none"
                      className="catalog-count"
                      aria-label={`Page ${pageNum}`}
                      aria-current={page === pageNum ? 'page' : undefined}
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                <IconButton
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages || loading}
                  variant="ghost"
                  size="sm"
                  className="rounded-md border border-border-subtle text-secondary hover:bg-parchment hover:text-primary"
                  aria-label="Next page"
                >
                  <ChevronRight size={20} />
                </IconButton>
              </div>
            ) : null}
            <RecentlyViewedRow />
          </main>
        </div>
      </div>

      <Drawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        title="Filters"
        side="bottom"
        className="max-h-[90vh] sm:inset-y-0 sm:left-0 sm:right-auto sm:h-full sm:max-h-none sm:w-[360px] sm:max-w-[92vw]"
        bodyClassName="p-[var(--ds-space-sm)] sm:px-[var(--ds-space-md)] sm:py-0"
      >
        <FilterSidebar
          categories={categories}
          tags={tags}
          collections={collections}
          onApply={() => setFilterDrawerOpen(false)}
          onClose={() => setFilterDrawerOpen(false)}
        />
      </Drawer>
    </div>
  );
}
