# Storefront UI/UX Audit Report

## 1. Typography Inconsistency
(Files using arbitrary px sizes like `text-[14px]` instead of tokens)

- components/home/CategoryCarousel.tsx:44
- components/home/CircularCategoriesClient.tsx:93
- components/home/HomeTrustBar.tsx:38

## 2. Color System Inconsistency
(Files with hardcoded hex values instead of design tokens)

✅ No hardcoded hex values found.


## 3. Spacing Inconsistency
(Files using arbitrary px sizes like `p-[10px]` or `w-[100px]` instead of tokens)

- app/account/messages/[id]/page.tsx:142
- app/loading.tsx:2
- app/loading.tsx:5
- app/loading.tsx:6
- app/loading.tsx:7
- app/loading.tsx:8
- app/loading.tsx:9
- app/loading.tsx:10
- components/cart/MiniCart.tsx:88
- components/cart/MiniCart.tsx:100
- components/cart/MiniCart.tsx:109
- components/header/HeaderMain.tsx:23
- components/header/HeaderMain.tsx:24
- components/header/MegaMenu/index.tsx:152
- components/header/MegaMenu/MegaFeatureCard.tsx:22
- components/header/mobile/MobileTopBar.tsx:29
- components/header/mobile/MobileTopBar.tsx:30
- components/header/SearchBar.tsx:51
- components/header/SearchBar.tsx:57
- components/hero/HeroCarousel.tsx:63
- components/hero/HeroCarousel.tsx:131
- components/hero/PageHero.tsx:29
- components/home/BestSellers.tsx:149
- components/home/CategoryCarousel.tsx:31
- components/home/CollectionSlider.tsx:40
- components/home/ConversionHelpSections.tsx:12
- components/home/ConversionHelpSections.tsx:15
- components/home/ConversionHelpSections.tsx:58
- components/home/ConversionHelpSections.tsx:75
- components/home/ConversionHelpSections.tsx:143
- components/home/CraftPromise.tsx:30
- components/home/CraftPromise.tsx:31
- components/home/CraftPromise.tsx:38
- components/home/CraftPromise.tsx:48
- components/home/CraftPromise.tsx:50
- components/home/CraftPromise.tsx:51
- components/home/CraftPromise.tsx:54
- components/home/HomeMerchandisingSections.tsx:54
- components/home/HomeTrustBar.tsx:30
- components/home/HomeTrustBar.tsx:35
- components/home/HomeTrustBar.tsx:39
- components/home/NewArrivals.tsx:148
- components/home/NewsletterSection.tsx:42
- components/home/ShopTheLook.tsx:92
- components/home/Testimonials.tsx:36
- components/home/WatchBuyPreview.tsx:44
- components/layout/BottomNav.tsx:100
- components/layout/CartDrawer.tsx:58
- components/layout/CartDrawer.tsx:126
- components/listing/ListingHero.tsx:72
- components/listing/ListingHero.tsx:86
- components/listing/ListingPageClient.tsx:176
- components/listing/ListingPageClient.tsx:326
- components/product/QuickViewModal.tsx:146
- components/product/QuickViewModal.tsx:277
- components/product/Reviews.tsx:255
- components/products/CatalogClient.tsx:500
- components/products/CategoryCircleStrip.tsx:27
- components/products/CategoryCircleStrip.tsx:29
- components/products/ProductCard.tsx:123
- components/products/ProductCard.tsx:157
- components/products/ProductCard.tsx:163
- components/products/ProductCard.tsx:169
- components/reels/ReelsExperience.tsx:763
- components/reels/ReelsExperience.tsx:766
- components/ui/ChatWidget.tsx:129
- components/ui/CookieConsent.tsx:43
- components/ui/Drawer.tsx:21
- components/ui/Drawer.tsx:22
- components/ui/NewsletterModal.tsx:68
- components/ui/Section.tsx:10
- components/ui/ShareButtons.tsx:128
- components/ui/ShareButtons.tsx:140
- components/ui/Textarea.tsx:35

## 4. Button Variants Inconsistency
(Raw `<button>` or `<Button>` without a standard variant)

- app/%5F%5Fdesign-system/ComponentLab.tsx:21 (<Button> with classes but no variant)

## 5. Potential Missing Empty States
(Lists mapped without length fallbacks)

