'use client';


import { Heading } from '@/design-system';
import { SelectionControl } from '@/design-system';
import { useAuth } from '@/context/auth-context';
import { useWholesaleCart } from '@/context/wholesale-cart-context';
import { useWholesale } from '@/context/wholesale-context';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Building2,
  CheckCircle,
  FileText,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { OptimizedImage } from '@/design-system';
import { CountrySelect } from '@/design-system';
import { Input } from '@/design-system';
import { Textarea } from '@/design-system';
import { Button, ButtonLink } from '@/design-system';
import { Card } from '@/design-system';

const PAYMENT_TERMS = [
  {
    value: 'net_30',
    label: 'Net 30',
    description: 'Payment due within 30 days',
  },
  {
    value: 'net_45',
    label: 'Net 45',
    description: 'Payment due within 45 days',
  },
  {
    value: 'net_60',
    label: 'Net 60',
    description: 'Payment due within 60 days',
  },
];

export default function WholesaleCheckoutPage() {
  const { customer } = useAuth();
  const { items, cartSummary, validation, isWholesaleCart, validateCart } =
    useWholesaleCart();
  const { wholesaleInfo } = useWholesale();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState('');

  const [formData, setFormData] = useState({
    po_number: '',
    payment_terms: 'net_30',
    notes: '',
    shipping_address: {
      first_name: '',
      last_name: '',
      company: '',
      address_1: '',
      address_2: '',
      city: '',
      postal_code: '',
      province: '',
      country_code: 'US',
      phone: '',
    },
  });

  // Redirect if not wholesale customer
  useEffect(() => {
    if (!isWholesaleCart && !loading) {
      router.push('/checkout');
    }
  }, [isWholesaleCart, router, loading]);

  // Validate cart on load
  useEffect(() => {
    validateCart();
  }, [validateCart]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate cart
    const validationResult = await validateCart();
    if (!validationResult.isValid) {
      setError('Please fix cart validation errors before proceeding');
      setLoading(false);
      return;
    }

    try {
      const orderData = {
        email: customer?.email || '',
        ...formData,
        items: items.map((item) => ({
          variant_id: item.variantId,
          quantity: item.quantity,
          unit_price: item.finalPrice || item.price,
        })),
        is_wholesale: true,
        wholesale_tier: wholesaleInfo.tier,
        subtotal: cartSummary.subtotal,
        tier_discount: cartSummary.tierDiscount,
        bulk_discount: cartSummary.bulkDiscount,
        total: cartSummary.total,
      };

      const result = await api.createWholesaleOrder(orderData);

      if (result.success) {
        setOrderPlaced(true);
        setOrderId(result.order.id);
      } else {
        setError(result.error || 'Failed to place order');
      }
    } catch (err: unknown) {
      console.error('Order error:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while placing your order'
      );
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-parchment py-20">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="p-8 text-center shadow-lg">
            <div className="w-20 h-20 bg-success-bg rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <Heading role="page" className="text-display-md font-bold text-primary mb-4">
              Order Submitted Successfully!
            </Heading>
            <p className="text-secondary mb-2">
              Your wholesale order has been received.
            </p>
            <p className="text-muted mb-6">
              Order ID: <span className="font-mono">{orderId}</span>
            </p>

            <div className="bg-parchment p-4 rounded-lg mb-6">
              <p className="text-body-sm text-secondary">
                Payment terms:{' '}
                <strong>
                  {
                    PAYMENT_TERMS.find(
                      (t) => t.value === formData.payment_terms
                    )?.label
                  }
                </strong>
              </p>
              <p className="text-body-sm text-muted mt-1">
                An invoice will be sent to your email shortly.
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <ButtonLink
                href="/account/orders"
                variant="secondary"
                size="md"
              >
                View Orders
              </ButtonLink>
              <ButtonLink
                href="/products"
                variant="outline"
                size="md"
              >
                Continue Shopping
              </ButtonLink>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-parchment py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <Heading role="page" className="text-display-md font-bold text-primary mb-4">
            Your cart is empty
          </Heading>
          <Link
            href="/products"
            className="text-secondary hover:text-primary underline"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment py-token-xl md:py-token-2xl lg:py-token-3xl">
      <div className="ds-page-container mx-auto max-w-page">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/cart"
            className="flex items-center text-secondary hover:text-primary mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Link>
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-secondary" />
            <div>
              <Heading role="page" className="text-display-md font-bold text-primary">
                Wholesale Checkout
              </Heading>
              <p className="text-secondary text-body-sm">
                {wholesaleInfo.companyName} - {wholesaleInfo.tier} tier
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-16">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Validation Errors */}
              {validation.errors.length > 0 && (
                <div className="bg-danger-bg border border-danger rounded-lg p-4">
                  <div className="flex items-center gap-2 text-error mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <h3 className="font-bold">Cart Validation Errors</h3>
                  </div>
                  <ul className="text-body-sm text-error space-y-1">
                    {validation.errors.map((error, idx) => (
                      <li key={idx}>{error.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* PO Number */}
              <Card className="p-6 shadow-sm">
                <h2 className="text-body-xl font-bold text-primary mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Purchase Order
                </h2>
                <div className="space-y-4">
                  <Input
                    type="text"
                    label="PO Number"
                    value={formData.po_number}
                    onChange={(e) =>
                      setFormData({ ...formData, po_number: e.target.value })
                    }
                    placeholder="Enter your PO number"
                  />
                </div>
              </Card>

              {/* Payment Terms */}
              <Card className="p-6 shadow-sm">
                <h2 className="text-body-xl font-bold text-primary mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Payment Terms
                </h2>
                <div className="space-y-3">
                  {PAYMENT_TERMS.map((term) => (
                    <label
                      key={term.value}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.payment_terms === term.value
                          ? 'border-primary bg-parchment'
                          : 'border-border-subtle hover:border-border'
                      }`}
                    >
                      <SelectionControl
                        type="radio"
                        name="payment_terms"
                        value={term.value}
                        checked={formData.payment_terms === term.value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            payment_terms: e.target.value,
                          })
                        }
                      />
                      <div className="ml-3">
                        <p className="font-medium text-primary">
                          {term.label}
                        </p>
                        <p className="text-body-sm text-muted">
                          {term.description}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </Card>

              {/* Shipping Address */}
              <Card className="p-6 shadow-sm">
                <h2 className="text-body-xl font-bold text-primary mb-4">
                  Shipping Address
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="text"
                      label="First Name"
                      required
                      value={formData.shipping_address.first_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shipping_address: {
                            ...formData.shipping_address,
                            first_name: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Input
                      type="text"
                      label="Last Name"
                      required
                      value={formData.shipping_address.last_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shipping_address: {
                            ...formData.shipping_address,
                            last_name: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      type="text"
                      label="Company"
                      value={formData.shipping_address.company}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shipping_address: {
                            ...formData.shipping_address,
                            company: e.target.value,
                          },
                        })
                      }
                      placeholder="Company name (optional)"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      type="text"
                      label="Address"
                      required
                      value={formData.shipping_address.address_1}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shipping_address: {
                            ...formData.shipping_address,
                            address_1: e.target.value,
                          },
                        })
                      }
                      placeholder="Street address"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      type="text"
                      label="Address line 2"
                      value={formData.shipping_address.address_2}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shipping_address: {
                            ...formData.shipping_address,
                            address_2: e.target.value,
                          },
                        })
                      }
                      placeholder="Apartment, suite, etc. (optional)"
                    />
                  </div>
                  <div>
                    <Input
                      type="text"
                      label="City"
                      required
                      value={formData.shipping_address.city}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shipping_address: {
                            ...formData.shipping_address,
                            city: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Input
                      type="text"
                      label="Postal Code"
                      required
                      value={formData.shipping_address.postal_code}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shipping_address: {
                            ...formData.shipping_address,
                            postal_code: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <p className="form-label-typography mb-1.5  text-muted">
                      Country
                    </p>
                    <CountrySelect
                      name="shipping_country"
                      value={formData.shipping_address.country_code}
                      onChange={(value) =>
                        setFormData({
                          ...formData,
                          shipping_address: {
                            ...formData.shipping_address,
                            country_code: value,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <Input
                      type="tel"
                      label="Phone"
                      value={formData.shipping_address.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          shipping_address: {
                            ...formData.shipping_address,
                            phone: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </Card>

              {/* Order Notes */}
              <Card className="p-6 shadow-sm">
                <h2 className="text-body-xl font-bold text-primary mb-4">
                  Order Notes
                </h2>
                <Textarea
                  label="Order Notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={4}
                  placeholder="Any special instructions for your order..."
                />
              </Card>

              {error && (
                <div className="bg-danger-bg border border-danger text-error px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || validation.errors.length > 0}
                variant="secondary"
                size="lg"
                fullWidth
              >
                {loading ? 'Processing...' : 'Submit Wholesale Order'}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 p-6 shadow-sm">
              <h2 className="text-body-xl font-bold text-primary mb-4">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.variantId} className="flex gap-4">
                    {item.thumbnail && (
                      <div className="relative w-16 h-16 flex-shrink-0">
                        <OptimizedImage
                          src={item.thumbnail}
                          alt={item.title}
                          fill
                          className="object-cover rounded-sm"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-primary text-body-sm">
                        {item.title}
                      </p>
                      <p className="text-body-xs text-muted">SKU: {item.sku}</p>
                      <p className="text-body-xs text-secondary mt-1">
                        Qty: {item.quantity} x $
                        {((item.finalPrice || item.price) / 100).toFixed(2)}
                      </p>
                      {item.moq && item.moq > 1 && (
                        <p className="text-body-xs text-warning">
                          MOQ: {item.moq}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-primary">
                        $
                        {(
                          ((item.finalPrice || item.price) * item.quantity) /
                          100
                        ).toFixed(2)}
                      </p>
                      {(item.tierDiscount ?? 0) > 0 && (
                        <p className="text-body-xs text-success">
                          -{item.tierDiscount}% tier
                        </p>
                      )}
                      {(item.bulkDiscount ?? 0) > 0 && (
                        <p className="text-body-xs text-info">
                          -{item.bulkDiscount}% bulk
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border-subtle pt-4 space-y-2">
                <div className="flex justify-between text-body-sm">
                  <span className="text-secondary">Subtotal</span>
                  <span className="font-medium">
                    ${(cartSummary.subtotal / 100).toFixed(2)}
                  </span>
                </div>
                {cartSummary.tierDiscount > 0 && (
                  <div className="flex justify-between text-body-sm text-success">
                    <span>Tier Discount</span>
                    <span>-${(cartSummary.tierDiscount / 100).toFixed(2)}</span>
                  </div>
                )}
                {cartSummary.bulkDiscount > 0 && (
                  <div className="flex justify-between text-body-sm text-info">
                    <span>Bulk Discount</span>
                    <span>-${(cartSummary.bulkDiscount / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-body-xl font-bold pt-2 border-t border-border-subtle">
                  <span>Total</span>
                  <span>${(cartSummary.total / 100).toFixed(2)}</span>
                </div>
                {cartSummary.savings > 0 && (
                  <p className="text-body-sm text-success text-center">
                    You saved ${(cartSummary.savings / 100).toFixed(2)}!
                  </p>
                )}
              </div>

              <div className="mt-6 p-4 bg-parchment rounded-lg">
                <p className="text-body-xs text-secondary text-center">
                  Payment terms:{' '}
                  <strong>
                    {
                      PAYMENT_TERMS.find(
                        (t) => t.value === formData.payment_terms
                      )?.label
                    }
                  </strong>
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
