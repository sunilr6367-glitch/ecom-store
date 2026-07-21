'use client';


import { Heading } from '@/design-system';
import { HiddenCheckbox, SelectionControl } from '@/design-system';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { useShop } from '@/context/shop-context';
import { api } from '@/lib/api';
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { SecurityBadges,  PaymentIcons  } from '@/design-system';
import Link from 'next/link';
import { OptimizedImage } from '@/design-system';
import { CountrySelect } from '@/design-system';
import { getCountryName } from '@/config/countries';
import { AddressAutocomplete } from '@/design-system';
import { Input } from '@/design-system';
import { Textarea } from '@/design-system';
import { Button } from '@/design-system';
import { CheckoutSkeleton } from '@/design-system';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import RazorpayButton from '@/components/checkout/RazorpayButton';
import PayPalButton from '@/components/checkout/PayPalButton';
import { buildWhatsAppHref } from '@/components/WhatsAppCTA';
import { storefrontTrust } from '@/config/storefront-trust';
import { useCurrency } from '@/context/currency-context';
import { formatMoney } from '@/lib/currency';
import { resolveRegionForCountry } from '@/lib/regions';

interface ShippingOption {
  id: string;
  name: string;
  description: string;
  price: number;
  estimated_days: string;
  currency_code: string;
}

