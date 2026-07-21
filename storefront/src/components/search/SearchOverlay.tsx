'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDebounce } from 'use-debounce';
import { CompactProductCard } from '@/components/products/ProductCard';
import { Button, IconButton, Input, Modal } from '@/design-system';
import { api } from '@/lib/api';
import { filterStorefrontReadyProducts } from '@/lib/storefront-product-quality';
import { useCurrency } from '@/context/currency-context';
import type { Product } from '@/types';

type SearchResult = Product;

function getSearchResultPrice(product: SearchResult) {
  const prices = product.variants?.flatMap((variant) => variant.prices || []) || [];
  const preferredPrice =
    prices.find((price) => price.currency_code?.toLowerCase() === 'inr') ||
    prices[0];

  return preferredPrice?.amount;
}

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery] = useDebounce(query, 300);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<
    Array<{ id: string; title: string; handle: string }>
  >([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { formatPrice } = useCurrency();

  // Store the element that triggered the search for focus restoration
  const triggerRef = useRef<HTMLElement | null>(null);

  // Search-specific Escape handling; Modal owns scroll lock and dialog shell.
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  // Load recent searches from localStorage
  useEffect(() => {
    if (isOpen) {
      try {
        const stored = JSON.parse(
          localStorage.getItem('kv_recent_searches') || '[]'
        );
        setRecentSearches(Array.isArray(stored) ? stored.slice(0, 5) : []);
      } catch {
        setRecentSearches([]);
      }
      triggerRef.current = document.activeElement as HTMLElement;
      setTimeout(() => inputRef.current?.focus(), 100);
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      if (triggerRef.current)
        setTimeout(() => triggerRef.current?.focus(), 100);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  const saveRecentSearch = (term: string) => {
    try {
      const current = JSON.parse(
        localStorage.getItem('kv_recent_searches') || '[]'
      );
      const updated = [
        term,
        ...current.filter((s: string) => s !== term),
      ].slice(0, 5);
      localStorage.setItem('kv_recent_searches', JSON.stringify(updated));
      setRecentSearches(updated);
    } catch {
      /* ignore */
    }
  };

  const clearRecentSearches = () => {
    localStorage.removeItem('kv_recent_searches');
    setRecentSearches([]);
  };

  // Fetch Suggestions/Results
  useEffect(() => {
    const fetchResults = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setResults([]);
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        // Fetch full products for simple preview
        const { products } = await api.getProducts({
          search: debouncedQuery,
          limit: 4,
        });

        // Fetch suggestions
        const { suggestions: suggs } = await api.getSuggestions(debouncedQuery);

        setResults(filterStorefrontReadyProducts(products || []));
        setSuggestions(suggs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  const handleSearch = (e?: React.FormEvent, term?: string) => {
    e?.preventDefault();
    const searchTerm = term || query.trim();
    if (searchTerm) {
      saveRecentSearch(searchTerm);
      onClose();
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showHeader={false}
      rootClassName="items-start p-0"
      className="max-h-[80vh] max-w-none overflow-hidden border-0 rounded-b-3xl shadow-xl"
      bodyClassName="flex max-h-[80vh] flex-col p-0"
    >
          <div ref={modalRef}>
            {/* Search Input Header */}
            <div className="p-6 border-b border-border-subtle flex items-center gap-4">
              <Search className="text-muted" size={24} aria-hidden="true" />
              <form onSubmit={handleSearch} className="flex-1">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Search products, collections, and more..."
                  className="h-auto border-0 px-0 py-0 text-display-sm font-medium focus:border-transparent"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch(e);
                    }
                  }}
                  aria-label="Search query"
                  aria-controls="search-results"
                  autoComplete="off"
                />
              </form>
              {loading && (
                <Loader2
                  className="animate-spin text-muted"
                  size={20}
                  aria-label="Loading results"
                />
              )}
              <IconButton
                onClick={onClose}
                variant="ghost"
                size="lg"
                aria-label="Close search"
                type="button"
              >
                <X size={24} aria-hidden="true" />
              </IconButton>
            </div>

            {/* Content Area */}
            <div
              id="search-results"
              className="overflow-y-auto flex-1 p-8"
              role="region"
              aria-label="Search results"
            >
              {!query && (
                <div className="max-w-4xl mx-auto space-y-10">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-body-xs font-bold text-muted  tracking-token-wider">
                          Recent Searches
                        </h3>
                        <Button
                          type="button"
                          onClick={clearRecentSearches}
                          variant="ghost"
                          size="sm"
                          className="px-0 text-muted hover:text-error"
                        >
                          Clear All
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {recentSearches.map((term) => (
                          <Button
                            key={term}
                            type="button"
                            onClick={() => handleSearch(undefined, term)}
                            variant="chip"
                            size="sm"
                            className="px-4 text-body-sm"
                          >
                            <Search size={12} className="opacity-50" />
                            {term}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending Now */}
                  <div>
                    <h3 className="text-body-xs font-bold text-muted  tracking-token-wider mb-4 flex items-center gap-2">
                      <Sparkles size={12} /> Trending Now
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {[
                        {
                          label: 'Shawls',
                          href: '/search?q=shawls',
                        },
                        {
                          label: 'Kurtis',
                          href: '/search?q=kurtis',
                        },
                        {
                          label: 'Sarees',
                          href: '/search?q=sarees',
                        },
                        {
                          label: 'Accessories',
                          href: '/search?q=accessories',
                        },
                        {
                          label: 'Wedding',
                          href: '/search?q=wedding',
                        },
                        { label: 'Sale', href: '/sale' },
                      ].map(({ label, href }) => (
                        <Button
                          key={label}
                          type="button"
                          onClick={() => {
                            onClose();
                            router.push(href);
                          }}
                          variant="outline"
                          size="sm"
                          className="group flex min-h-24 flex-col items-center gap-2 border-border-subtle bg-surface-paper p-4 text-secondary hover:border-border hover:bg-surface-soft hover:text-primary"
                        >
                          <span className="text-display-md group-hover:scale-110 transition-transform">
                            {label.charAt(0)}
                          </span>
                          <span className="text-body-xs font-medium">{label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Popular Searches */}
                  <div>
                    <h3 className="text-body-xs font-bold text-muted  tracking-token-wider mb-3">
                      Popular Searches
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Pashmina Shawl',
                        'Anarkali Suit',
                        'Silk Saree',
                        'New Arrivals',
                        'Gift Cards',
                        'Wedding Collection',
                      ].map((term) => (
                        <Button
                          key={term}
                          type="button"
                          onClick={() => setQuery(term)}
                          variant="chip"
                          size="sm"
                          className="px-4 text-body-sm"
                        >
                          {term}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {query && (
                <div className="max-w-5xl mx-auto">
                  {results.length === 0 && !loading && (
                    <div className="text-center py-12 text-secondary">
                      No results found for &quot;{query}&quot;
                    </div>
                  )}

                  {/* Suggestions List */}
                  {suggestions.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-body-xs font-bold text-muted  tracking-token-wider mb-3">
                        Suggestions
                      </h3>
                      <ul className="space-y-2">
                        {suggestions.map((s) => (
                          <li key={s.id}>
                            <Button
                              type="button"
                              onClick={() => {
                                onClose();
                                router.push(`/products/${s.handle}`);
                              }}
                              variant="ghost"
                              size="sm"
                              className="group flex w-full justify-start gap-3 px-0 text-left normal-case text-secondary hover:text-primary"
                            >
                              <Search
                                size={14}
                                className="text-muted group-hover:text-primary"
                              />
                              {s.title}
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Product Grid Preview */}
                  {results.length > 0 && (
                    <div>
                      <h3 className="text-body-xs font-bold text-muted  tracking-token-wider mb-6">
                        Products
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {results.map((product) => {
                          const price = getSearchResultPrice(product);

                          return (
                            <CompactProductCard
                              key={product.id}
                              href={`/products/${product.handle || product.id}`}
                              title={product.title}
                              thumbnail={product.thumbnail}
                              priceLabel={price !== undefined ? `from ${formatPrice(price)}` : undefined}
                              imageClassName="rounded-lg"
                              titleClassName="text-body-sm font-medium text-primary group-hover:underline decoration-1 underline-offset-4"
                              priceClassName="text-body-sm text-secondary"
                              onClick={onClose}
                            />
                          );
                        })}
                      </div>

                      <div className="mt-8 text-center border-t border-border-subtle pt-6">
                        <Button
                          type="button"
                          onClick={() => handleSearch()}
                          variant="ghost"
                          size="md"
                          trailingIcon={<ArrowRight size={16} />}
                          className="hover:underline"
                        >
                          View All Results
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-surface-soft px-8 py-3.5 text-body-xs text-muted flex justify-between items-center border-t border-border-subtle">
              <span>
                Press{' '}
                <kbd className="px-1.5 py-0.5 bg-surface-paper border border-border-subtle rounded text-body-xs font-mono">
                  Enter
                </kbd>{' '}
                to search
              </span>
              <span className="hidden md:flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-surface-paper border border-border-subtle rounded text-body-xs font-mono">
                  Esc
                </kbd>{' '}
                to close
              </span>
            </div>
          </div>
    </Modal>
  );
}