- app/loading.tsx:1 (Contains .map() but no length check or fallback)
- app/pages/refund-policy/page.tsx:1 (Contains .map() but no length check or fallback)
- app/pages/shipping-policy/page.tsx:1 (Contains .map() but no length check or fallback)
- app/size-guide/page.tsx:1 (Contains .map() but no length check or fallback)
- components/home/ArtisanStrip.tsx:1 (Contains .map() but no length check or fallback)
- components/home/CraftPromise.tsx:1 (Contains .map() but no length check or fallback)
- components/home/HomeTrustBar.tsx:1 (Contains .map() but no length check or fallback)

## 6. Potential Missing Error States
(Async/fetch logic without error UI)

- app/account/messages/[id]/page.tsx:1 (Contains async/fetch but no error state UI)
- app/artisans/page.tsx:1 (Contains async/fetch but no error state UI)
- app/artisans/[slug]/page.tsx:1 (Contains async/fetch but no error state UI)
- app/bestsellers/page.tsx:1 (Contains async/fetch but no error state UI)
- app/categories/[slug]/page.tsx:1 (Contains async/fetch but no error state UI)
- app/collections/page.tsx:1 (Contains async/fetch but no error state UI)
- app/collections/[handle]/page.tsx:1 (Contains async/fetch but no error state UI)
- app/journal/page.tsx:1 (Contains async/fetch but no error state UI)
- app/layout.tsx:1 (Contains async/fetch but no error state UI)
- app/trending-now/page.tsx:1 (Contains async/fetch but no error state UI)
- components/home/HomeSectionsClient.tsx:1 (Contains async/fetch but no error state UI)
- components/product/QuickViewModal.test.tsx:1 (Contains async/fetch but no error state UI)
- context/currency-context.tsx:1 (Contains async/fetch but no error state UI)

## 7. Potential Missing Loading States
(Async/fetch logic without loading/spinner UI)

- app/artisans/page.tsx:1 (Contains async/fetch but no loading state UI)
- app/artisans/[slug]/page.tsx:1 (Contains async/fetch but no loading state UI)
- app/bestsellers/page.tsx:1 (Contains async/fetch but no loading state UI)
- app/cart/page.tsx:1 (Contains async/fetch but no loading state UI)
- app/categories/[slug]/page.tsx:1 (Contains async/fetch but no loading state UI)
- app/collections/page.tsx:1 (Contains async/fetch but no loading state UI)
- app/collections/[handle]/page.tsx:1 (Contains async/fetch but no loading state UI)
- app/journal/[slug]/page.tsx:1 (Contains async/fetch but no loading state UI)
- app/layout.tsx:1 (Contains async/fetch but no loading state UI)
- app/page.tsx:1 (Contains async/fetch but no loading state UI)
- app/pages/[slug]/page.tsx:1 (Contains async/fetch but no loading state UI)
- app/products/page.tsx:1 (Contains async/fetch but no loading state UI)
- app/products/[handle]/page.tsx:1 (Contains async/fetch but no loading state UI)
- app/trending-now/page.tsx:1 (Contains async/fetch but no loading state UI)
- components/cart/CartRecovery.tsx:1 (Contains async/fetch but no loading state UI)
- components/checkout/PayPalButton.tsx:1 (Contains async/fetch but no loading state UI)
- components/checkout/RazorpayButton.tsx:1 (Contains async/fetch but no loading state UI)
- components/home/HomeSectionsClient.tsx:1 (Contains async/fetch but no loading state UI)
- components/layout/WholesaleFooter.tsx:1 (Contains async/fetch but no loading state UI)
- components/LogRocketProvider.tsx:1 (Contains async/fetch but no loading state UI)
- components/product/ProductDeliveryPlanner.tsx:1 (Contains async/fetch but no loading state UI)
- components/product/QuickViewModal.test.tsx:1 (Contains async/fetch but no loading state UI)
- components/product/QuickViewModal.tsx:1 (Contains async/fetch but no loading state UI)
- components/ui/AddressAutocomplete.tsx:1 (Contains async/fetch but no loading state UI)
- components/ui/ShareButtons.tsx:1 (Contains async/fetch but no loading state UI)
- components/ui/TawkToWidget.tsx:1 (Contains async/fetch but no loading state UI)
- context/cart-context.tsx:1 (Contains async/fetch but no loading state UI)
- context/wholesale-cart-context.tsx:1 (Contains async/fetch but no loading state UI)