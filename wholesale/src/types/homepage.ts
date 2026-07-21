import type { Product } from './index';

export interface HomepageTrendingReel {
  id: string;
  video_url: string;
  thumbnail_url: string;
  sort_order: number;
  caption?: string | null;
  link_url?: string | null;
  product: Product;
}

export interface HomepageCategoryCard {
  id: string;
  image_url: string;
  name: string;
  link_url: string;
  is_active: boolean;
  sort_order: number;
}

export interface HomepageCategoryCircle {
  id: string;
  label: string;
  link_url: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface HomepageCollection {
  id: string;
  title: string;
  handle: string;
  description?: string | null;
  image: string;
  products: Product[];
}

export interface HomepageHeroSlide {
  id: string;
  image_url: string;
  mobile_image_url?: string | null;
  title: string;
  button_text: string;
  button_link: string;
}

export interface HomepageBrandStory {
  title: string;
  content: string;
  image_url: string;
}

export interface HomepageSocialPost {
  id: string;
  image_url: string;
  alt_text: string;
  caption?: string | null;
  destination_url: string;
  sort_order: number;
}

export interface HomepageNewsletter {
  title: string;
  subtitle: string;
}

export type HomepageSectionState = {
  status: 'ready' | 'empty' | 'error';
  count: number;
};

export interface HomepagePayload {
  generated_at: string;
  status: Record<
    | 'categoryCircles'
    | 'hero'
    | 'featuredCategories'
    | 'bestSellers'
    | 'collectionSlider'
    | 'collections'
    | 'watchShop'
    | 'brandStory'
    | 'social'
    | 'newsletter',
    HomepageSectionState
  >;
  category_circles: HomepageCategoryCircle[];
  hero: HomepageHeroSlide[];
  featured_categories: HomepageCategoryCard[];
  best_sellers: Product[];
  collection_slider: HomepageCollection[];
  collections: HomepageCollection[];
  watch_shop: HomepageTrendingReel[];
  brand_story: HomepageBrandStory | null;
  social: HomepageSocialPost[];
  newsletter: HomepageNewsletter | null;
}

export interface HomepageSpotlightProduct {
  id: string;
  badge_text?: string | null;
  custom_image_url?: string | null;
  product: {
    id: string;
    title: string;
    handle?: string;
    thumbnail?: string | null;
    variants?: Array<{
      prices?: Array<{
        amount: number;
        currency_code: string;
      }>;
    }>;
  };
}

export interface HomepageTestimonial {
  id: string;
  name: string;
  location?: string;
  avatar_url?: string | null;
  rating?: number;
  content: string;
}

export interface HomepageMerchandisingSlot {
  id: string;
  slot_key: string;
  eyebrow?: string | null;
  title: string;
  copy?: string | null;
  image_url?: string | null;
  mobile_image_url?: string | null;
  link_url?: string | null;
  linked_product_id?: string | null;
  linked_collection_id?: string | null;
  linked_category_id?: string | null;
  linked_tag_id?: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface HomepageViewModel {
  products: Product[];
  isCuratedProducts: boolean;
  trendingReels: HomepageTrendingReel[];
  categories: HomepageCategoryCard[];
  collections: HomepageCollection[];
  testimonials: HomepageTestimonial[];
  merchandisingSlots?: HomepageMerchandisingSlot[];
}
