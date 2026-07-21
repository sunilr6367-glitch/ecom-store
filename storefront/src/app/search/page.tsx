'use client';


import { Heading } from '@/design-system';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Loader2, Filter, ArrowLeft, Search } from 'lucide-react';
import { Input } from '@/design-system';
import { Button, ButtonLink, UnstyledButton } from '@/design-system';
import { Card } from '@/design-system';
import { EmptyState } from '@/design-system';
import ProductGrid from '@/components/ProductGrid';
import type { Product } from '@/types';
import { filterStorefrontReadyProducts } from '@/lib/storefront-product-quality';
import {
  storefrontAttributeFilters,
  storefrontDiscoveryQuickLinks,
} from '@/config/storefront-discovery';
import { storefrontTrust } from '@/config/storefront-trust';

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  const hasQuery = query.trim().length > 0;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftQuery, setDraftQuery] = useState(query);
  const [sort, setSort] = useState('relevance');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<{
    min?: string;
    max?: string;
    attributeCode?: string;
    attributeValue?: string;
  }>({});
  const hasActiveFilters = Boolean(
    appliedFilters.min ||
      appliedFilters.max ||
      (appliedFilters.attributeCode && appliedFilters.attributeValue)
  );

  useEffect(() => {
    setDraftQuery(query);
  }, [query]);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        // Convert price to cents if necessary? API expects cents?
        // api.getProducts docs say params.min_price: number.
        // Assuming backend expects cents.
        const params: {
          search: string;
          limit: number;
          sort: string;
          min_price?: number;
          max_price?: number;
          attribute_code?: string;
          attribute_value?: string;
        } = {
          search: query,
          limit: 50,
          sort: sort,
        };
        if (appliedFilters.min)
          params.min_price = Number(appliedFilters.min) * 100;
        if (appliedFilters.max)
          params.max_price = Number(appliedFilters.max) * 100;
        if (appliedFilters.attributeCode && appliedFilters.attributeValue) {
          params.attribute_code = appliedFilters.attributeCode;
          params.attribute_value = appliedFilters.attributeValue;
        }

        const data = await api.getProducts(params);
        setProducts(filterStorefrontReadyProducts(data.products || []));
      } catch (error) {
        console.error('Failed to search products', error);
      } finally {
        setLoading(false);
      }
    };

    if (hasQuery) {
      fetchResults();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [hasQuery, query, sort, appliedFilters]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const nextQuery = draftQuery.trim();
    if (!nextQuery) return;
    router.push(`/search?q=${encodeURIComponent(nextQuery)}`);
  };

  const handleFilterApply = () => {
    setAppliedFilters({
      min: minPrice,
      max: maxPrice,
      attributeCode: appliedFilters.attributeCode,
      attributeValue: appliedFilters.attributeValue,
    });
    setShowFilters(false);
  };

  const setAttributeFilter = (code: string, value: string) => {
    setAppliedFilters((prev) => {
      const isSame =
        prev.attributeCode === code && prev.attributeValue === value;

      return {
        ...prev,
        attributeCode: isSame ? undefined : code,
        attributeValue: isSame ? undefined : value,
      };
    });
  };

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setAppliedFilters({});
    setShowFilters(false);
  };

  return (
    <div className="min-h-screen bg-surface-paper py-token-xl md:py-token-2xl lg:py-token-3xl">
      <div className="ds-page-container mx-auto max-w-page">
        {/* Header */}
        <div className="mb-12">
          <Link
            href="/"
            className="search-back-link mb-6 inline-flex items-center gap-2 pl-1 hover:text-primary"
          >
            <ArrowLeft size={14} /> Back to Home
          </Link>
          <Heading role="page" className="search-title mb-4">{hasQuery ? 'Search Results' : 'Search Odhvica'}</Heading>
          <form onSubmit={submitSearch} className="mb-4 max-w-2xl">
            <div className="relative">
              <Search
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-disabled"
              />
              <Input
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
                placeholder="Search jackets, bags, sarees..."
                className="min-h-12 bg-surface-paper pl-11 pr-4"
                aria-label="Search products"
              />
            </div>
          </form>
          <p className="text-muted">
            {!hasQuery ? (
              <span>Search by product, fabric, color, occasion, or browse a guided route below.</span>
            ) : loading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={16} /> Searching for
                &quot;{query}&quot;...
              </span>
            ) : (
              <span>
                Found {products.length} results for &quot;
                <span className="search-query">{query}</span>&quot;
              </span>
            )}
          </p>
        </div>

        {/* Filters Toolbar */}
        {hasQuery ? (
        <div className="flex flex-col md:flex-row md:items-center justify-between border-y border-border-subtle py-4 mb-12 gap-4">
          <div className="relative">
            <UnstyledButton
              onClick={() => setShowFilters(!showFilters)}
              className="search-toolbar-button flex items-center gap-2 hover:text-secondary"
            >
              <Filter size={16} /> Filters
            </UnstyledButton>

            {showFilters && (
              <div className="absolute top-full left-0 mt-4 w-64 bg-surface-paper shadow-xl z-20 border border-border-subtle p-6">
                <h4 className="search-filter-title mb-4">Price Range</h4>
                <div className="flex items-center gap-2 mb-4">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <span>-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
                <UnstyledButton
                  onClick={() => handleFilterApply()}
                  className="search-apply-button w-full bg-primary py-2"
                >
                  Apply
                </UnstyledButton>
              </div>
            )}
          </div>

          <div className="relative">
            <UnstyledButton
              onClick={() => setShowSortMenu(!showSortMenu)}
              className="search-toolbar-button flex items-center gap-2 hover:text-secondary"
            >
              Sort by:{' '}
              {sort === 'relevance'
                ? 'Featured'
                : sort === 'price_asc'
                  ? 'Price: Low to High'
                  : sort === 'price_desc'
                    ? 'Price: High to Low'
                    : 'Newest'}
            </UnstyledButton>

            {showSortMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-surface-paper shadow-xl z-20 border border-border-subtle rounded-sm overflow-hidden py-1">
                <UnstyledButton
                  onClick={() => {
                    setSort('relevance');
                    setShowSortMenu(false);
                  }}
                  className="search-sort-option w-full px-4 py-2 text-left hover:bg-parchment"
                >
                  Featured
                </UnstyledButton>
                <UnstyledButton
                  onClick={() => {
                    setSort('newest');
                    setShowSortMenu(false);
                  }}
                  className="search-sort-option w-full px-4 py-2 text-left hover:bg-parchment"
                >
                  Newest Arrivals
                </UnstyledButton>
                <UnstyledButton
                  onClick={() => {
                    setSort('price_asc');
                    setShowSortMenu(false);
                  }}
                  className="search-sort-option w-full px-4 py-2 text-left hover:bg-parchment"
                >
                  Price: Low to High
                </UnstyledButton>
                <UnstyledButton
                  onClick={() => {
                    setSort('price_desc');
                    setShowSortMenu(false);
                  }}
                  className="search-sort-option w-full px-4 py-2 text-left hover:bg-parchment"
                >
                  Price: High to Low
                </UnstyledButton>
              </div>
            )}
          </div>
        </div>
        ) : null}

        {hasQuery ? (
        <div className="mb-8 flex flex-wrap gap-3">
          {storefrontAttributeFilters.flatMap((group) =>
            group.values.slice(0, 3).map((item) => {
              const isActive =
                appliedFilters.attributeCode === group.code &&
                appliedFilters.attributeValue === item.value;

              return (
                <Button
                  key={`${group.code}-${item.value}`}
                  type="button"
                  onClick={() => setAttributeFilter(group.code, item.value)}
                  variant={isActive ? 'chipSelected' : 'chip'}
                  size="sm"
                  className="px-4 text-body-sm"
                >
                  {group.label}: {item.label}
                </Button>
              );
            })
          )}
        </div>
        ) : null}

        <div className="mb-10 grid gap-4 lg:grid-cols-[1.15fr,0.85fr]">
          <Card className="bg-parchment p-6">
            <p className="text-body-xs font-bold  tracking-token-wider text-muted">
              Guided Discovery
            </p>
            <h2 className="mt-3 text-body-xl font-display text-primary">
              Browse beyond one keyword
            </h2>
            <p className="mt-3 max-w-2xl text-body-sm text-secondary">
              If your query is broad, jump into occasion, material, and color
              routes to keep momentum instead of bouncing.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {storefrontDiscoveryQuickLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-border-subtle bg-surface-paper px-4 py-2 text-body-sm text-secondary transition-colors hover:border-primary hover:text-primary"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-body-xs font-bold  tracking-token-wider text-muted">
              Purchase Help
            </p>
            <h2 className="mt-3 text-body-xl font-display text-primary">
              Need confidence before checkout?
            </h2>
            <p className="mt-3 text-body-sm text-secondary">
              Shipping, returns, and payment guidance are available before you
              place the order.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={storefrontTrust.policyRoutes.shipping}
                className="rounded-full border border-border-subtle px-4 py-2 text-body-xs font-bold  tracking-token-wider text-primary transition-colors hover:bg-parchment"
              >
                Shipping
              </Link>
              <Link
                href={storefrontTrust.policyRoutes.returns}
                className="rounded-full border border-border-subtle px-4 py-2 text-body-xs font-bold  tracking-token-wider text-primary transition-colors hover:bg-parchment"
              >
                Returns
              </Link>
              <Link
                href={storefrontTrust.policyRoutes.paymentHelp}
                className="rounded-full border border-border-subtle px-4 py-2 text-body-xs font-bold  tracking-token-wider text-primary transition-colors hover:bg-parchment"
              >
                Payment Help
              </Link>
            </div>
          </Card>
        </div>

        {hasActiveFilters ? (
          <div className="mb-8 flex flex-wrap items-center gap-3 rounded-lg border border-border-subtle bg-parchment p-4">
            <span className="text-body-sm text-secondary">Active filters:</span>
            {appliedFilters.attributeCode && appliedFilters.attributeValue ? (
              <span className="rounded-full border border-border-subtle bg-surface-paper px-3 py-1 text-body-xs text-secondary">
                {storefrontAttributeFilters.find(
                  (group) => group.code === appliedFilters.attributeCode
                )?.label || 'Filter'}
                :{' '}
                {storefrontAttributeFilters
                  .find((group) => group.code === appliedFilters.attributeCode)
                  ?.values.find(
                    (item) => item.value === appliedFilters.attributeValue
                  )?.label || appliedFilters.attributeValue}
              </span>
            ) : null}
            {appliedFilters.min || appliedFilters.max ? (
              <span className="rounded-full border border-border-subtle bg-surface-paper px-3 py-1 text-body-xs text-secondary">
                Price:{' '}
                {[
                  appliedFilters.min ? `${appliedFilters.min}+` : null,
                  appliedFilters.max ? `up to ${appliedFilters.max}` : null,
                ]
                  .filter(Boolean)
                  .join(' ')}
              </span>
            ) : null}
            <Button
              type="button"
              onClick={clearFilters}
              variant="ghost"
              size="sm"
              className="min-h-0 px-0 text-body-xs underline underline-offset-4"
            >
              Clear filters
            </Button>
          </div>
        ) : null}

        {/* Results Grid */}
        {!hasQuery ? (
          <EmptyState
            title="Start with a search or pick a route."
            description="Try a product name, fabric, color, or occasion, or continue through the curated catalog."
            className="rounded-lg bg-surface-soft"
            actions={
              <>
                <ButtonLink href="/products" variant="secondary" size="md">
                  Shop All Products
                </ButtonLink>
                <ButtonLink href="/collections" variant="outline" size="md">
                  Explore Collections
                </ButtonLink>
              </>
            }
          />
        ) : loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-disabled" />
          </div>
        ) : products.length > 0 ? (
          <>
            <ProductGrid initialProducts={products} />

            <Card className="mt-12 bg-parchment p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-body-xs font-bold  tracking-token-wider text-muted">
                    Still Deciding?
                  </p>
                  <h2 className="mt-2 text-body-xl font-display text-primary">
                    Keep browsing with curated storefront routes
                  </h2>
                  <p className="mt-3 max-w-2xl text-body-sm text-secondary">
                    Switch from search into broader discovery if you want faster
                    comparison and lower checkout hesitation.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/products"
                    className="rounded-full bg-primary px-5 py-3 text-body-xs font-bold  tracking-token-wider text-inverse transition-colors hover:bg-secondary"
                  >
                    Shop All
                  </Link>
                  <Link
                    href="/collections"
                    className="rounded-full border border-border px-5 py-3 text-body-xs font-bold  tracking-token-wider text-primary transition-colors hover:bg-surface-paper"
                  >
                    Explore Collections
                  </Link>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <EmptyState
            title="No products found matching your search."
            description="Try removing filters, using a broader keyword, or jump into one of our curated discovery routes below."
            className="rounded-lg bg-surface-soft"
            actions={
              <>
              {storefrontDiscoveryQuickLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-full border border-border-subtle bg-surface-paper px-4 py-2 text-body-sm text-secondary transition-colors hover:border-primary hover:text-primary"
                >
                  {item.label}
                </Link>
              ))}
                {hasActiveFilters ? (
                  <Button type="button" variant="outline" onClick={clearFilters}>
                    Remove Filters
                  </Button>
                ) : null}
                <ButtonLink href="/products" variant="secondary" size="md">
                  Browse All Products
                </ButtonLink>
              </>
            }
          />
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center pt-24">
          <Loader2 className="animate-spin" size={32} />
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
