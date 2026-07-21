'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronDown,
  ClipboardList,
  Globe2,
  Leaf,
  MessageCircle,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  Ruler,
  ShoppingBag,
  Truck,
} from 'lucide-react';
import Link from 'next/link';

import ProductGallery from '@/components/product/ProductGallery';
import { Reviews } from '@/components/product/Reviews';
import { BackInStock } from '@/components/product/BackInStock';
import { SizeGuide } from '@/components/product/SizeGuide';
import {
  Badge,
  Button,
  IconButton,
  PriceDisplay,
  RatingDisplay,
  ShareButtons,
  UnstyledButton,
  WishlistButton,
} from '@/design-system';
import { WhatsAppCTA } from '@/components/WhatsAppCTA';
import { useCart } from '@/context/cart-context';
import { useCurrency } from '@/context/currency-context';
import { useRecentlyViewed } from '@/context/recently-viewed-context';
import { useShop } from '@/context/shop-context';
import { useInventoryWebSocket } from '@/hooks/useInventoryWebSocket';
import { buildProductImageAlt, getCategoryPath, getPrimaryCategory } from '@/lib/seo';
import { getProductDisplayTitle } from '@/lib/product-title';
import { getProductPrimaryImage } from '@/lib/storefront-product-quality';
import type { MoneyAmount, Product, ProductImage, ProductOption, ProductVariant } from '@/types';
import { storefrontTrust } from '@/config/storefront-trust';
import styles from './pdp.module.css';


function getColorHex(colorName: string) {
  const map: Record<string, string> = {
    black: 'var(--ds-text-primary)',
    navy: 'var(--ds-swatch-navy)',
    indigo: 'var(--ds-info)',
    blue: 'var(--ds-swatch-blue)',
    white: 'var(--ds-surface-paper)',
    'off white': 'var(--ds-swatch-off-white)',
    cream: 'var(--ds-swatch-cream)',
    terracotta: 'var(--ds-accent-primary)',
    olive: 'var(--ds-swatch-olive)',
    green: 'var(--ds-swatch-green)',
    yellow: 'var(--ds-swatch-yellow)',
    beige: 'var(--ds-swatch-beige)',
    brown: 'var(--ds-swatch-brown)',
    pink: 'var(--ds-swatch-pink)',
    purple: 'var(--ds-swatch-purple)',
    grey: 'var(--ds-swatch-grey)',
    gray: 'var(--ds-swatch-grey)',
  };

  const normalized = colorName.toLowerCase();
  return (
    Object.entries(map).find(([name]) => normalized.includes(name))?.[1] ||
    'var(--ds-swatch-fallback)'
  );
}

type AccordionKey = 'description' | 'care' | 'returns' | 'shipping';

