import type { Metadata } from 'next';
import { api } from '@/lib/api';
import {
  buildBreadcrumbJsonLd,
  buildHomepageMetadata,
  serializeJsonLd,
} from '@/lib/seo';
import { CircularCategories } from '@/components/home/CircularCategories';
import { HeroSection } from '@/components/home/HeroSection';
import { HomeTrustBar } from '@/components/home/HomeTrustBar';
import { BestSellers } from '@/components/home/BestSellers';
import { NewArrivals } from '@/components/home/NewArrivals';
import { EditorialCategoryGrid } from '@/components/home/EditorialCategoryGrid';
import { CollectionSlider } from '@/components/home/CollectionSlider';
import { CollectionsSection } from '@/components/home/CollectionsSection';
import { WatchBuyPreview } from '@/components/home/WatchBuyPreview';
import { CraftJourneySection } from '@/components/home/CraftJourneySection';
import { InstagramSection } from '@/components/home/InstagramSection';
import { NewsletterSection } from '@/components/home/NewsletterSection';
import { Heading } from '@/design-system';
import type { HomepagePayload } from '@/types/homepage';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = buildHomepageMetadata();

const EMPTY_HOMEPAGE: HomepagePayload = {
  generated_at: '',
  status: {
    categoryCircles: { status: 'error', count: 0 },
    hero: { status: 'error', count: 0 },
    featuredCategories: { status: 'error', count: 0 },
    bestSellers: { status: 'error', count: 0 },
    newArrivals: { status: 'error', count: 0 },
    collectionSlider: { status: 'error', count: 0 },
    collections: { status: 'error', count: 0 },
    watchShop: { status: 'error', count: 0 },
    brandStory: { status: 'error', count: 0 },
    social: { status: 'error', count: 0 },
    newsletter: { status: 'error', count: 0 },
  },
  category_circles: [],
  hero: [],
  featured_categories: [],
  best_sellers: [],
  new_arrivals: [],
  collection_slider: [],
  collections: [],
  watch_shop: [],
  brand_story: null,
  social: [],
  newsletter: null,
};

export default async function Home() {
  let homepage = EMPTY_HOMEPAGE;
  let testimonialsResponse = { testimonials: [] };

  try {
    const [hp, test] = await Promise.all([
      api.getHomepage(),
      api.getTestimonials()
    ]);
    homepage = hp;
    testimonialsResponse = test;
  } catch (error) {
    console.error('[Homepage] unable to load aggregate payload:', error);
  }

  const bestSellerIds = new Set(homepage.best_sellers.map((product) => product.id));
  const secondaryCollections = homepage.collections.map((collection) => ({
    ...collection,
    products: collection.products.filter((product) => !bestSellerIds.has(product.id)),
  }));
  const homepageSchema = [buildBreadcrumbJsonLd([{ name: 'Home', path: '/' }])];

  return (
    <div className="bg-surface-page text-primary" data-homepage-generated-at={homepage.generated_at || undefined}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(homepageSchema) }}
      />
      <Heading role="page" className="sr-only">Odhvica storefront</Heading>
      
      {/* S1. Immersive campaign entry */}
      <HeroSection
        banners={homepage.hero}
        testimonial={testimonialsResponse.testimonials?.[0]}
      />

      {/* S2. Compact discovery shortcuts */}
      <CircularCategories circles={homepage.category_circles} />

      {/* S3. Fresh commerce rail */}
      <NewArrivals products={homepage.new_arrivals} />

      {/* S4. Editorial interruption between product stories */}
      <EditorialCategoryGrid categories={homepage.featured_categories} />

      {/* S5. Proven product grid/rail */}
      <BestSellers products={homepage.best_sellers} state={homepage.status.bestSellers.status} />

      {/* S6. Primary collection campaign */}
      <CollectionSlider collections={homepage.collection_slider} />

      {/* S7. Shoppable motion */}
      <WatchBuyPreview reels={homepage.watch_shop} />

      {/* S8. Secondary collection discovery */}
      <CollectionsSection collections={secondaryCollections} />

      {/* S9. Brand depth */}
      <CraftJourneySection story={homepage.brand_story} />

      {/* S10. Community proof */}
      <InstagramSection posts={homepage.social} />

      {/* S11. Reassurance near the purchase footer */}
      <HomeTrustBar />

      {/* S12. Final conversion invitation */}
      <NewsletterSection settings={homepage.newsletter} />
    </div>
  );
}
