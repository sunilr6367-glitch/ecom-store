'use client';

import { AnimatePresence, motion, type Variants } from 'framer-motion';
import {
  MEGA_FALLBACK_CATEGORY_GROUPS,
  MEGA_FALLBACK_COLLECTION_GROUPS,
  MEGA_FALLBACK_SECONDARY_GROUPS,
} from '@/config/storefront-navigation';
import { MegaColumn } from './MegaColumn';
import { MegaFeatureCard } from './MegaFeatureCard';

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
  is_active?: boolean;
  show_in_header?: boolean;
  display_order?: number;
  children?: HeaderCategory[];
}

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: HeaderCategory[];
  collections: Collection[];
}

const megaVariants: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: [0.0, 0.0, 0.2, 1.0] } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.12 } },
};

function sortByDisplayOrder<T extends { display_order?: number }>(items: T[]) {
  return [...items].sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99));
}

function categoryHref(category: HeaderCategory) {
  return `/collections/${category.slug || category.handle}`;
}

function collectionTitle(collection: Collection) {
  return collection.title || collection.name || 'Collection';
}

export function MegaMenu({ isOpen, onClose, categories, collections }: MegaMenuProps) {
  const headerCategories = sortByDisplayOrder(
    categories.filter((category) => category.is_active !== false && category.show_in_header !== false)
  );

  const categoryGroups = headerCategories.length
    ? [
        {
          label: 'Shop',
          items: headerCategories.slice(0, 7).map((category) => ({
            label: category.name,
            href: categoryHref(category),
          })),
        },
      ]
    : MEGA_FALLBACK_CATEGORY_GROUPS;

  const subcategoryItems = headerCategories
    .flatMap((category) => category.children || [])
    .filter((category) => category.is_active !== false)
    .slice(0, 8)
    .map((category) => ({
      label: category.name,
      href: categoryHref(category),
    }));

  const secondaryGroups = subcategoryItems.length
    ? [{ label: 'More to explore', items: subcategoryItems }]
    : MEGA_FALLBACK_SECONDARY_GROUPS;

  const megamenuCollections = sortByDisplayOrder(
    collections.filter((collection) => collection.status === 'active' && collection.show_in_megamenu)
  ).slice(0, 5);

  const featuredCollection =
    megamenuCollections[0] ?? collections.find((collection) => collection.status === 'active');

  const collectionGroups = megamenuCollections.length
    ? [
        {
          label: 'Collections',
          items: megamenuCollections.map((collection) => ({
            label: collectionTitle(collection),
            href: `/collections/${collection.handle}`,
          })),
        },
      ]
    : MEGA_FALLBACK_COLLECTION_GROUPS;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={megaVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="navigation"
          aria-label="Main navigation"
          className="absolute top-full left-0 right-0 bg-surface-paper border-b-[1.5px] border-border-dark z-[100] shadow-sm"
        >
          <div className="grid grid-cols-[1.1fr_1fr_1fr_180px]">
            <div className="px-8 py-6 border-r border-surface-parchment-2">
              <MegaColumn
                groups={categoryGroups}
                viewAllLabel="Shop all products"
                viewAllHref="/products"
                onClose={onClose}
              />
            </div>

            <div className="px-8 py-6 border-r border-surface-parchment-2">
              <MegaColumn groups={secondaryGroups} onClose={onClose} />
            </div>

            <div className="px-8 py-6 border-r border-surface-parchment-2">
              <MegaColumn
                groups={collectionGroups}
                viewAllLabel="All collections"
                viewAllHref="/collections"
                onClose={onClose}
              />
            </div>

            {featuredCollection ? (
              <MegaFeatureCard
                name={collectionTitle(featuredCollection)}
                handle={featuredCollection.handle}
                image={featuredCollection.cover_image_url || featuredCollection.image}
                onClick={onClose}
              />
            ) : (
              <div className="h-full min-h-[240px] bg-primary" />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
