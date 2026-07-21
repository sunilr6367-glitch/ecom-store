// Database Schema Index
// Provides organized re-exports for cleaner imports throughout the application
//
// The main schema is defined in schema.ts to avoid circular dependencies
// This index file provides convenient access to all tables and relations

// Export everything from schema.ts
export * from '../schema';

// Re-export commonly used tables for convenience
// This allows imports like: import { products, customers } from "@db/schema"

// Products
export {
  products,
  product_variants,
  product_options,
  product_option_values,
  product_collections,
  product_images,
  product_reviews,
} from '../schema';

// Categories & Tags
export { categories, product_categories, tags, product_tags } from '../schema';

// E-commerce
export {
  regions,
  countries,
  money_amounts,
  discounts,
  campaigns,
  discount_usage,
} from '../schema';

// Customers & Orders
export { customers, addresses, orders, line_items } from '../schema';

// Auth
export { users } from '../schema';

// Content
export {
  posts,
  pages,
  banners,
  homepage_banners,
  category_circles,
  featured_products,
  homepage_merchandising_slots,
  homepage_social_posts,
} from '../schema';

// Other
export {
  settings,
  webhook_events,
  wholesale_inquiries,
  contacts,
  studio_inquiries,
  studio_inquiry_messages,
  newsletter_subscribers,
} from '../schema';

// Relations
export {
  productsRelations,
  productImagesRelations,
  productReviewsRelations,
  categoriesRelations,
  productCategoriesRelations,
  tagsRelations,
  productTagsRelations,
  productVariantsRelations,
  moneyAmountsRelations,
  regionsRelations,
  countriesRelations,
  customersRelations,
  addressesRelations,
  ordersRelations,
  lineItemsRelations,
  settingsRelations,
  campaignsRelations,
  discountsRelations,
  postsRelations,
} from '../schema';
