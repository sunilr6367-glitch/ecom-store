'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { Button, IconButton, Input } from '@/design-system';

interface Category {
  id: string;
  name: string;
  children?: Category[];
}

interface Tag {
  id: string;
  name: string;
}

interface Collection {
  id: string;
  title: string;
}

interface FilterSidebarProps {
  categories: Category[];
  tags: Tag[];
  collections?: Collection[];
  basePath?: string;
  className?: string;
  onApply?: () => void;
  onClose?: () => void;
}

type DraftFilters = {
  category_id: string;
  tag_id: string;
  collection_id: string;
};

const FILTER_QUERY_KEYS = [
  'category_id',
  'tag_id',
  'collection_id',
  'attribute_code',
  'attribute_value',
  'min_price',
  'max_price',
  'page',
];

export default function FilterSidebar({
  categories,
  tags,
  collections = [],
  basePath = '/products',
  className = '',
  onApply,
  onClose,
}: Readonly<FilterSidebarProps>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [expandedCats, setExpandedCats] = useState<string[]>([]);
  const [openGroups, setOpenGroups] = useState<string[]>([
    'categories',
    'collections',
    'price',
    'tags',
  ]);

  const currentCategoryId = searchParams.get('category_id');
  const currentTagId = searchParams.get('tag_id');
  const currentCollectionId = searchParams.get('collection_id');
  const currentAttributeCode = searchParams.get('attribute_code');
  const currentAttributeValue = searchParams.get('attribute_value');
  const currentMinPrice = searchParams.get('min_price') || '';
  const currentMaxPrice = searchParams.get('max_price') || '';
  const [draftFilters, setDraftFilters] = useState<DraftFilters>({
    category_id: currentCategoryId || '',
    tag_id: currentTagId || '',
    collection_id: currentCollectionId || '',
  });
  const [minPrice, setMinPrice] = useState(
    currentMinPrice ? String(Math.round(Number(currentMinPrice) / 100)) : ''
  );
  const [maxPrice, setMaxPrice] = useState(
    currentMaxPrice ? String(Math.round(Number(currentMaxPrice) / 100)) : ''
  );

  const pushProductsUrl = (params: URLSearchParams) => {
    const nextQuery = params.toString();
    router.push(nextQuery ? `${basePath}?${nextQuery}` : basePath);
  };

  const updateDraftFilter = (
    type: 'category_id' | 'tag_id' | 'collection_id',
    value: string | null
  ) => {
    setDraftFilters((current) => ({
      ...current,
      [type]: current[type] === value || value === null ? '' : value,
    }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    FILTER_QUERY_KEYS.forEach((key) => params.delete(key));

    if (draftFilters.category_id) {
      params.set('category_id', draftFilters.category_id);
    }

    if (draftFilters.collection_id) {
      params.set('collection_id', draftFilters.collection_id);
    }

    if (draftFilters.tag_id) {
      params.set('tag_id', draftFilters.tag_id);
    }

    if (minPrice.trim()) {
      params.set('min_price', String(Number(minPrice) * 100));
    }

    if (maxPrice.trim()) {
      params.set('max_price', String(Number(maxPrice) * 100));
    }

    pushProductsUrl(params);
    onApply?.();
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    FILTER_QUERY_KEYS.forEach((key) => params.delete(key));

    setDraftFilters({
      category_id: '',
      tag_id: '',
      collection_id: '',
    });
    setMinPrice('');
    setMaxPrice('');
    pushProductsUrl(params);
  };

  const toggleCategory = (id: string) => {
    setExpandedCats((prev) =>
      prev.includes(id)
        ? prev.filter((categoryId) => categoryId !== id)
        : [...prev, id]
    );
  };

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) =>
      prev.includes(id)
        ? prev.filter((groupId) => groupId !== id)
        : [...prev, id]
    );
  };

  const hasActiveFilters = Boolean(
    currentCategoryId ||
      currentTagId ||
      currentCollectionId ||
      currentAttributeCode ||
      currentAttributeValue ||
      currentMinPrice ||
      currentMaxPrice ||
      draftFilters.category_id ||
      draftFilters.tag_id ||
      draftFilters.collection_id ||
      minPrice ||
      maxPrice
  );

  return (
    <div className={`flex min-h-full flex-col bg-surface-paper ${className}`}>
      <div className="flex-1 sm:hidden">
        <div className="space-y-7">
          <div className="flex items-center justify-between gap-4 border-b border-border-subtle pb-4">
            <h3 className="filter-sidebar-title">Filters</h3>
            {hasActiveFilters ? (
              <Button
                type="button"
                onClick={clearAllFilters}
                variant="ghost"
                size="sm"
                className="filter-clear-button px-0 underline underline-offset-4"
              >
                Clear All
              </Button>
            ) : null}
          </div>

          {categories.length > 0 ? (
            <MobileFilterGroup label="Categories">
              {categories.map((cat) => {
                const isActive = draftFilters.category_id === cat.id;
                const isExpanded = expandedCats.includes(cat.id);

                return (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between gap-2">
                      <MobileFilterButton
                        active={isActive}
                        onClick={() =>
                          updateDraftFilter(
                            'category_id',
                            isActive ? null : cat.id
                          )
                        }
                      >
                        {cat.name}
                      </MobileFilterButton>
                      {cat.children?.length ? (
                        <IconButton
                          type="button"
                          onClick={() => toggleCategory(cat.id)}
                          variant="ghost"
                          size="sm"
                          className="filter-expand-button rounded-full"
                          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${cat.name}`}
                        >
                          {isExpanded ? (
                            <ChevronDown size={14} />
                          ) : (
                            <ChevronRight size={14} />
                          )}
                        </IconButton>
                      ) : null}
                    </div>

                    {cat.children?.length && isExpanded ? (
                      <div className="ml-3 mt-2 space-y-1 border-l border-border-subtle pl-3">
                        {cat.children.map((sub) => (
                          <MobileFilterButton
                            key={sub.id}
                            active={draftFilters.category_id === sub.id}
                            onClick={() =>
                              updateDraftFilter(
                                'category_id',
                                draftFilters.category_id === sub.id
                                  ? null
                                  : sub.id
                              )
                            }
                            small
                          >
                            {sub.name}
                          </MobileFilterButton>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </MobileFilterGroup>
          ) : null}

          {collections.length > 0 ? (
            <MobileFilterGroup label="Collections">
              {collections.map((col) => (
                <MobileFilterButton
                  key={col.id}
                  active={draftFilters.collection_id === col.id}
                  onClick={() =>
                    updateDraftFilter(
                      'collection_id',
                      draftFilters.collection_id === col.id ? null : col.id
                    )
                  }
                >
                  {col.title}
                </MobileFilterButton>
              ))}
            </MobileFilterGroup>
          ) : null}

          <MobileFilterGroup label="Price">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  aria-label="Minimum price"
                  inputMode="numeric"
                  min="0"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <Input
                  type="number"
                  aria-label="Maximum price"
                  inputMode="numeric"
                  min="0"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>
          </MobileFilterGroup>

          {tags.length > 0 ? (
            <MobileFilterGroup label="Tags">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isActive = draftFilters.tag_id === tag.id;
                  return (
                    <Button
                      key={tag.id}
                      type="button"
                      onClick={() =>
                        updateDraftFilter('tag_id', isActive ? null : tag.id)
                      }
                      variant={isActive ? 'chipSelected' : 'chip'}
                      size="sm"
                      className="px-3 text-body-xs tracking-token-wider"
                    >
                      {tag.name}
                    </Button>
                  );
                })}
              </div>
            </MobileFilterGroup>
          ) : null}
        </div>
      </div>

      <div className="hidden flex-1 sm:block">
        {categories.length > 0 ? (
          <FilterGroup
            id="categories"
            label="Categories"
            isOpen={openGroups.includes('categories')}
            onToggle={() => toggleGroup('categories')}
          >
            {categories.map((cat) => {
              const isActive = draftFilters.category_id === cat.id;
              const isExpanded = expandedCats.includes(cat.id);

              return (
                <div key={cat.id}>
                  <div className="flex items-center justify-between gap-2">
                    <FilterButton
                      active={isActive}
                      onClick={() =>
                        updateDraftFilter(
                          'category_id',
                          isActive ? null : cat.id
                        )
                      }
                    >
                      {cat.name}
                    </FilterButton>
                    {cat.children?.length ? (
                      <IconButton
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        variant="ghost"
                        size="sm"
                        className="filter-expand-button shrink-0 rounded-full"
                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${cat.name}`}
                      >
                        {isExpanded ? (
                          <ChevronDown size={14} />
                        ) : (
                          <ChevronRight size={14} />
                        )}
                      </IconButton>
                    ) : null}
                  </div>

                  {cat.children?.length && isExpanded ? (
                    <div className="ml-4 mt-1 space-y-1 border-l border-border-subtle pl-3">
                      {cat.children.map((sub) => (
                        <FilterButton
                          key={sub.id}
                          active={draftFilters.category_id === sub.id}
                          onClick={() =>
                            updateDraftFilter(
                              'category_id',
                              draftFilters.category_id === sub.id
                                ? null
                                : sub.id
                            )
                          }
                          small
                        >
                          {sub.name}
                        </FilterButton>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </FilterGroup>
        ) : null}

        {collections.length > 0 ? (
          <FilterGroup
            id="collections"
            label="Collections"
            isOpen={openGroups.includes('collections')}
            onToggle={() => toggleGroup('collections')}
          >
            {collections.map((col) => (
              <FilterButton
                key={col.id}
                active={draftFilters.collection_id === col.id}
                onClick={() =>
                  updateDraftFilter(
                    'collection_id',
                    draftFilters.collection_id === col.id ? null : col.id
                  )
                }
              >
                {col.title}
              </FilterButton>
            ))}
          </FilterGroup>
        ) : null}

        <FilterGroup
          id="price"
          label="Price"
          isOpen={openGroups.includes('price')}
          onToggle={() => toggleGroup('price')}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  type="number"
                  label="Min"
                  inputMode="numeric"
                  min="0"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </div>
              <div>
                <Input
                  type="number"
                  label="Max"
                  inputMode="numeric"
                  min="0"
                  placeholder="Any"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
            </div>
          </div>
        </FilterGroup>

        {tags.length > 0 ? (
          <FilterGroup
            id="tags"
            label="Tags"
            isOpen={openGroups.includes('tags')}
            onToggle={() => toggleGroup('tags')}
          >
            <div className="space-y-1">
              {tags.map((tag) => {
                const isActive = draftFilters.tag_id === tag.id;
                return (
                  <FilterButton
                    key={tag.id}
                    active={isActive}
                    onClick={() =>
                      updateDraftFilter('tag_id', isActive ? null : tag.id)
                    }
                  >
                    {tag.name}
                  </FilterButton>
                );
              })}
            </div>
          </FilterGroup>
        ) : null}
      </div>

      <div className="sticky bottom-0 -mx-4 mt-8 grid gap-3 border-t border-border-subtle bg-surface-paper px-4 py-4 sm:hidden sm:-mx-0 sm:grid-cols-2">
        <Button
          type="button"
          onClick={applyFilters}
          variant="secondary"
          size="md"
          className="h-11 px-5"
        >
          Apply
        </Button>
        <Button
          type="button"
          onClick={onClose}
          variant="outline"
          size="md"
          className="h-11 px-5"
        >
          Close
        </Button>
      </div>

      <div className="sticky bottom-0 -mx-4 mt-8 hidden grid-cols-2 gap-3 border-t border-border-subtle bg-surface-paper px-4 py-4 shadow-[0_-10px_24px_rgba(var(--ds-black-rgb),0.04)] sm:-mx-5 sm:grid sm:px-5">
        <Button
          type="button"
          onClick={clearAllFilters}
          disabled={!hasActiveFilters}
          variant="outline"
          size="md"
          className="h-11 px-4"
        >
          Clear All
        </Button>
        <Button
          type="button"
          onClick={applyFilters}
          variant="secondary"
          size="md"
          className="h-11 px-4"
        >
          Apply
        </Button>
      </div>
    </div>
  );
}

function MobileFilterGroup({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <p className="filter-group-label">{label}</p>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function FilterGroup({
  id,
  label,
  isOpen,
  onToggle,
  children,
}: {
  id: string;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const panelId = `filter-panel-${id}`;

  return (
    <section className="border-b border-border-subtle">
      <Button
        type="button"
        onClick={onToggle}
        variant="ghost"
        size="md"
        className="flex w-full justify-between gap-4 px-0 py-5 text-left"
        aria-expanded={isOpen}
        aria-controls={panelId}
      >
        <span className="filter-group-label">{label}</span>
        <ChevronDown
          size={16}
          className={`text-secondary transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </Button>
      {isOpen ? (
        <div id={panelId} className="space-y-1 pb-5">
          {children}
        </div>
      ) : null}
    </section>
  );
}

function MobileFilterButton({
  active,
  onClick,
  small,
  children,
}: {
  active: boolean;
  onClick: () => void;
  small?: boolean;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      variant="ghost"
      size="sm"
      className={`filter-option flex w-full justify-between rounded-md px-3 py-2 text-left ${
        small ? 'filter-option-small' : 'filter-option-regular'
      } ${
        active
          ? 'filter-option-active bg-primary text-inverse'
          : 'filter-option-inactive hover:bg-surface-soft'
      }`}
    >
      <span className="line-clamp-1">{children}</span>
    </Button>
  );
}

function FilterButton({
  active,
  onClick,
  small,
  children,
}: {
  active: boolean;
  onClick: () => void;
  small?: boolean;
  children: ReactNode;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      role="checkbox"
      aria-checked={active}
      variant="ghost"
      size="sm"
      className={`filter-option flex w-full justify-start gap-3 border px-3 py-2.5 text-left ${
        small ? 'filter-option-small' : 'filter-option-regular'
      } ${
        active
          ? 'filter-option-active border-border-subtle bg-surface-soft text-primary'
          : 'filter-option-inactive border-transparent bg-surface-paper text-secondary hover:border-border-subtle hover:bg-surface-soft hover:text-primary'
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center border transition-colors ${
          active
            ? 'border-primary bg-surface-paper text-primary'
            : 'border-border bg-surface-paper'
        }`}
        aria-hidden="true"
      >
        {active ? <Check size={12} strokeWidth={2.5} /> : null}
      </span>
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </Button>
  );
}
