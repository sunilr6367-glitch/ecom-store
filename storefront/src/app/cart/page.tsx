'use client';


import { Heading } from '@/design-system';
import { SelectionControl } from '@/design-system';
import { useCart } from '@/context/cart-context';
import { useShop } from '@/context/shop-context';
import { useNotification } from '@/context/notification-context';
import { useCurrency } from '@/context/currency-context';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { OptimizedImage } from '@/design-system';
import Link from 'next/link';
import { storefrontTrust } from '@/config/storefront-trust';
import {
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ShoppingBag,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type { Product } from '@/types';
import { Input } from '@/design-system';
import { Select } from '@/design-system';
import { Button, UnstyledButton } from '@/design-system';
import { Card } from '@/design-system';
import {
  filterStorefrontReadyProducts,
  getProductPrimaryImage,
  isStorefrontProductReady,
} from '@/lib/storefront-product-quality';

interface ShippingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimated_days: string;
  currency_code: string;
}

export default function CartPage() {
  const { items, addItem, removeItem, updateQuantity, cartTotal, clearCart, cartError } =
    useCart();
  const { currentRegion, settings } = useShop();
  const { showNotification } = useNotification();
  const { formatPrice: formatCartPrice } = useCurrency();
  const [promoCode, setPromoCode] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [discount, setDiscount] = useState<{
    code: string;
    amount: number;
  } | null>(null);

  // Get free shipping threshold from settings (default 25000 = $250)
  const freeShippingThreshold = settings?.free_shipping_threshold || 25000;

  // Dynamic shipping state
  const [countryCode, setCountryCode] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [_shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] =
    useState<ShippingOption | null>(null);
  const [selectedShippingOption, setSelectedShippingOption] =
    useState<string>('');
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingMessage, setShippingMessage] = useState('');

  // Fetch shipping options when country changes
  useEffect(() => {
    const fetchShippingOptions = async () => {
      if (!countryCode || !currentRegion?.id || items.length === 0) {
        setShippingOptions([]);
        setSelectedShipping(null);
        setSelectedShippingOption('');
        setShippingMessage('');
        return;
      }

      setShippingLoading(true);
      try {
        const data = await api.getShippingOptions(
          countryCode,
          currentRegion.id,
          postalCode
        );
        setShippingMessage(data.serviceability?.message || '');
        if (data.options && data.options.length > 0) {
          setShippingOptions(data.options);
          // Auto-select first option
          setSelectedShipping(data.options[0]);
          setSelectedShippingOption(data.options[0].id);
        } else {
          setShippingOptions([]);
          setSelectedShipping(null);
          setSelectedShippingOption('');
        }
      } catch (error) {
        console.error('Failed to fetch shipping options:', error);
        setShippingOptions([]);
        setSelectedShipping(null);
        setSelectedShippingOption('');
        setShippingMessage('');
      } finally {
        setShippingLoading(false);
      }
    };

    const timer = setTimeout(fetchShippingOptions, 300);
    return () => clearTimeout(timer);
  }, [countryCode, postalCode, items.length, currentRegion?.id]);

  // Handle shipping option selection
  const handleShippingOptionChange = (optionId: string) => {
    setSelectedShippingOption(optionId);
    const option = _shippingOptions.find((o) => o.id === optionId);
    setSelectedShipping(option || null);
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);

    try {
      const res = await api.validateCoupon(promoCode, cartTotal);
      setDiscount({ code: res.code, amount: res.discount_amount });
      showNotification('success', `Coupon ${res.code} applied!`);
    } catch {
      showNotification('error', 'Invalid promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setDiscount(null);
    setPromoCode('');
  };

  const subtotal = cartTotal;
  const discountAmount = discount ? discount.amount : 0;

  // Calculate dynamic shipping cost - null represents "no shipping option selected"
  let shippingCost: number | null = null;
  if (selectedShipping && subtotal < freeShippingThreshold) {
    shippingCost = selectedShipping.price;
  } else if (subtotal >= freeShippingThreshold && selectedShipping) {
    shippingCost = 0; // Free shipping when above threshold
  } else if (!selectedShipping && subtotal >= freeShippingThreshold) {
    shippingCost = 0; // No option but qualifies for free shipping
  }

  // Use 0 for math when shippingCost is null, but track presence for display
  const shippingCostForMath = shippingCost ?? 0;
  const total = Math.max(0, subtotal - discountAmount + shippingCostForMath);

  // A4: Recommended products for empty cart state
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [addingRec, setAddingRec] = useState<string | null>(null);

  const curateCartRecommendations = (products: Product[] = []) =>
    filterStorefrontReadyProducts(products).slice(0, 4);

  useEffect(() => {
    if (items.length === 0) {
      api
        .getProducts({ limit: 4, sort: 'newest' })
        .then((data) => setRecommendations(curateCartRecommendations(data.products || [])))
        .catch(() => {});
    }
  }, [items.length]);

  useEffect(() => {
    let cancelled = false;

    const fetchCartRecommendations = async () => {
      if (items.length === 0 || !items[0]?.handle) {
        setRecommendations([]);
        return;
      }

      const product = await api.getProduct(items[0].handle!);
      const cartHandles = new Set(items.map((item) => item.handle).filter(Boolean));

      let relatedProducts = curateCartRecommendations(
        product.semantic_related_products?.filter(
          (related) => related.handle && !cartHandles.has(related.handle)
        ) || []
      );

      if (relatedProducts.length === 0) {
        const requests: Promise<{ products?: Product[] }>[] = [];
        const categoryIds = Array.from(
          new Set(product.categories?.map((category) => category.id) || [])
        ).slice(0, 2);

        for (const categoryId of categoryIds) {
          requests.push(api.getProducts({ category_id: categoryId, limit: 6 }));
        }

        if (product.collection?.id) {
          requests.push(api.getProducts({ collection_id: product.collection.id, limit: 6 }));
        }

        const results = await Promise.all(requests);
        const relatedMap = new Map<string, Product>();

        for (const result of results) {
          for (const related of result.products || []) {
            if (!related.handle || cartHandles.has(related.handle)) continue;
            if (!isStorefrontProductReady(related)) continue;
            if (relatedMap.has(related.id)) continue;
            relatedMap.set(related.id, related);
            if (relatedMap.size >= 4) break;
          }
          if (relatedMap.size >= 4) break;
        }

        relatedProducts = Array.from(relatedMap.values());
      }

      if (!cancelled) {
        setRecommendations(curateCartRecommendations(relatedProducts));
      }
    };

    fetchCartRecommendations().catch(() => {
      if (!cancelled) {
        setRecommendations([]);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [items]);

  const handleAddRecommendation = (product: Product) => {
    const variant = product.variants?.[0];
    if (!variant) return;
    const prices = variant.prices || [];
    const inrPriceObj =
      prices.find((p) => p.currency_code?.toLowerCase() === 'inr') || prices[0];
    if (!inrPriceObj) return;
    addItem({
      id: variant.id,
      variantId: variant.id,
      quantity: 1,
      title: product.title,
      price: inrPriceObj.amount,
      currency: 'INR',
      thumbnail: getProductPrimaryImage(product) || undefined,
      handle: product.handle || product.id,
    });
    setAddingRec(product.id);
    setTimeout(() => setAddingRec(null), 1200);
    showNotification('success', `${product.title} added to cart!`);
  };

  if (items.length === 0) {
    if (cartError) {
      return (
        <div className="min-h-screen bg-surface-paper">
          <div className="ds-page-container mx-auto max-w-page py-token-xl md:py-token-2xl lg:py-token-3xl">
            <div className="flex items-center justify-center p-4 mb-8 border rounded-md bg-error-bg border-error text-error">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="font-medium text-body-md">{cartError}</span>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-surface-paper">
        <div className="ds-page-container mx-auto max-w-page py-token-xl md:py-token-2xl lg:py-token-3xl">
          {/* Hero empty message */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-surface-soft mb-6">
              <ShoppingBag className="h-10 w-10 text-muted" />
            </div>
            <Heading role="page" className="mb-3 font-display text-display-xl text-primary">
              Your Bag Is Empty
            </Heading>
            <p className="mb-8 text-body-xl font-light text-muted">
              Looks like you haven&apos;t added anything yet. Let us inspire
              you.
            </p>
            <Link
              href="/products"
              className="inline-flex min-h-control-md items-center gap-2 bg-primary px-10 py-4 text-body-xs font-bold tracking-token-wider text-inverse transition-colors hover:bg-primary"
            >
              Explore Collection <ArrowRight size={16} />
            </Link>
          </div>

          {/* You Might Love section */}
          {recommendations.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-8">
                <Sparkles size={18} className="text-warning" />
                <p className="text-body-sm font-bold tracking-token-wider text-primary">
                  You Might Love
                </p>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-12 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-16">
                {recommendations.map((product) => {
                  const variant = product.variants?.[0];
                  const prices = variant?.prices || [];
                  const inrPriceObj =
                    prices.find((p) => p.currency_code?.toLowerCase() === 'inr') ||
                    prices[0];
                  const price = inrPriceObj ? formatCartPrice(inrPriceObj.amount) : '';
                  const imageUrl = getProductPrimaryImage(product);

                  return (
                    <div key={product.id} className="group flex flex-col">
                      <Link
                        href={`/products/${product.handle || product.id}`}
                        className="block relative aspect-[3/4] bg-surface-soft overflow-hidden mb-4 rounded-sm"
                      >
                        {imageUrl ? (
                          <OptimizedImage
                            src={imageUrl}
                            alt={product.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-700"
                            sizes="(max-width: 768px) 45vw, 25vw"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted">
                            <ShoppingBag size={32} />
                          </div>
                        )}
                      </Link>
                      <Link
                        href={`/products/${product.handle || product.id}`}
                        className="space-y-1 mb-3"
                      >
                        <p className="text-body-xs font-bold tracking-token-wider text-muted">
                          {product.collection?.title || 'Odhvica'}
                        </p>
                        <p className="font-display text-body-md leading-token-tight text-primary transition-colors group-hover:text-muted">
                          {product.title}
                        </p>
                        {price && (
                          <p className="text-body-sm font-medium text-primary">
                            {price}
                          </p>
                        )}
                      </Link>
                      <UnstyledButton
                        onClick={() => handleAddRecommendation(product)}
                        disabled={addingRec === product.id || !variant}
                        className={`w-full py-2.5 text-body-xs font-bold  tracking-token-wider border transition-all ${
                          addingRec === product.id
                            ? 'bg-success text-inverse border-success'
                            : 'border-border-subtle text-primary hover:border-primary hover:bg-primary hover:text-inverse'
                        }`}
                      >
                        {addingRec === product.id ? '✓ Added!' : 'Quick Add'}
                      </UnstyledButton>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="ds-page-container mx-auto max-w-page py-token-xl md:py-token-2xl lg:py-token-3xl">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <Heading role="page" className="font-display text-display-lg text-primary">Shopping Cart</Heading>
          <UnstyledButton
            onClick={() => {
              if (confirm('Are you sure you want to clear your cart?')) {
                clearCart();
                showNotification('success', 'Cart cleared');
              }
            }}
            className="text-body-sm text-muted underline hover:text-primary"
          >
            Clear Cart
          </UnstyledButton>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-16">
          {/* Cart Items */}
          <div className="lg:col-span-7">
            <ul className="divide-y divide-border-subtle border-b border-t border-border-subtle">
              {items.map((item) => (
                <li key={item.variantId} className="flex py-6 sm:py-10">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <div className="relative h-24 w-24 sm:h-32 sm:w-32 bg-surface-soft overflow-hidden">
                      {item.thumbnail ? (
                        <OptimizedImage
                          src={item.thumbnail}
                          alt={item.title}
                          fill
                          className="object-cover object-center"
                          sizes="(max-width: 640px) 96px, 128px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-muted">
                          <ShoppingBag size={32} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="ml-4 flex flex-1 flex-col justify-between sm:ml-6">
                    <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                      <div>
                        <div className="flex justify-between">
                          <p className="text-body-sm font-medium text-primary">
                            {item.handle ? (
                              <Link
                                href={`/products/${item.handle}`}
                                className="hover:underline"
                              >
                                {item.title}
                              </Link>
                            ) : (
                              <span>{item.title}</span>
                            )}
                          </p>
                        </div>
                        <p className="mt-1 text-body-sm text-muted">
                          {formatCartPrice(item.price)}
                        </p>
                        {(item.material || item.origin || item.sku) && (
                          <div className="mt-2 space-y-1 text-body-xs text-muted">
                            {item.material && <p>Material: {item.material}</p>}
                            {item.origin && <p>Origin: {item.origin}</p>}
                            {item.sku && (
                              <p className="text-muted">SKU: {item.sku}</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="mt-4 sm:mt-0 sm:pr-9">
                        {/* Quantity Selector */}
                        <div className="flex items-center">
                          <UnstyledButton
                            onClick={() =>
                              updateQuantity(item.variantId, item.quantity - 1)
                            }
                            className="flex min-h-control-sm min-w-control-sm items-center justify-center p-1 text-muted hover:text-primary"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={16} />
                          </UnstyledButton>
                          <Input
                            type="number"
                            aria-label={`Quantity for ${item.title}`}
                            value={item.quantity}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value) || 1;
                              updateQuantity(item.variantId, qty);
                            }}
                            containerClassName="w-16"
                            className="h-auto border-0 bg-transparent px-0 py-1 text-center focus:border-transparent sm:text-body-sm"
                            min="1"
                          />
                          <UnstyledButton
                            onClick={() =>
                              updateQuantity(item.variantId, item.quantity + 1)
                            }
                            className="flex min-h-control-sm min-w-control-sm items-center justify-center p-1 text-muted hover:text-primary"
                            aria-label="Increase quantity"
                          >
                            <Plus size={16} />
                          </UnstyledButton>
                        </div>

                        {/* Remove Button */}
                        <div className="absolute right-0 top-0">
                          <UnstyledButton
                            onClick={() => removeItem(item.variantId)}
                            className="flex min-h-control-sm min-w-control-sm items-center justify-center p-2 text-muted transition-colors hover:text-error"
                            aria-label="Remove item"
                          >
                            <Trash2 size={18} />
                          </UnstyledButton>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-end justify-between pt-4">
                      <p className="text-body-md font-medium text-primary">
                        Subtotal: {formatCartPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Continue Shopping */}
            <div className="mt-6">
              <Link
                href="/products"
                className="flex items-center gap-2 text-body-sm text-muted hover:text-primary"
              >
                <ArrowRight size={16} className="rotate-180" />
                Continue Shopping
              </Link>
            </div>

            {recommendations.length > 0 ? (
              <section className="mt-12 rounded-lg border border-border-subtle bg-surface-paper p-6">
                <div className="mb-6 flex items-center gap-3">
                  <Sparkles size={18} className="text-warning" />
                  <div>
                    <p className="text-body-xs font-bold tracking-token-wider text-muted">
                      Pair With Your Bag
                    </p>
                    <p className="mt-1 text-body-xl font-medium text-primary">
                      Complete the look before checkout
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4 lg:gap-x-6">
                  {recommendations.map((product) => {
                    const variant = product.variants?.[0];
                    const prices = variant?.prices || [];
                    const inrPriceObj =
                      prices.find((p) => p.currency_code?.toLowerCase() === 'inr') ||
                      prices[0];
                    const price = inrPriceObj ? formatCartPrice(inrPriceObj.amount) : '';
                    const imageUrl = getProductPrimaryImage(product);

                    return (
                      <div key={product.id} className="group flex flex-col">
                        <Link
                          href={`/products/${product.handle || product.id}`}
                          className="relative mb-4 block aspect-[3/4] overflow-hidden rounded-sm bg-surface-soft"
                        >
                          {imageUrl ? (
                            <OptimizedImage
                              src={imageUrl}
                              alt={product.title}
                              fill
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-muted">
                              <ShoppingBag size={32} />
                            </div>
                          )}
                        </Link>
                        <Link
                          href={`/products/${product.handle || product.id}`}
                          className="mb-3 space-y-1"
                        >
                          <p className="text-body-xs font-bold tracking-token-wider text-muted">
                            {product.collection?.title || 'Odhvica'}
                          </p>
                          <p className="font-display text-body-md leading-token-tight text-primary transition-colors group-hover:text-muted">
                            {product.title}
                          </p>
                          {price ? (
                            <p className="text-body-sm font-medium text-primary">
                              {price}
                            </p>
                          ) : null}
                        </Link>
                        <UnstyledButton
                          onClick={() => handleAddRecommendation(product)}
                          disabled={addingRec === product.id || !variant}
                          className={`w-full border py-2.5 text-body-xs font-bold  tracking-token-wider transition-all ${
                            addingRec === product.id
                              ? 'border-success bg-success text-inverse'
                              : 'border-border-subtle text-primary hover:border-primary hover:bg-primary hover:text-inverse'
                          }`}
                        >
                          {addingRec === product.id ? 'Added' : 'Quick Add'}
                        </UnstyledButton>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}
          </div>

          {/* Order Summary */}
          <div className="mt-16 lg:col-span-5 lg:mt-0">
            <Card className="p-6">
              <p className="mb-6 text-body-xl font-medium text-primary">
                Order Summary
              </p>

              {/* Promo Code */}
              <div className="mb-6">
                {discount ? (
                  <div className="flex items-center justify-between bg-success-bg border border-success rounded-md p-3">
                    <div>
                      <span className="text-body-sm font-medium text-success">
                        {discount.code}
                      </span>
                      <span className="text-body-xs text-success ml-2">
                        (-{formatCartPrice(discount.amount)})
                      </span>
                    </div>
                    <Button
                      type="button"
                      onClick={handleRemovePromo}
                      variant="ghost"
                      size="sm"
                      className="min-h-0 px-0 text-body-xs text-success hover:text-success"
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Promo code"
                      containerClassName="flex-1"
                      aria-label="Promo code"
                    />
                    <Button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={promoLoading || !promoCode.trim()}
                      variant="secondary"
                      size="sm"
                    >
                      {promoLoading ? 'Applying...' : 'Apply'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Country Selector for Shipping */}
              <div className="mb-6">
                <Select
                  label="Shipping to"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                >
                  <option value="">Select country</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="NZ">New Zealand</option>
                  <option value="IN">India</option>
                  <option value="AE">United Arab Emirates</option>
                  <option value="SA">Saudi Arabia</option>
                  <option value="QA">Qatar</option>
                  <option value="KW">Kuwait</option>
                  <option value="BH">Bahrain</option>
                  <option value="OM">Oman</option>
                  <option value="DE">Germany</option>
                  <option value="FR">France</option>
                  <option value="IT">Italy</option>
                  <option value="ES">Spain</option>
                  <option value="NL">Netherlands</option>
                  <option value="BE">Belgium</option>
                  <option value="SE">Sweden</option>
                  <option value="NO">Norway</option>
                  <option value="DK">Denmark</option>
                  <option value="FI">Finland</option>
                  <option value="PT">Portugal</option>
                  <option value="CH">Switzerland</option>
                  <option value="AT">Austria</option>
                  <option value="PL">Poland</option>
                  <option value="JP">Japan</option>
                  <option value="KR">South Korea</option>
                  <option value="SG">Singapore</option>
                  <option value="HK">Hong Kong</option>
                  <option value="TW">Taiwan</option>
                  <option value="MY">Malaysia</option>
                  <option value="TH">Thailand</option>
                  <option value="PH">Philippines</option>
                  <option value="ID">Indonesia</option>
                  <option value="VN">Vietnam</option>
                  <option value="MX">Mexico</option>
                  <option value="BR">Brazil</option>
                  <option value="AR">Argentina</option>
                  <option value="CL">Chile</option>
                  <option value="CO">Colombia</option>
                  <option value="ZA">South Africa</option>
                  <option value="EG">Egypt</option>
                  <option value="NG">Nigeria</option>
                  <option value="KE">Kenya</option>
                  <option value="IL">Israel</option>
                  <option value="TR">Turkey</option>
                  <option value="PK">Pakistan</option>
                  <option value="BD">Bangladesh</option>
                  <option value="LK">Sri Lanka</option>
                  <option value="NP">Nepal</option>
                </Select>
                <Input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder="Postal code for better preview"
                  containerClassName="mt-3"
                  aria-label="Postal code"
                />
                {shippingLoading && (
                  <p className="mt-1 text-body-xs text-muted">
                    Loading shipping options...
                  </p>
                )}
                {!shippingLoading && shippingMessage ? (
                  <p className="mt-2 text-body-xs text-muted">
                    {shippingMessage}
                  </p>
                ) : null}

                {/* Shipping Options Radio Group */}
                {_shippingOptions.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <label className="mb-2 block text-body-xs font-medium text-muted">
                      Select shipping method
                    </label>
                    {_shippingOptions.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors ${
                          selectedShippingOption === option.id
                            ? 'border-primary bg-surface'
                            : 'border-border-subtle hover:border-muted'
                        }`}
                      >
                        <div className="flex items-center">
                          <SelectionControl
                            type="radio"
                            name="shipping-option"
                            value={option.id}
                            checked={selectedShippingOption === option.id}
                            onChange={() =>
                              handleShippingOptionChange(option.id)
                            }
                          />
                          <div className="ml-3">
                            <p className="text-body-sm font-medium text-primary">
                              {option.name}
                            </p>
                            <p className="text-body-xs text-muted">
                              {option.description}
                              {option.estimated_days &&
                              option.estimated_days.trim() !== ''
                                ? ` (${option.estimated_days})`
                                : null}
                            </p>
                          </div>
                        </div>
                        <span className="text-body-sm font-medium text-primary">
                          {subtotal >= freeShippingThreshold
                            ? 'Free'
                            : formatCartPrice(option.price)}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary Details */}
              <div className="flow-root">
                <dl className="-my-4 divide-y divide-border-subtle">
                  <div className="flex items-center justify-between py-4">
                    <dt className="text-muted">Subtotal</dt>
                    <dd className="font-medium text-primary">
                      {formatCartPrice(subtotal)}
                    </dd>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between py-4">
                      <dt className="text-muted">Discount</dt>
                      <dd className="font-medium text-success">
                        -{formatCartPrice(discountAmount)}
                      </dd>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-4">
                    <dt className="text-muted">
                      Shipping
                      {shippingCost === 0 &&
                        subtotal >= freeShippingThreshold && (
                          <span className="ml-2 text-body-xs text-success">
                            (Free over {formatCartPrice(freeShippingThreshold)})
                          </span>
                        )}
                    </dt>
                    <dd className="font-medium text-primary">
                      {!countryCode ? (
                        <span className="text-body-sm text-muted">
                          Calculated at checkout
                        </span>
                      ) : countryCode && _shippingOptions.length === 0 ? (
                        <span className="text-body-sm text-muted">
                          Shipping unavailable
                        </span>
                      ) : !selectedShipping ? (
                        <span className="text-body-sm text-muted">
                          Not available
                        </span>
                      ) : shippingCost === 0 ? (
                        'Free'
                      ) : (
                        formatCartPrice(shippingCost ?? 0)
                      )}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between py-4">
                    <dt className="text-body-md font-medium text-primary">
                      Total
                    </dt>
                    <dd className="text-display-sm font-medium text-primary">
                      {formatCartPrice(total)}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Free Shipping Notice */}
              {(shippingCost === null || shippingCost > 0) &&
                subtotal < freeShippingThreshold && (
                  <div className="mt-4 flex items-center gap-2 rounded-md bg-surface p-3 text-body-sm text-muted">
                    <AlertCircle size={16} />
                    <span>
                      Add {formatCartPrice(freeShippingThreshold - subtotal)}{' '}
                      more for free shipping!
                    </span>
                  </div>
                )}

              {/* Checkout Button */}
              <Link
                href="/checkout"
                className="mt-6 block w-full bg-primary py-4 text-center text-body-sm font-bold tracking-token-wider text-inverse transition-colors hover:bg-primary"
              >
                Proceed to Checkout
              </Link>

              {/* Secure Checkout Notice */}
              <div className="mt-4 flex items-center justify-center gap-2 text-body-xs text-muted">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>
                  {storefrontTrust.paymentShortSummary}
                </span>
              </div>

              <div className="mt-4 rounded-md border border-border-subtle bg-surface p-4 text-body-xs text-muted">
                <p className="font-medium text-primary">Before you pay</p>
                <p className="mt-2">{storefrontTrust.shippingSummary}</p>
                <p className="mt-2">{storefrontTrust.returnSummary}</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link
                    href={storefrontTrust.policyRoutes.shipping}
                    className="underline underline-offset-4"
                  >
                    Shipping
                  </Link>
                  <Link
                    href={storefrontTrust.policyRoutes.returns}
                    className="underline underline-offset-4"
                  >
                    Returns
                  </Link>
                  <Link
                    href={storefrontTrust.policyRoutes.paymentHelp}
                    className="underline underline-offset-4"
                  >
                    Payment Help
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