export default function ProductView({ product }: { product: Product }) {
  const { currentRegion } = useShop();
  const { formatPrice } = useCurrency();
  const { addItem, totalItems } = useCart();
  const { addItem: addToRecentlyViewed } = useRecentlyViewed();

  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [openAccordions, setOpenAccordions] = useState<AccordionKey[]>([]);
  const [showStickyATC, setShowStickyATC] = useState(false);
  const [realTimeInventory, setRealTimeInventory] = useState<Record<string, number>>({});

  const primaryCategory = getPrimaryCategory(product);
  const primaryCategoryPath = primaryCategory ? getCategoryPath(primaryCategory) : null;
  const displayTitle = getProductDisplayTitle(product.title);
  const productPrimaryImage = getProductPrimaryImage(product);

  const { isConnected, subscribeToInventory, unsubscribeFromInventory } = useInventoryWebSocket({
    onInventoryUpdate: (update) =>
      setRealTimeInventory((prev) => ({ ...prev, [update.variantId]: update.quantity })),
  });

  useEffect(() => {
    product.variants?.forEach((variant) => subscribeToInventory(variant.id));
    return () => product.variants?.forEach((variant) => unsubscribeFromInventory(variant.id));
  }, [product.variants, subscribeToInventory, unsubscribeFromInventory]);

  useEffect(() => {
    const price = product.variants?.[0]?.prices?.[0];
    if (!product.id) return;

    addToRecentlyViewed({
      id: product.id,
      handle: product.handle || product.id,
      title: displayTitle,
      thumbnail: productPrimaryImage || undefined,
      price: price?.amount || 0,
      currency: price?.currency_code?.toUpperCase() || 'USD',
    });
  }, [addToRecentlyViewed, displayTitle, product, productPrimaryImage]);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setShowStickyATC(!entry.isIntersecting), {
      threshold: 0,
      rootMargin: '0px 0px -80px 0px',
    });
    const button = document.getElementById('pdp-atc-btn');
    if (button) observer.observe(button);
    return () => observer.disconnect();
  }, []);

  const deliveryWindow = useMemo(() => {
    const regionId = currentRegion?.id?.toLowerCase() || '';
    if (regionId.startsWith('us')) return '10-14 business days';
    if (regionId.startsWith('gb') || regionId.startsWith('uk')) return '8-12 business days';
    if (regionId.startsWith('au') || regionId.startsWith('ca')) return '12-18 business days';
    if (regionId.startsWith('de') || regionId.startsWith('fr') || regionId.startsWith('eu')) return '10-16 business days';
    return '4-8 days India';
  }, [currentRegion]);

  const hasStructuredOptions = Boolean(product.options?.length);
  const defaultOptions = useMemo(() => {
    const defaults: Record<string, string> = {};
    product.options?.forEach((option: ProductOption) => {
      if (option.values?.length) defaults[option.title] = option.values[0].value;
    });
    return defaults;
  }, [product.options]);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(defaultOptions);
  const [selectedVariantId, setSelectedVariantId] = useState(product.variants?.[0]?.id || '');

  const selectedVariant = useMemo(() => {
    if (!product.variants?.length) return null;
    if (product.variants.length === 1) return product.variants[0];

    if (hasStructuredOptions) {
      return (
        product.variants.find((variant: ProductVariant) => {
          const parts = variant.title.split(' / ').map((part) => part.trim());
          return product.options?.every((option: ProductOption, index: number) => parts[index] === selectedOptions[option.title]);
        }) || product.variants[0]
      );
    }

    return product.variants.find((variant) => variant.id === selectedVariantId) || product.variants[0];
  }, [hasStructuredOptions, product.options, product.variants, selectedOptions, selectedVariantId]);

  const isOnRequest = product.price_type === 'on_request';
  const currentInventory = selectedVariant ? realTimeInventory[selectedVariant.id] ?? selectedVariant.inventory_quantity : 0;
  const prices = selectedVariant?.prices || [];
  const inrPriceObj = prices.find((price: MoneyAmount) => price.currency_code?.toLowerCase() === 'inr') || prices[0];
  const amount = inrPriceObj?.amount || 0;
  const compareAtAmount = selectedVariant?.compare_at_price;
  const formattedPrice = amount ? formatPrice(amount) : '';
  const formattedComparePrice = compareAtAmount ? formatPrice(compareAtAmount) : null;
  const savingsAmount = compareAtAmount && amount < compareAtAmount ? compareAtAmount - amount : 0;
  const formattedSavings = savingsAmount ? formatPrice(savingsAmount) : null;
  const outOfStock = !isOnRequest && currentInventory <= 0;
  const whatsappMessage = `Hi, I'm interested in: ${displayTitle}`;
  const reviewRating = product.avg_rating && product.avg_rating > 0 ? product.avg_rating : null;
  const reviewCount = product.review_count && product.review_count > 0 ? product.review_count : null;
  const hasReviews = Boolean(reviewRating && reviewCount);
  const scarcityLabel = !isOnRequest && currentInventory > 0 && currentInventory < 10 ? `Only ${currentInventory} left` : undefined;
  const craftOrigin = product.artisan?.location || product.origin_country || 'Jaipur, India';
  const buyerConfidenceItems = [
    {
      icon: <PackageCheck size={16} aria-hidden="true" />,
      label: 'Craft proof',
      copy: `${product.material || 'Handmade textile'} selected in small batches from ${craftOrigin}.`,
    },
    {
      icon: <Globe2 size={16} aria-hidden="true" />,
      label: 'Global buyer clarity',
      copy: `${deliveryWindow}. Duties, taxes, and payment support stay visible at checkout.`,
    },
    {
      icon: <MessageCircle size={16} aria-hidden="true" />,
      label: 'Assisted buying',
      copy: 'Ask on WhatsApp for sizing, gifting, custom orders, or bulk questions before checkout.',
    },
  ];

  const galleryMedia = useMemo(() => {
    return product.images?.length
      ? product.images
          .sort((a: ProductImage, b: ProductImage) => (a.position || 0) - (b.position || 0))
          .map((image: ProductImage, index: number) => ({
            ...image,
            alt: buildProductImageAlt(product, index, image.alt),
            alt_text: image.alt_text || buildProductImageAlt(product, index, image.alt),
          }))
      : product.thumbnail
        ? [{ id: 'thumb', url: product.thumbnail, alt: displayTitle, alt_text: displayTitle, is_thumbnail: true, position: 0 }]
        : [];
  }, [displayTitle, product]);

  const structuredAttributeRows = useMemo(() => {
    const hiddenCodes = new Set(['color']);
    return (product.attributes || [])
      .filter((attribute) => attribute.attribute_code && !hiddenCodes.has(attribute.attribute_code))
      .map((attribute) => ({
        label: attribute.attribute_label || attribute.attribute_code || 'Detail',
        value: attribute.value_label || attribute.raw_value || '',
      }))
      .filter((row) => row.value);
  }, [product.attributes]);

  const isOptionValueUnavailable = (optionIndex: number, value: string) => {
    if (!hasStructuredOptions || !product.variants?.length || !product.options?.length) return false;

    const matchingVariants = product.variants.filter((variant) => {
      const parts = variant.title.split(' / ').map((part) => part.trim());
      return product.options?.every((option, index) => {
        if (index === optionIndex) return parts[index] === value;
        const selectedValue = selectedOptions[option.title];
        return !selectedValue || parts[index] === selectedValue;
      });
    });

    return (
      matchingVariants.length > 0 &&
      matchingVariants.every((variant) => (realTimeInventory[variant.id] ?? variant.inventory_quantity) <= 0)
    );
  };

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    addItem({
      id: selectedVariant.id,
      variantId: selectedVariant.id,
      quantity,
      title: `${displayTitle}${selectedVariant.title !== 'Default Variant' ? ` - ${selectedVariant.title}` : ''}`,
      price: amount,
      currency: 'INR',
      thumbnail: productPrimaryImage || undefined,
      material: product.material || undefined,
      origin: product.origin_country || undefined,
      sku: selectedVariant.sku || undefined,
      description: product.description || undefined,
      handle: product.handle || product.id,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    if (typeof window !== 'undefined') {
      window.location.href = '/checkout';
    }
  };

  const accordionItems: Array<{
    key: AccordionKey;
    title: string;
    hint: string;
    icon: ReactNode;
    content: ReactNode;
  }> = [
    {
      key: 'description',
      title: 'Description',
      hint: `${product.material || 'Handmade textile'} · Reversible · Artisan finished`,
      icon: <ClipboardList size={18} />,
      content: product.description ? (
        <div 
          className={[styles['pdp-description'], 'prose', 'prose-sm', 'max-w-none', 'text-[var(--kv-muted)]'].filter(Boolean).join(' ')}
          dangerouslySetInnerHTML={{ __html: product.description }} 
        />
      ) : (
        <p className="kv-sub">Handmade in small batches with natural craft details.</p>
      ),
    },
    {
      key: 'care',
      title: 'Fabric care rules',
      hint: 'Machine wash cold · Gentle cycle',
      icon: <Leaf size={18} />,
      content: product.care_instructions ? (
        <div 
          className="prose prose-sm max-w-none text-[var(--kv-muted)]" 
          dangerouslySetInnerHTML={{ __html: product.care_instructions }} 
        />
      ) : (
        <p className="kv-sub">
          Machine wash cold on a gentle cycle. Dry in shade and avoid harsh bleach to preserve the hand-finished color.
        </p>
      ),
    },
    {
      key: 'returns',
      title: 'Return policy',
      hint: '7 days · Unused condition',
      icon: <RotateCcw size={18} />,
      content: <p className="kv-sub">{storefrontTrust.returnSummary}</p>,
    },
    {
      key: 'shipping',
      title: 'Shipping policy',
      hint: `Free ₹2,000+ · ${deliveryWindow}`,
      icon: <Truck size={18} />,
      content: <p className="kv-sub">{storefrontTrust.shippingSummary} Estimated delivery for your region is {deliveryWindow}.</p>,
    },
  ];

  const toggleAccordion = (key: AccordionKey) => {
    setOpenAccordions((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    );
  };

  return (
    <div className={styles['pdp-page']}>
      <div className={styles['pdp-mobile-nav']}>
        <Link href={primaryCategoryPath || '/products'} aria-label="Back to collection" className={styles['pdp-nav-icon']}>
          <ArrowLeft size={18} />
        </Link>
        <p>{displayTitle}</p>
        <div className={styles['pdp-mobile-nav-actions']}>
          <ShareButtons
            title={displayTitle}
            description={product.description?.slice(0, 100)}
            image={productPrimaryImage || undefined}
            className={styles['pdp-nav-share']}
          />
          <Link href="/cart" className={styles['pdp-cart-icon']} aria-label="Open cart">
            <ShoppingBag size={18} />
            {totalItems > 0 ? <span>{totalItems}</span> : null}
          </Link>
        </div>
      </div>

      <div className={['ds-home-container', styles['pdp-container']].filter(Boolean).join(' ')}>
        <nav aria-label="Breadcrumb" className={[styles['breadcrumb'], styles['pdp-desktop-breadcrumb']].filter(Boolean).join(' ')}>
          <Link href="/">Home</Link>
          <span className="breadcrumb-separator">/</span>
          {primaryCategoryPath && primaryCategory ? (
            <>
              <Link href={primaryCategoryPath}>{primaryCategory.name}</Link>
              <span className="breadcrumb-separator">/</span>
            </>
          ) : null}
          <span className="breadcrumb-current">{displayTitle}</span>
        </nav>

        <div className={styles['pd-layout']}>
          <div className={styles['pdp-gallery-col']}>
            <ProductGallery
              media={galleryMedia}
              title={displayTitle}
              videos={product.videos || []}
              wishlistButton={(
                <WishlistButton
                  productId={product.id}
                  title={displayTitle}
                  price={selectedVariant?.prices?.[0]?.amount || 0}
                  currency={currentRegion?.currency_code?.toUpperCase() || 'USD'}
                  thumbnail={productPrimaryImage || undefined}
                  handle={product.handle || product.id}
                  variantId={selectedVariant?.id}
                  size="sm"
                  className={styles['pdp-gallery-heart']}
                />
              )}
            />
          </div>

          <div className={styles['pdp-buy-box']}>
            {scarcityLabel ? <div className={styles['pdp-stock-label']}>{scarcityLabel}</div> : null}
            <h1 className={styles['pdp-title']}>{displayTitle}</h1>

            {hasReviews && reviewRating && reviewCount ? (
              <div className={styles['pdp-rating-row']}>
                <RatingDisplay rating={reviewRating} count={reviewCount} href="#reviews" />
              </div>
            ) : (
              <div className={styles['pdp-rating-row']}>
                <RatingDisplay emptyLabel="Be the first to review" href="#reviews" />
              </div>
            )}

            {product.subtitle && <p className={['kv-sub', styles['pdp-subtitle']].filter(Boolean).join(' ')}>{product.subtitle}</p>}

            <div className={styles['pdp-price-row']}>
              {isOnRequest ? (
                <span className={styles['pdp-enquire-label']}>Enquire for price</span>
              ) : (
                <>
                  <PriceDisplay
                    price={formattedPrice}
                    compareAtPrice={formattedComparePrice}
                    variant="pdp"
                    priceClassName="pd-price"
                  />
                  {formattedSavings ? (
                    <Badge variant="success" className={[styles['pdp-save-badge'], 'normal-case'].filter(Boolean).join(' ')}>
                      Save {formattedSavings}
                    </Badge>
                  ) : null}
                </>
              )}
            </div>

            {!isOnRequest && selectedVariant && currentInventory > 0 && !scarcityLabel ? (
              <p className={styles['pdp-availability-note']}>
                {isConnected ? 'Live stock confirmed' : 'Ready to ship'}
              </p>
            ) : null}

            {hasStructuredOptions && product.options?.map((option: ProductOption, optionIndex) => {
              const isColor = option.title.toLowerCase() === 'color' || option.title.toLowerCase() === 'colour';
              return (
                <div key={option.title} className={[styles['pdp-option-block'], styles['pdp-variant-block']].filter(Boolean).join(' ')}>
                  <div className={styles['pdp-option-head']}>
                    <strong className={styles['pdp-option-label']}>{option.title}</strong>
                    <span className={styles['pdp-option-selected']}>- {selectedOptions[option.title]}</span>
                    {!isColor && option.title.toLowerCase().includes('size') && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={[styles['pdp-size-guide'], 'normal-case'].filter(Boolean).join(' ')}
                        leadingIcon={<Ruler size={13} />}
                        onClick={() => setShowSizeGuide(true)}
                      >
                        Size guide
                      </Button>
                    )}
                  </div>
                  <div className={styles['option-row']}>
                    {option.values.map((value) => {
                      const isSelected = selectedOptions[option.title] === value.value;
                      const unavailable = isOptionValueUnavailable(optionIndex, value.value);

                      return isColor ? (
                        <UnstyledButton
                          key={value.value}
                          type="button"
                          onClick={() => setSelectedOptions((prev) => ({ ...prev, [option.title]: value.value }))}
                          className={`${styles['pdp-color-swatch-wrapper']}${isSelected ? ` ${styles.active}` : ''}${unavailable ? ` ${styles.unavailable}` : ''}`}
                          aria-label={value.value}
                          title={value.value}
                          disabled={unavailable}
                        >
                          <span
                            className={styles['pdp-color-swatch']}
                            style={{ background: getColorHex(value.value) }}
                          />
                        </UnstyledButton>
                      ) : (
                        <UnstyledButton
                          key={value.value}
                          type="button"
                          onClick={() => setSelectedOptions((prev) => ({ ...prev, [option.title]: value.value }))}
                          className={`${styles['pdp-option-button']} ${styles['pdp-size-pill']}${isSelected ? ` ${styles.active}` : ''}${unavailable ? ` ${styles.unavailable}` : ''}`}
                          disabled={unavailable}
                        >
                          {value.value}
                        </UnstyledButton>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {!hasStructuredOptions && product.variants && product.variants.length > 1 && (
              <div className={[styles['pdp-option-block'], styles['pdp-variant-block']].filter(Boolean).join(' ')}>
                <strong className={styles['pdp-option-label']}>Option</strong>
                <div className={styles['option-row']}>
                  {product.variants.map((variant: ProductVariant) => {
                    const unavailable = (realTimeInventory[variant.id] ?? variant.inventory_quantity) <= 0;
                    return (
                      <UnstyledButton
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariantId(variant.id)}
                        className={`${styles['pdp-option-button']} ${styles['pdp-size-pill']}${selectedVariant?.id === variant.id ? ` ${styles.active}` : ''}${unavailable ? ` ${styles.unavailable}` : ''}`}
                        disabled={unavailable}
                      >
                        {variant.title}
                      </UnstyledButton>
                    );
                  })}
                </div>
              </div>
            )}

            {!isOnRequest && (
              <div className={styles['pdp-option-block']}>
                <strong className={styles['pdp-option-label']}>Quantity</strong>
                <div className={styles['option-row']}>
                  <IconButton
                    type="button"
                    variant="outline"
                    size="md"
                    className={styles['pdp-quantity-button']}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </IconButton>
                  <span className={styles['pdp-quantity-value']}>{quantity}</span>
                  <IconButton
                    type="button"
                    variant="outline"
                    size="md"
                    className={styles['pdp-quantity-button']}
                    onClick={() => quantity < currentInventory && setQuantity(quantity + 1)}
                    disabled={currentInventory <= quantity}
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </IconButton>
                </div>
              </div>
            )}

            <div className={styles['pdp-cta-grid']}>
              {isOnRequest ? (
                <WhatsAppCTA
                  id="pdp-atc-btn"
                  message={whatsappMessage}
                  className={[styles['pdp-link-button'], styles['pdp-link-button--whatsapp'], styles['pdp-whatsapp']].filter(Boolean).join(' ')}
                >
                  <MessageCircle size={16} />
                  Enquire on WhatsApp
                </WhatsAppCTA>
              ) : (
                <>
                  <Button
                    id="pdp-atc-btn"
                    type="button"
                    onClick={handleAddToCart}
                    disabled={!selectedVariant || addedToCart || outOfStock}
                    variant="primary"
                    size="lg"
                    fullWidth
                    className={`pdp-primary-cta${addedToCart ? ' is-added' : outOfStock ? ' is-disabled' : ''}`}
                  >
                    {outOfStock ? 'Out of Stock' : addedToCart ? 'Added to cart' : 'Add to cart'}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={!selectedVariant || outOfStock}
                    variant="outline"
                    size="lg"
                    fullWidth
                    className={styles['pdp-buy-now']}
                  >
                    Buy now
                  </Button>
                  <WhatsAppCTA
                    message={whatsappMessage}
                    className={[styles['pdp-link-button'], styles['pdp-link-button--whatsapp'], styles['pdp-whatsapp'], styles['pdp-mobile-whatsapp']].filter(Boolean).join(' ')}
                  >
                    <MessageCircle size={16} />
                    Ask on WhatsApp
                  </WhatsAppCTA>
                </>
              )}
            </div>

            <div className={styles['pdp-service-lines']}>
              <span>Tax included. Shipping calculated at checkout.</span>
              <span>Free shipping above Rs. 2,000.</span>
              <span>7-day support on eligible returns.</span>
            </div>

            <div className={styles['pdp-buyer-confidence']} aria-label="Buyer confidence">
              {buyerConfidenceItems.map((item) => (
                <div key={item.label} className={styles['pdp-buyer-confidence-item']}>
                  {item.icon}
                  <div>
                    <strong>{item.label}</strong>
                    <p>{item.copy}</p>
                  </div>
                </div>
              ))}
            </div>

            {product.description ? (
              <div 
                className={[styles['pdp-summary-description'], 'prose', 'prose-sm', 'max-w-none', 'text-[var(--kv-muted)]'].filter(Boolean).join(' ')}
                dangerouslySetInnerHTML={{ __html: product.description }} 
              />
            ) : null}

            {!isOnRequest && outOfStock && selectedVariant && (
              <div className={styles['pdp-back-in-stock']}>
                <BackInStock productId={product.id} variantId={selectedVariant.id} productTitle={displayTitle} />
              </div>
            )}
          </div>
        </div>

        <div className={styles['pdp-detail-grid']}>
          <section className={styles['pdp-accordion-shell']} aria-labelledby="product-details-heading">
            <p className="kv-tag" id="product-details-heading">Product details</p>
            {accordionItems.map((item) => {
              const isOpen = openAccordions.includes(item.key);
              return (
                <div key={item.key} className={styles['pdp-accordion-item']}>
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    className={styles['pdp-accordion-trigger']}
                    onClick={() => toggleAccordion(item.key)}
                    aria-expanded={isOpen}
                    aria-controls={`pdp-section-${item.key}`}
                  >
                    <span className={styles['pdp-accordion-icon']}>{item.icon}</span>
                    <span className={styles['pdp-accordion-text']}>
                      <strong>{item.title}</strong>
                      <small>{item.hint}</small>
                    </span>
                    <ChevronDown className={isOpen ? 'is-open' : ''} size={18} />
                  </Button>
                  {isOpen ? (
                    <div id={`pdp-section-${item.key}`} className={styles['pdp-accordion-content']}>
                      {item.content}
                    </div>
                  ) : null}
                </div>
              );
            })}

            <div className={styles['pdp-spec-card']}>
              <strong className={styles['pdp-trust-label']}>Quick specifications</strong>
              <table className={styles['pdp-spec-table']}>
                <tbody>
                  {product.material && <tr className={styles['pdp-spec-row']}><td className={[styles['pdp-spec-cell'], styles['pdp-spec-label-cell']].filter(Boolean).join(' ')}>Material</td><td className={styles['pdp-spec-cell']}>{product.material}</td></tr>}
                  {structuredAttributeRows.slice(0, 5).map((row) => (
                    <tr key={`${row.label}-${row.value}`} className={styles['pdp-spec-row']}>
                      <td className={[styles['pdp-spec-cell'], styles['pdp-spec-label-cell']].filter(Boolean).join(' ')}>{row.label}</td>
                      <td className={styles['pdp-spec-cell']}>{row.value}</td>
                    </tr>
                  ))}
                  {product.origin_country && <tr className={styles['pdp-spec-row']}><td className={[styles['pdp-spec-cell'], styles['pdp-spec-label-cell']].filter(Boolean).join(' ')}>Origin</td><td className={styles['pdp-spec-cell']}>{product.origin_country}</td></tr>}
                  {selectedVariant?.sku && <tr className={styles['pdp-spec-row']}><td className={[styles['pdp-spec-cell'], styles['pdp-spec-label-cell']].filter(Boolean).join(' ')}>SKU</td><td className={styles['pdp-spec-cell']}>{selectedVariant.sku}</td></tr>}
                </tbody>
              </table>
            </div>
          </section>

          <aside className={styles['pdp-review-sidebar']} id="reviews">
            {hasReviews && reviewRating && reviewCount ? (
              <div className={styles['pdp-review-summary']}>
                <div>
                  <strong>{reviewRating.toFixed(1)}</strong>
                  <RatingDisplay rating={reviewRating} count={reviewCount} />
                </div>
              </div>
            ) : null}
            <div className={styles['pdp-verified-card']}>
              <PackageCheck size={16} />
              <p>Verified customer reviews will appear here after purchase.</p>
              <small>Reviews are collected from real orders.</small>
            </div>
            <Reviews productId={product.id} />
          </aside>
        </div>
      </div>

      <SizeGuide isOpen={showSizeGuide} onClose={() => setShowSizeGuide(false)} sizeGuide={product.size_guide} />

      <div
        className={`pdp-sticky-bar${showStickyATC ? ' is-visible' : ''}`}
        aria-hidden={!showStickyATC}
      >
        <div className={styles['pdp-sticky-info']}>
          <p className={styles['pdp-sticky-title']}>{displayTitle}</p>
          {isOnRequest ? (
            <p className={[styles['pdp-sticky-price'], styles['pdp-enquire-label']].filter(Boolean).join(' ')}>Enquire for price</p>
          ) : (
            <PriceDisplay
              as="p"
              price={formattedPrice}
              variant="inline"
              className={styles['pdp-sticky-price']}
            />
          )}
        </div>
        {isOnRequest ? (
          <WhatsAppCTA
            message={whatsappMessage}
            className={[styles['pdp-link-button'], styles['pdp-link-button--whatsapp'], styles['pdp-whatsapp']].filter(Boolean).join(' ')}
          >
            Enquire
          </WhatsAppCTA>
        ) : (
          <Button
            type="button"
            onClick={handleAddToCart}
            disabled={!selectedVariant || addedToCart || outOfStock}
            variant="primary"
            size="md"
            className={`pdp-sticky-cta${outOfStock ? ' is-disabled' : addedToCart ? ' is-added' : ''}`}
          >
            {outOfStock ? 'Sold Out' : addedToCart ? 'Added' : 'Add to cart'}
          </Button>
        )}
      </div>
    </div>
  );
}