export default function CheckoutPage() {
  const { customer, loading: authLoading } = useAuth();
  const { items, cartTotal, clearCart } = useCart();
  const { currentRegion, regions, setRegion, settings } = useShop();
  const { formatPrice } = useCurrency();

  // Initialize all hooks FIRST - before any conditionals
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'auth' | 'shipping' | 'payment' | 'success'>(
    'auth'
  );
  
  // Auth state for Step 0
  const [authEmail, setAuthEmail] = useState(customer?.email || '');
  const [authOtp, setAuthOtp] = useState('');
  const [authStage, setAuthStage] = useState<'email' | 'otp'>('email');
  const [authLoadingStep, setAuthLoadingStep] = useState(false);
  const [authError, setAuthError] = useState('');

  const [orderId, setOrderId] = useState('');         // display_id for UI
  const [orderUUID, setOrderUUID] = useState('');      // UUID for payment APIs
  const [checkoutPaymentToken, setCheckoutPaymentToken] = useState('');
  const [confirmedOrderTotals, setConfirmedOrderTotals] = useState<{
    total: number;
    shipping_total: number;
    tax_total: number;
    gift_wrapping_total: number;
    currency_code: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Discount State
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState<{
    code: string;
    amount: number;
  } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // PHASE 1.3: Shipping Options State
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] =
    useState<ShippingOption | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(25000);
  const [shippingPreviewMessage, setShippingPreviewMessage] = useState('');

  // PHASE 1.4: Tax Calculation State
  const [taxAmount, setTaxAmount] = useState(0);
  const [taxLoading, setTaxLoading] = useState(false);
  const [taxName, setTaxName] = useState('Tax');

  // PHASE 1.5: Terms Acceptance State
  const [acceptTerms, setAcceptTerms] = useState(false);

  // D3: Gift Wrapping State
  const [giftWrapping, setGiftWrapping] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');

  // Form data hook moved BEFORE conditional return
  const [formData, setFormData] = useState({
    email: customer?.email || '',
    first_name: customer?.first_name || '',
    last_name: customer?.last_name || '',
    address_1: '',
    address_2: '',
    city: '',
    province: '',
    country_code: '',
    postal_code: '',
    phone: customer?.phone || '',
  });

  // Update form data when customer data loads
  useEffect(() => {
    if (customer) {
      setFormData((prev) => ({
        ...prev,
        email: customer.email || prev.email,
        first_name: customer.first_name || prev.first_name,
        last_name: customer.last_name || prev.last_name,
        phone: customer.phone || prev.phone,
      }));
      setAuthEmail(customer.email);
    }
  }, [customer]);

  // Skip auth step if user is already logged in
  useEffect(() => {
    if (!authLoading && step === 'auth') {
      if (customer) {
        setStep('shipping');
      }
    }
  }, [customer, authLoading, step]);

  // Shipping country is authoritative at checkout: exact country first,
  // then the configured five-market mapping, then Rest of World.
  useEffect(() => {
    if (!formData.country_code || regions.length === 0) return;

    const matchedRegion = resolveRegionForCountry(
      regions,
      formData.country_code
    );
    if (matchedRegion && matchedRegion.id !== currentRegion?.id) {
      setRegion(matchedRegion);
    }
  }, [formData.country_code, regions, currentRegion?.id, setRegion]);

  // PHASE 1.3: Fetch shipping options when country changes
  useEffect(() => {
    const fetchShippingOptions = async () => {
      if (!formData.country_code) {
        setShippingOptions([]);
        setSelectedShipping(null);
        setShippingPreviewMessage('');
        return;
      }

      setShippingLoading(true);
      try {
        const data = await api.getShippingOptions(
          formData.country_code,
          currentRegion?.id,
          formData.postal_code
        );
        setShippingPreviewMessage(data.serviceability?.message || '');
        if (data.options && data.options.length > 0) {
          setShippingOptions(data.options);
          setFreeShippingThreshold(data.free_shipping_threshold || 25000);
          // Auto-select first option
          setSelectedShipping(data.options[0]);
        } else {
          setShippingOptions([]);
          setSelectedShipping(null);
        }
      } catch (error) {
        console.error('Failed to fetch shipping options:', error);
        setShippingOptions([]);
        setSelectedShipping(null);
        setShippingPreviewMessage('');
      } finally {
        setShippingLoading(false);
      }
    };

    // Debounce the fetch
    const timer = setTimeout(fetchShippingOptions, 300);
    return () => clearTimeout(timer);
  }, [formData.country_code, formData.postal_code, currentRegion?.id]);

  // PHASE 1.4: Fetch tax when country or cart total changes
  useEffect(() => {
    const fetchTax = async () => {
      if (!formData.country_code || cartTotal === 0) {
        setTaxAmount(0);
        return;
      }

      setTaxLoading(true);
      try {
        // Calculate subtotal after discount
        const subtotal = cartTotal - (discount?.amount || 0);
        // Pass settings to use dynamic tax rates from backend
        const data = await api.calculateTax(
          formData.country_code,
          subtotal,
          currentRegion?.id,
          settings || undefined
        );
        if (data.tax_amount) {
          setTaxAmount(data.tax_amount);
          setTaxName(data.tax_name || 'Tax');
        }
      } catch (error) {
        console.error('Failed to calculate tax:', error);
        setTaxAmount(0);
      } finally {
        setTaxLoading(false);
      }
    };

    const timer = setTimeout(fetchTax, 500);
    return () => clearTimeout(timer);
  }, [formData.country_code, cartTotal, discount?.amount, currentRegion?.id, settings]);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoMessage(null);
    try {
      const res = await api.validateCoupon(promoCode, cartTotal);
      setDiscount({ code: res.code, amount: res.discount_amount });
      setPromoMessage({
        type: 'success',
        text: `Coupon ${res.code} applied! -${formatPrice(res.discount_amount)}`,
      });
    } catch {
      setDiscount(null);
      setPromoMessage({ type: 'error', text: 'Invalid promo code' });
    } finally {
      setPromoLoading(false);
    }
  };

  // PHASE 1.1: Allow guest checkout - removed login requirement
  // Guests can now checkout without creating an account

  // Show loading state
  if (authLoading) {
    return <CheckoutSkeleton />;
  }

  if (items.length === 0 && step !== 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-surface-paper">
        <Heading role="page" className="mb-4 font-display text-display-lg text-primary">
          Your cart is empty
        </Heading>
        <Link
          href="/"
          className="border-b border-border-subtle pb-1 text-muted transition-colors hover:text-primary"
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-surface-paper">
        {/* Animated check */}
        <div className="relative w-24 h-24 mb-8">
          <div className="w-24 h-24 rounded-full bg-success-bg flex items-center justify-center animate-scale-in">
            <CheckCircle
              size={48}
              strokeWidth={1.5}
              className="text-success"
            />
          </div>
        </div>
        <span className="mb-3 block text-body-xs font-bold tracking-token-wider text-muted">
          Order Placed Successfully
        </span>
        <Heading role="page" className="mb-3 font-display text-display-xl text-primary">Thank You!</Heading>
        <p className="mb-2 max-w-md text-body-xl font-light text-muted">
          Your order{' '}
          <span className="font-semibold text-primary">#{orderId}</span> has
          been confirmed.
        </p>
        <p className="mb-10 max-w-md text-body-sm font-light text-muted">
          We&apos;re preparing your order for shipment. You&apos;ll receive an
          email confirmation shortly.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <Link
            href="/"
            className="bg-primary px-8 py-3 text-body-xs font-bold tracking-token-wider text-inverse transition-colors hover:bg-primary"
          >
            Continue Shopping
          </Link>
          <Link
            href="/account"
            className="border border-border-subtle px-8 py-3 text-body-xs font-bold tracking-token-wider text-primary transition-colors hover:bg-surface"
          >
            Track My Order
          </Link>
        </div>
        {/* WhatsApp support */}
        <div className="mt-4 w-full max-w-md border-t border-border-subtle pt-6">
          <p className="mb-3 text-body-xs text-muted">
            Need help with your order?
          </p>
          <a
            href={buildWhatsAppHref('Hi, I need help with checkout on Odhvica')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-body-xs text-success font-bold hover:text-success transition-colors"
          >
            <span className="text-body-md">💬</span> Chat with us on WhatsApp
          </a>
        </div>
      </div>
    );
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAddressSelect = (address: {
    address_1: string;
    city: string;
    postal_code: string;
    country: string;
  }) => {
    setFormData((prev) => ({
      ...prev,
      address_1: address.address_1 || prev.address_1,
      city: address.city || prev.city,
      postal_code: address.postal_code || prev.postal_code,
      country_code: address.country || prev.country_code,
    }));
  };

  const handleShippingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!currentRegion) {
        throw new Error(
          formData.country_code 
            ? `Shipping is not available for ${getCountryName(formData.country_code)} at this time.`
            : 'No shipping region selected.'
        );
      }

      // PHASE 1.5: Validate terms acceptance
      if (!acceptTerms) {
        throw new Error(
          'Please accept the Terms & Conditions and Privacy Policy to continue'
        );
      }

      // PHASE 1.3: Validate shipping method selection
      if (!selectedShipping) {
        throw new Error('Please select a shipping method');
      }

      const currencyCode = currentRegion.currency_code.toLowerCase();
      const hasRazorpay =
        currencyCode === 'inr' &&
        !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const hasPayPal =
        currencyCode !== 'inr' &&
        !!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

      if (!hasRazorpay && !hasPayPal) {
        throw new Error(
          'Payment is not available for the region selected by your shipping country. Please contact support.'
        );
      }

      const payload = {
        region_id: currentRegion.id,
        email: formData.email,
        currency_code: currentRegion.currency_code,
        items: items.map((i) => ({
          variant_id: i.variantId,
          quantity: i.quantity,
        })),
        shipping_address: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          address_1: formData.address_1,
          address_2: formData.address_2 || undefined,
          city: formData.city,
          province: formData.province || undefined,
          country_code: formData.country_code,
          postal_code: formData.postal_code,
          phone: formData.phone && /^\+?[1-9]\d{6,14}$/.test(formData.phone) 
            ? formData.phone 
            : undefined,
        },
        shipping_method: selectedShipping.id,
        discount_code: discount?.code,
        gift_wrapping: giftWrapping,
        gift_message: giftWrapping && giftMessage ? giftMessage : undefined,
      };

      // Create order
      const res = await api.createOrder(payload);
      const newOrderUUID = res.order.id;
      setOrderId(res.order.display_id);
      setOrderUUID(newOrderUUID);
      setCheckoutPaymentToken(res.checkout_payment_token || '');
      setConfirmedOrderTotals({
        total: Number(res.order.total),
        shipping_total: Number(res.order.shipping_total || 0),
        tax_total: Number(res.order.tax_total || 0),
        gift_wrapping_total: Number(
          res.order.metadata?.gift_wrapping_total || 0
        ),
        currency_code: res.order.currency_code || currentRegion.currency_code,
      });

      // Move to payment step
      setStep('payment');
    } catch (err) {
      console.error('Order creation error:', err);
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Failed to create order. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setStep('success');
    clearCart();
  };

  const handlePaymentError = (msg: string) => {
    setError(msg);
  };

  // PHASE 1.3: Calculate shipping cost
  const shippingCost =
    confirmedOrderTotals?.shipping_total ??
    (selectedShipping
      ? cartTotal >= freeShippingThreshold
        ? 0
        : selectedShipping.price || 0
      : 0);

  // Gift wrapping is stored in INR paise to match cart totals.
  const giftWrappingFee = 29900;
  const giftWrappingCost =
    confirmedOrderTotals?.gift_wrapping_total ??
    (giftWrapping ? giftWrappingFee : 0);
  const displayedTaxAmount = confirmedOrderTotals?.tax_total ?? taxAmount;

  // PHASE 1.4: Final total includes subtotal - discount + shipping + tax + gift
  const finalTotal =
    confirmedOrderTotals?.total ??
    (cartTotal -
      (discount?.amount || 0) +
      shippingCost +
      displayedTaxAmount +
      giftWrappingCost);

  // Local cart amounts are INR paise and need conversion. Confirmed order totals
  // are already in the backend-selected regional currency and need formatting only.
  const currency =
    currentRegion?.currency_code || items[0]?.currency?.toUpperCase() || 'USD';
  const displayMoney = (amount: number) => formatPrice(amount);
  const displayConfirmedMoney = (amount: number) =>
    formatMoney(amount, confirmedOrderTotals?.currency_code || currency);

  return (
    <div className="min-h-screen bg-surface-paper">
      {/* PHASE 3.2: Mobile-first responsive layout */}
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Left: Form */}
        <div className="order-2 border-border-subtle p-4 md:p-8 lg:order-1 lg:border-r lg:p-20">
          <div className="max-w-lg mx-auto">
            <Link
              href="/"
              className="mb-6 inline-flex items-center gap-2 text-body-sm text-muted transition-colors hover:text-primary md:mb-12"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Back to Shop</span>
              <span className="sm:hidden">Back</span>
            </Link>

            <div className="mb-12">
              <h2 className="mb-2 font-display text-display-lg text-primary">
                Checkout
              </h2>
              <p className="flex items-center gap-2 text-body-sm font-light text-muted">
                <Lock size={14} /> Secure Checkout
              </p>
            </div>

            {/* D1: Premium Progress Bar — 3 steps */}
            <div className="mb-10">
              <div className="flex items-center">
                {/* Step 1: Shipping */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex min-h-control-sm min-w-control-sm items-center justify-center rounded-full border-2 text-body-xs font-bold transition-all ${
                      step === 'shipping'
                        ? 'border-primary bg-surface-paper text-primary'
                        : 'border-border-subtle bg-surface-paper text-muted'
                    }`}
                  >
                    {step === 'payment' ? '✓' : '1'}
                  </div>
                  <span
                    className={`text-body-xs font-bold  tracking-token-wider mt-1 ${
                      step === 'shipping' ? 'text-primary' : 'text-muted'
                    }`}
                  >
                    Shipping
                  </span>
                </div>
                {/* Connector 1-2 */}
                <div
                  className={`flex-1 h-0.5 mx-2 transition-colors ${
                    step === 'payment' ? 'bg-primary' : 'bg-border-subtle'
                  }`}
                />
                {/* Step 2: Payment */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex min-h-control-sm min-w-control-sm items-center justify-center rounded-full border-2 text-body-xs font-bold transition-all ${
                      step === 'payment'
                        ? 'border-primary bg-surface-paper text-primary'
                        : 'border-border-subtle bg-surface-paper text-muted'
                    }`}
                  >
                    {'2'}
                  </div>
                  <span
                    className={`text-body-xs font-bold  tracking-token-wider mt-1 ${
                      step === 'payment' ? 'text-primary' : 'text-muted'
                    }`}
                  >
                    Payment
                  </span>
                </div>
                <div className="mx-2 h-0.5 flex-1 bg-border-subtle" />
                {/* Step 3: Confirmation */}
                <div className="flex flex-col items-center">
                  <div className="flex min-h-control-sm min-w-control-sm items-center justify-center rounded-full border-2 border-border-subtle bg-surface-paper text-body-xs font-bold text-muted">
                    3
                  </div>
                  <span className="text-body-xs font-bold  tracking-token-wider mt-1 text-muted">
                    Confirm
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 space-y-3">
                <div className="bg-danger-bg border border-danger text-error p-4 text-body-sm">
                  {error}
                </div>
                <div className="border border-border-subtle bg-surface p-4 text-body-xs text-muted">
                  <p className="font-medium text-primary">Need help completing payment?</p>
                  <p className="mt-2">
                    Do not retry blindly if you are unsure whether a payment was
                    charged. Use payment help or contact support with your order
                    reference.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Link
                      href={storefrontTrust.policyRoutes.paymentHelp}
                      className="underline underline-offset-4"
                    >
                      Payment Help
                    </Link>
                    <Link
                      href={`${storefrontTrust.policyRoutes.contact}?order=${orderId || orderUUID}&email=${encodeURIComponent(formData.email)}`}
                      className="underline underline-offset-4"
                    >
                      Contact Support
                    </Link>
                    <Link
                      href={storefrontTrust.policyRoutes.track}
                      className="underline underline-offset-4"
                    >
                      Track Order
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {step === 'auth' ? (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-6 border-b border-border-subtle pb-2 text-body-xl font-display text-primary">
                    {authStage === 'email' ? 'Enter Email' : 'Verify OTP'}
                  </h3>
                  
                  {authError && (
                    <div className="bg-danger-bg text-error p-3 text-body-sm mb-4">
                      {authError}
                    </div>
                  )}

                  {authStage === 'email' ? (
                    <div className="space-y-4">
                      <p className="text-body-sm text-muted">Please enter your email to proceed with checkout.</p>
                      <Input
                        id="auth_email"
                        type="email"
                        name="auth_email"
                        label="Email Address"
                        required
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        autoComplete="email"
                      />
                      <Button
                        onClick={async () => {
                          if (!authEmail) return;
                          setAuthLoadingStep(true);
                          setAuthError('');
                          try {
                            await api.sendCheckoutOtp(authEmail);
                            setAuthStage('otp');
                          } catch (err: unknown) {
                            const error = err as Error;
                            setAuthError(error.message || 'Failed to send OTP');
                          } finally {
                            setAuthLoadingStep(false);
                          }
                        }}
                        disabled={authLoadingStep}
                        className="w-full mt-4"
                        variant="primary"
                      >
                        Send OTP
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-body-sm text-muted">Enter the 6-digit code sent to {authEmail}</p>
                      <Input
                        id="auth_otp"
                        type="text"
                        name="auth_otp"
                        label="6-Digit OTP"
                        required
                        value={authOtp}
                        onChange={(e) => setAuthOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      />
                      <Button
                        onClick={async () => {
                          if (authOtp.length !== 6) return;
                          setAuthLoadingStep(true);
                          setAuthError('');
                          try {
                            const res = await api.verifyCheckoutOtp(authEmail, authOtp);
                            // Pre-fill form data
                            setFormData(prev => ({
                              ...prev,
                              email: res.customer.email || prev.email,
                              first_name: res.customer.first_name || prev.first_name,
                              last_name: res.customer.last_name || prev.last_name,
                              phone: res.customer.phone || prev.phone,
                            }));
                            setStep('shipping');
                          } catch (err: unknown) {
                            const error = err as Error;
                            setAuthError(error.message || 'Invalid OTP');
                          } finally {
                            setAuthLoadingStep(false);
                          }
                        }}
                        disabled={authLoadingStep || authOtp.length !== 6}
                        className="w-full mt-4"
                        variant="primary"
                      >
                        Verify OTP
                      </Button>
                      <Button
                        onClick={() => setAuthStage('email')}
                        variant="inline"
                        fullWidth
                        type="button"
                      >
                        Change Email
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : step === 'shipping' ? (
              <form onSubmit={handleShippingSubmit} className="space-y-8">
                <div>
                  <h3 className="mb-6 border-b border-border-subtle pb-2 text-body-xl font-display text-primary">
                    Contact
                  </h3>
                  <div className="space-y-4">
                    <Input
                      id="email"
                      type="email"
                      name="email"
                      label="Email Address"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      autoComplete="email"
                      aria-required="true"
                      aria-describedby="email-help"
                    />
                    <span id="email-help" className="sr-only">
                      Enter your email address for order updates
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="mb-6 border-b border-border-subtle pb-2 text-body-xl font-display text-primary">
                    Shipping Address
                  </h3>
                  {/* PHASE 3.2: Mobile-first responsive grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4">
                    <div>
                      <Input
                        id="first_name"
                        type="text"
                        name="first_name"
                        label="First Name"
                        required
                        value={formData.first_name}
                        onChange={handleChange}
                        autoComplete="given-name"
                        aria-required="true"
                      />
                    </div>
                    <div>
                      <Input
                        id="last_name"
                        type="text"
                        name="last_name"
                        label="Last Name"
                        required
                        value={formData.last_name}
                        onChange={handleChange}
                        autoComplete="family-name"
                        aria-required="true"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <AddressAutocomplete
                      label="Address (Line 1)"
                      value={formData.address_1}
                      onChange={(value) =>
                        setFormData((prev) => ({ ...prev, address_1: value }))
                      }
                      onAddressSelect={handleAddressSelect}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4">
                    <div>
                      <Input
                        id="city"
                        type="text"
                        name="city"
                        label="City"
                        required
                        value={formData.city}
                        onChange={handleChange}
                        autoComplete="address-level2"
                        aria-required="true"
                      />
                    </div>
                    <div>
                      <Input
                        id="province"
                        type="text"
                        name="province"
                        label="State/Province"
                        value={formData.province}
                        onChange={handleChange}
                        autoComplete="address-level1"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-4">
                    <div>
                      <Input
                        id="postal_code"
                        type="text"
                        name="postal_code"
                        label="Postal Code"
                        required
                        value={formData.postal_code}
                        onChange={handleChange}
                        autoComplete="postal-code"
                        aria-required="true"
                      />
                    </div>
                  </div>
                  <div>
                    <p className="form-label-typography mb-1.5  text-muted">
                      Country <span className="ml-1 text-error">*</span>
                    </p>
                    <CountrySelect
                      name="country"
                      value={formData.country_code}
                      onChange={(code) =>
                        setFormData((prev) => ({ ...prev, country_code: code }))
                      }
                      required
                    />
                  </div>
                </div>

                {/* PHASE 1.3: Shipping Method Selection */}
                <div className="mt-8">
                  <h3 className="mb-6 border-b border-border-subtle pb-2 text-body-xl font-display text-primary">
                    Shipping Method
                  </h3>

                  {shippingLoading ? (
                    <div className="py-4 text-center text-muted">
                      Loading shipping options...
                    </div>
                  ) : shippingOptions.length > 0 ? (
                    <div className="space-y-3">
                      {shippingOptions.map((option) => {
                        const isFree =
                          option.price === 0 ||
                          cartTotal >= freeShippingThreshold;
                        const displayPrice = isFree ? 0 : option.price;

                        return (
                          <label
                            key={option.id}
                            className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${
                              selectedShipping?.id === option.id
                                ? 'border-primary bg-surface'
                                : 'border-border-subtle hover:border-muted'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <SelectionControl
                                type="radio"
                                name="shipping_method"
                                value={option.id}
                                checked={selectedShipping?.id === option.id}
                                onChange={() => setSelectedShipping(option)}
                              />
                              <div>
                                <p className="font-medium text-primary">
                                  {option.name}
                                </p>
                                <p className="text-body-sm text-muted">
                                  {option.description}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`font-medium ${isFree ? 'text-success' : 'text-primary'}`}
                            >
                              {isFree
                                ? 'FREE'
                                : displayMoney(displayPrice)}
                            </span>
                          </label>
                        );
                      })}

                      {cartTotal >= freeShippingThreshold &&
                        selectedShipping && (
                          <p className="text-body-sm text-success bg-success-bg p-3 border border-success">
                            🎉 You&apos;ve unlocked FREE shipping!
                          </p>
                        )}
                    </div>
                  ) : formData.country_code ? (
                    <div className="py-4 text-center text-muted">
                      No shipping options available for this country
                    </div>
                  ) : (
                    <div className="py-4 text-center text-muted">
                      Select your country to see available shipping methods
                    </div>
                  )}
                  {!shippingLoading && shippingPreviewMessage ? (
                    <p className="mt-3 text-body-xs text-muted">
                      {shippingPreviewMessage}
                    </p>
                  ) : null}
                </div>

                {/* D3: Gift Wrapping */}
                <div className="mt-8">
                  <h3 className="mb-4 border-b border-border-subtle pb-2 text-body-xl font-display text-primary">
                    Gift Options
                  </h3>
                  <label
                    className={`flex items-center justify-between p-4 border cursor-pointer transition-all ${
                      giftWrapping
                        ? 'border-primary bg-surface'
                        : 'border-border-subtle hover:border-muted'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-display-md">🎁</div>
                      <div>
                        <p className="text-body-sm font-medium text-primary">
                          Premium Gift Wrapping
                        </p>
                        <p className="text-body-xs font-light text-muted">
                          Signature Odhvica box with ribbon &amp; message card
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-body-sm font-medium text-muted">
                        +{displayMoney(giftWrappingFee)}
                      </span>
                      <div
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          giftWrapping ? 'bg-primary' : 'bg-border-subtle'
                        }`}
                      >
                        <HiddenCheckbox
                          checked={giftWrapping}
                          onChange={(e) => setGiftWrapping(e.target.checked)}
                          id="gift-wrapping-toggle"
                        />
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-surface-paper shadow transition-transform ${
                            giftWrapping ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </div>
                  </label>
                  {giftWrapping && (
                    <div className="mt-3 animate-fade-in">
                      <Textarea
                        label="Gift Message (Optional)"
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        placeholder="Write a personal message for the recipient..."
                        maxLength={200}
                        rows={3}
                        className="min-h-24 resize-none"
                      />
                      <p className="mt-1 text-right text-body-xs text-muted">
                        {giftMessage.length}/200
                      </p>
                    </div>
                  )}
                </div>

                {/* PHASE 1.5: Terms Acceptance */}
                <div className="mt-8 border-t border-border-subtle pt-6">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <SelectionControl
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="-ml-3 -mt-3"
                    />
                    <span className="text-body-sm text-muted group-hover:text-primary">
                      I agree to the{' '}
                      <Link
                        href={storefrontTrust.policyRoutes.terms}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-primary"
                      >
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link
                        href={storefrontTrust.policyRoutes.privacy}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-primary"
                      >
                        Privacy Policy
                      </Link>
                      ,{' '}
                      <Link
                        href={storefrontTrust.policyRoutes.shipping}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-primary"
                      >
                        Shipping
                      </Link>{' '}
                      and{' '}
                      <Link
                        href={storefrontTrust.policyRoutes.refundPolicy}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-primary"
                      >
                        Refund Policy
                      </Link>
                    </span>
                  </label>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !acceptTerms}
                  variant="secondary"
                  size="lg"
                  fullWidth
                  aria-live="polite"
                  aria-busy={loading}
                >
                  {loading ? 'Processing...' : 'Continue to Payment'}
                </Button>
              </form>
            ) : (
              <div>
                <h3 className="mb-6 border-b border-border-subtle pb-2 text-body-xl font-display text-primary">
                  Payment
                </h3>
                <p className="mb-4 text-body-sm text-muted">
                  {currency.toLowerCase() === 'inr'
                    ? storefrontTrust.paymentMethodsIndia
                    : storefrontTrust.paymentMethodsInternational}
                </p>

                {/* Razorpay — Indian customers (INR) */}
                {currency.toLowerCase() === 'inr' &&
                  process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
                  checkoutPaymentToken && (
                    <ErrorBoundary fallback={
                      <p className="text-body-sm text-error py-2">Payment failed to load. Please refresh.</p>
                    }>
                      <RazorpayButton
                        orderId={orderUUID}
                        checkoutToken={checkoutPaymentToken}
                        amount={finalTotal}
                        currency="INR"
                        customerName={`${formData.first_name} ${formData.last_name}`.trim()}
                        customerEmail={formData.email}
                        customerPhone={formData.phone}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                      />
                    </ErrorBoundary>
                  )}

                {/* PayPal — International customers (non-INR) */}
                {currency.toLowerCase() !== 'inr' &&
                  process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID && (
                    <ErrorBoundary fallback={
                      <p className="text-body-sm text-error py-2">PayPal failed to load. Please use card below.</p>
                    }>
                      <PayPalButton
                        orderId={orderUUID}
                        checkoutToken={checkoutPaymentToken}
                        currency={currency.toUpperCase()}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                      />
                    </ErrorBoundary>
                  )}

                {/* Stripe Express (Apple Pay / Google Pay) — shown when Stripe is the active provider */}
                {/* [STRIPE HIDDEN] - Disabled Stripe UI elements completely
                {clientSecret && (
                  <>
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border-subtle"></div>
                      </div>
                      <div className="relative flex justify-center text-body-sm">
                        <span className="bg-surface-paper px-2 text-muted">or express checkout</span>
                      </div>
                    </div>
                    <ErrorBoundary fallback={
                      <p className="py-2 text-body-sm text-muted">Express checkout unavailable.</p>
                    }>
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <ExpressCheckoutForm
                          orderId={orderId}
                          onSuccess={handlePaymentSuccess}
                          onError={handlePaymentError}
                        />
                      </Elements>
                    </ErrorBoundary>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border-subtle"></div>
                      </div>
                      <div className="relative flex justify-center text-body-sm">
                        <span className="bg-surface-paper px-2 text-muted">or pay with card</span>
                      </div>
                    </div>
                    <ErrorBoundary fallback={
                      <div className="p-4 border border-danger bg-danger-bg rounded text-body-sm text-error">
                        Payment form failed to load. Please refresh the page.
                      </div>
                    }>
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <PaymentForm
                          orderId={orderId}
                          onSuccess={handlePaymentSuccess}
                          onError={handlePaymentError}
                        />
                      </Elements>
                    </ErrorBoundary>
                  </>
                )}
                */}

                <Button
                  type="button"
                  onClick={() => setStep('shipping')}
                  variant="outline"
                  size="md"
                  fullWidth
                  className="mt-4"
                >
                  Back to Shipping
                </Button>

                <div className="mt-6 border border-border-subtle bg-surface p-4 text-body-xs text-muted">
                  <p className="font-medium text-primary">Payment and policy help</p>
                  <p className="mt-2">{storefrontTrust.paymentSummary}</p>
                  <p className="mt-2">{storefrontTrust.shippingSummary}</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Link
                      href={storefrontTrust.policyRoutes.shipping}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4"
                    >
                      Shipping
                    </Link>
                    <Link
                      href={storefrontTrust.policyRoutes.returns}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4"
                    >
                      Returns
                    </Link>
                    <Link
                      href={storefrontTrust.policyRoutes.paymentHelp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-4"
                    >
                      Payment Help
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Summary - Mobile on top, Desktop on right */}
        <div className="bg-surface p-4 md:p-8 lg:p-20 order-1 lg:order-2">
          <div className="max-w-lg mx-auto sticky top-24">
            <h2 className="mb-8 text-display-sm font-display text-primary">
              Order Summary
            </h2>

            <div className="space-y-6 mb-8">
              {items.map((item) => (
                <div key={item.variantId} className="flex gap-4">
                  <div className="relative w-20 h-24 bg-surface-paper border border-border-subtle">
                    {item.thumbnail ? (
                      <OptimizedImage
                        src={item.thumbnail}
                        alt={item.title}
                        fill
                        className="object-cover"
                        sizes="80px"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-border-subtle p-1 text-center text-body-xs text-muted">
                        No Image
                      </div>
                    )}
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-body-xs text-inverse">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-display text-primary">{item.title}</p>
                    <p className="mt-1 text-body-xs tracking-token-wider text-muted">
                      Qty: {item.quantity}
                    </p>
                    {(item.material || item.origin || item.sku) && (
                      <div className="mt-1 text-body-xs text-muted">
                        {item.material && <span>{item.material}</span>}
                        {item.material && (item.origin || item.sku) && (
                          <span> · </span>
                        )}
                        {item.origin && <span>{item.origin}</span>}
                        {item.origin && item.sku && <span> · </span>}
                        {item.sku && <span>{item.sku}</span>}
                      </div>
                    )}
                  </div>
                  <p className="font-medium text-primary">
                    {displayMoney(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            {/* Promo Code Input */}
            {step === 'shipping' && (
              <div className="mb-6 border-b border-border-subtle pb-6">
                <label className="mb-2 block text-body-xs font-bold tracking-token-wider text-muted">
                  Promo Code
                </label>
                <div className="flex gap-0 border-b border-border-subtle transition-colors focus-within:border-primary">
                  <Input
                    type="text"
                    aria-label="Promo code"
                    placeholder="ENTER CODE"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    containerClassName="flex-1"
                    className="h-auto border-0 bg-transparent px-0 py-2 font-display  focus:border-transparent"
                  />
                  <Button
                    type="button"
                    onClick={handleApplyPromo}
                    disabled={promoLoading || !promoCode}
                    variant="ghost"
                    size="sm"
                    className="px-2"
                  >
                    {promoLoading ? 'Adjusting...' : 'Apply'}
                  </Button>
                </div>
                {promoMessage && (
                  <p
                    className={`text-body-xs mt-2 ${promoMessage.type === 'success' ? 'text-success' : 'text-error'}`}
                  >
                    {promoMessage.text}
                  </p>
                )}
              </div>
            )}

            <div className="border-t border-border-subtle pt-6 space-y-3 text-body-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>
                  {displayMoney(cartTotal)}
                </span>
              </div>
              {discount && (
                <div className="flex justify-between text-success">
                  <div className="flex items-center gap-2">
                    <span>Discount</span>
                    <span className="rounded bg-surface-soft px-1 py-0.5 text-body-xs text-muted">
                      {discount.code}
                    </span>
                  </div>
                  <span>
                    -
                    {displayMoney(discount.amount)}
                  </span>
                </div>
              )}
              {/* PHASE 1.3: Shipping Cost Display */}
              {step === 'payment' || selectedShipping ? (
                <div className="flex justify-between text-muted">
                  <span>
                    Shipping
                    {selectedShipping ? ` (${selectedShipping.name})` : ''}
                  </span>
                  <span className={shippingCost === 0 ? 'text-success' : ''}>
                    {shippingCost === 0
                      ? 'FREE'
                       : confirmedOrderTotals
                         ? displayConfirmedMoney(shippingCost)
                         : displayMoney(shippingCost)}
                  </span>
                </div>
              ) : (
                <div className="flex justify-between text-muted">
                  <span>Shipping</span>
                  <span>Calculated at next step</span>
                </div>
              )}
              {/* PHASE 1.4: Tax Display */}
              {(taxLoading || displayedTaxAmount > 0) && (
                <div className="flex justify-between text-muted">
                  <span>{taxName}</span>
                  <span>
                    {taxLoading ? (
                      <span className="text-muted">Calculating...</span>
                    ) : (
                      confirmedOrderTotals
                        ? displayConfirmedMoney(displayedTaxAmount)
                        : displayMoney(displayedTaxAmount)
                    )}
                  </span>
                </div>
              )}
              {/* Gift Wrapping line */}
              {giftWrapping && (
                <div className="flex justify-between text-muted">
                  <span className="flex items-center gap-1.5">
                    <span>🎁</span> Gift Wrapping
                  </span>
                  <span>
                    {confirmedOrderTotals
                      ? displayConfirmedMoney(giftWrappingCost)
                      : displayMoney(giftWrappingCost)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t border-border-subtle pt-4 text-body-xl font-display text-primary">
                <span>Total</span>
                <span>
                  {confirmedOrderTotals
                    ? displayConfirmedMoney(finalTotal)
                    : displayMoney(finalTotal)}
                </span>
              </div>
            </div>

            <div className="mt-8 flex gap-3 border border-border-subtle bg-surface-paper p-4 text-body-xs text-muted">
              <ShieldCheck size={32} className="shrink-0 text-muted" />
              <p>
                Every purchase is backed by our Authenticity Guarantee. We
                ensure the highest standards of craftsmanship.
              </p>
            </div>

            {/* PHASE 7.3: Payment Icons */}
            <div className="mt-6">
              <p className="mb-3 text-center text-body-xs tracking-token-wider text-muted">
                Accepted Payment Methods
              </p>
              <PaymentIcons />
            </div>

            {/* PHASE 7.3: Security Badges */}
            <div className="mt-6 border-t border-border-subtle pt-6">
              <SecurityBadges />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
