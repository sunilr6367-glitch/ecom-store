'use client';


import { Heading } from '@/design-system';
import { MediaOverlay } from '@/design-system';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Package,
  TrendingUp,
  DollarSign,
  Globe,
  CheckCircle,
  Mail,
  Phone,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { Input } from '@/design-system';
import { Textarea } from '@/design-system';
import { Select } from '@/design-system';
import { Button } from '@/design-system';

interface TierData {
  id: string;
  name: string;
  slug: string;
  discount_percent: number;
  default_moq: number;
  payment_terms: string;
  description: string | null;
}

export default function WholesalePage() {
  const [formData, setFormData] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    country: '',
    business_type: '',
    estimated_order_volume: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tiers, setTiers] = useState<TierData[]>([]);
  const [tiersLoading, setTiersLoading] = useState(true);

  // Fetch tiers from API on mount
  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const data = await api.getWholesaleTiers();
        if (data.tiers && data.tiers.length > 0) {
          setTiers(data.tiers);
        } else {
          // Fallback to default tiers if API returns empty
          setTiers([
            { id: '1', name: 'Starter', slug: 'starter', discount_percent: 20, default_moq: 50, payment_terms: 'net_30', description: 'Perfect for boutiques' },
            { id: '2', name: 'Growth', slug: 'growth', discount_percent: 30, default_moq: 200, payment_terms: 'net_45', description: 'For established retailers' },
            { id: '3', name: 'Enterprise', slug: 'enterprise', discount_percent: 40, default_moq: 500, payment_terms: 'net_60', description: 'For distributors & chains' },
          ]);
        }
      } catch (err) {
        console.error('Error fetching tiers:', err);
        // Fallback to default tiers
        setTiers([
          { id: '1', name: 'Starter', slug: 'starter', discount_percent: 20, default_moq: 50, payment_terms: 'net_30', description: 'Perfect for boutiques' },
          { id: '2', name: 'Growth', slug: 'growth', discount_percent: 30, default_moq: 200, payment_terms: 'net_45', description: 'For established retailers' },
          { id: '3', name: 'Enterprise', slug: 'enterprise', discount_percent: 40, default_moq: 500, payment_terms: 'net_60', description: 'For distributors & chains' },
        ]);
      } finally {
        setTiersLoading(false);
      }
    };

    fetchTiers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Sanitize data: convert empty strings to undefined for optional fields
      const payload = {
        ...formData,
        estimated_order_volume: formData.estimated_order_volume || undefined,
        message: formData.message || undefined,
      };

      const response = await fetch(`/api/wholesale`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit inquiry');
      }

      const _data = await response.json();

      setSubmitted(true);
      setFormData({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        country: '',
        business_type: '',
        estimated_order_volume: '',
        message: '',
      });
    } catch {
      console.error('Error submitting inquiry');
      setError('Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-surface-paper">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-[var(--ds-text-primary)] via-[var(--ds-text-secondary)] to-[var(--ds-warning-text)] py-16 pt-32 text-inverse md:py-20 lg:py-32">
          <MediaOverlay variant="pattern" />
          <div className="ds-page-container relative z-10 mx-auto max-w-page">
            <div className="max-w-3xl">
              <span className="text-accent-gold text-body-xs font-bold  tracking-token-wider block mb-4">
                B2B Partnership
              </span>
              <Heading role="page" className="text-display-xl md:text-display-xl font-display mb-6 leading-token-tight">
                Wholesale & <br />
                Bulk Orders
              </Heading>
              <p className="text-display-sm text-disabled font-light leading-token-relaxed mb-8">
                Partner with Odhvica to bring authentic artisanal luxury to
                your customers. Exclusive pricing, dedicated support, and global
                logistics for retailers and distributors worldwide.
              </p>
              <div className="flex flex-wrap gap-4">
                <a
                  href="#inquiry"
                  className="bg-warning text-primary px-8 py-4 font-bold  tracking-token-wider text-body-xs hover:bg-accent-gold transition-colors"
                >
                  Request Pricing
                </a>
                <a
                  href="#benefits"
                  className="border-2 border-surface-paper text-inverse px-8 py-4 font-bold  tracking-token-wider text-body-xs hover:bg-surface-paper hover:text-primary transition-colors"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="benefits" className="bg-parchment py-token-xl md:py-token-2xl lg:py-token-3xl">
          <div className="ds-page-container mx-auto max-w-page">
            <div className="text-center mb-16">
              <h2 className="text-display-lg font-display text-primary mb-4">
                Why Partner With Odhvica?
              </h2>
              <p className="text-secondary font-light max-w-2xl mx-auto">
                We provide everything you need to offer premium artisanal
                products to your market.
              </p>
            </div>

            <div className="grid gap-x-4 gap-y-8 md:grid-cols-2 md:gap-x-6 md:gap-y-12 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-16">
              <div className="bg-surface-paper p-8 text-center">
                <div className="w-16 h-16 bg-warning-bg rounded-full flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="text-warning" size={28} />
                </div>
                <h3 className="text-body-xl font-bold text-primary mb-3">
                  Competitive Pricing
                </h3>
                <p className="text-body-sm text-secondary font-light leading-token-relaxed">
                  Volume-based discounts starting at 20% off retail. Tiered
                  pricing for larger orders.
                </p>
              </div>

              <div className="bg-surface-paper p-8 text-center">
                <div className="w-16 h-16 bg-warning-bg rounded-full flex items-center justify-center mx-auto mb-6">
                  <Package className="text-warning" size={28} />
                </div>
                <h3 className="text-body-xl font-bold text-primary mb-3">
                  Flexible MOQ
                </h3>
                <p className="text-body-sm text-secondary font-light leading-token-relaxed">
                  Minimum order quantities starting from just 50 units. Mix and
                  match across collections.
                </p>
              </div>

              <div className="bg-surface-paper p-8 text-center">
                <div className="w-16 h-16 bg-warning-bg rounded-full flex items-center justify-center mx-auto mb-6">
                  <Globe className="text-warning" size={28} />
                </div>
                <h3 className="text-body-xl font-bold text-primary mb-3">
                  Global Shipping
                </h3>
                <p className="text-body-sm text-secondary font-light leading-token-relaxed">
                  DDP shipping to 150+ countries. Consolidated shipments and
                  customs support included.
                </p>
              </div>

              <div className="bg-surface-paper p-8 text-center">
                <div className="w-16 h-16 bg-warning-bg rounded-full flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="text-warning" size={28} />
                </div>
                <h3 className="text-body-xl font-bold text-primary mb-3">
                  Marketing Support
                </h3>
                <p className="text-body-sm text-secondary font-light leading-token-relaxed">
                  High-res product images, brand assets, and storytelling
                  content for your channels.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Tiers */}
        <section className="bg-surface-paper py-token-xl md:py-token-2xl lg:py-token-3xl">
          <div className="ds-page-container mx-auto max-w-page">
            <div className="text-center mb-16">
              <h2 className="text-display-lg font-display text-primary mb-4">
                Wholesale Pricing Tiers
              </h2>
              <p className="text-secondary font-light">
                Volume-based discounts to maximize your margins
              </p>
            </div>

            {tiersLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-warning"></div>
              </div>
            ) : (
              <div className={`grid gap-8 ${tiers.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-' + tiers.length}`}>
                {tiers.map((tier, index) => (
                  <div
                    key={tier.id}
                    className={`border p-8 ${index === 1 ? 'border-2 border-warning p-8 relative bg-warning-bg' : 'border-border-subtle'}`}
                  >
                    {index === 1 && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-warning text-inverse text-body-xs font-bold px-4 py-1  tracking-token-wider">
                        Most Popular
                      </div>
                    )}
                    <div className="mb-6">
                      <h3 className="text-display-sm font-bold text-primary mb-2">
                        {tier.name}
                      </h3>
                      <p className="text-body-sm text-muted mb-4">
                        {tier.description || 'Wholesale pricing tier'}
                      </p>
                      <div className="text-display-lg font-bold text-primary">
                        {tier.discount_percent}% OFF
                      </div>
                      <p className="text-body-xs text-muted mt-1">Retail pricing</p>
                    </div>
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start gap-2 text-body-sm">
                        <CheckCircle
                          size={16}
                          className="text-success mt-0.5 flex-shrink-0"
                        />
                        <span>MOQ: {tier.default_moq} units</span>
                      </li>
                      <li className="flex items-start gap-2 text-body-sm">
                        <CheckCircle
                          size={16}
                          className="text-success mt-0.5 flex-shrink-0"
                        />
                        <span className="capitalize">{tier.payment_terms.replace('_', ' ')} payment terms</span>
                      </li>
                      {index === 1 && (
                        <li className="flex items-start gap-2 text-body-sm">
                          <CheckCircle
                            size={16}
                            className="text-success mt-0.5 flex-shrink-0"
                          />
                          <span>Dedicated account manager</span>
                        </li>
                      )}
                      {index === 2 && (
                        <>
                          <li className="flex items-start gap-2 text-body-sm">
                            <CheckCircle
                              size={16}
                              className="text-success mt-0.5 flex-shrink-0"
                            />
                            <span>White-glove logistics</span>
                          </li>
                          <li className="flex items-start gap-2 text-body-sm">
                            <CheckCircle
                              size={16}
                              className="text-success mt-0.5 flex-shrink-0"
                            />
                            <span>Custom product development</span>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Process Section */}
        <section className="bg-parchment py-token-xl md:py-token-2xl lg:py-token-3xl">
          <div className="ds-page-container mx-auto max-w-page">
            <div className="text-center mb-16">
              <h2 className="text-display-lg font-display text-primary mb-4">
                How It Works
              </h2>
              <p className="text-secondary font-light">
                Simple 4-step process to start ordering
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  step: '01',
                  title: 'Submit Inquiry',
                  desc: 'Fill out the form below with your business details',
                },
                {
                  step: '02',
                  title: 'Review & Quote',
                  desc: 'Our team reviews and sends custom pricing within 24hrs',
                },
                {
                  step: '03',
                  title: 'Sample Order',
                  desc: 'Place a sample order to evaluate quality and fit',
                },
                {
                  step: '04',
                  title: 'Bulk Orders',
                  desc: 'Start ordering with flexible payment and shipping terms',
                },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="text-display-xl font-bold text-warning-bg mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-body-xl font-bold text-primary mb-2">
                    {item.title}
                  </h3>
                  <p className="text-body-sm text-secondary font-light">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Inquiry Form */}
        <section id="inquiry" className="bg-surface-paper py-token-xl md:py-token-2xl lg:py-token-3xl">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-display-lg font-display text-primary mb-4">
                Request Wholesale Pricing
              </h2>
              <p className="text-secondary font-light">
                Fill out the form and our team will contact you within 24 hours
              </p>
            </div>

            {submitted ? (
              <div className="bg-success-bg border border-success p-12 text-center">
                <CheckCircle
                  size={48}
                  className="text-success mx-auto mb-4"
                />
                <h3 className="text-display-md font-bold text-primary mb-2">
                  Thank You!
                </h3>
                <p className="text-secondary">
                  We&apos;ve received your inquiry and will respond within 24
                  hours.
                </p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="bg-danger-bg border border-danger p-4 mb-6 text-center rounded">
                    <p className="text-error font-medium">{error}</p>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Input
                        type="text"
                        label="Company Name"
                        required
                        value={formData.company_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            company_name: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Input
                        type="text"
                        label="Contact Name"
                        required
                        value={formData.contact_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contact_name: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Input
                        type="email"
                        label="Email"
                        required
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Input
                        type="tel"
                        label="Phone"
                        required
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Input
                        type="text"
                        label="Country"
                        required
                        value={formData.country}
                        onChange={(e) =>
                          setFormData({ ...formData, country: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Select
                        label="Business Type"
                        required
                        value={formData.business_type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            business_type: e.target.value,
                          })
                        }
                      >
                        <option value="">Select...</option>
                        <option value="boutique">
                          Boutique / Retail Store
                        </option>
                        <option value="online">Online Retailer</option>
                        <option value="distributor">Distributor</option>
                        <option value="chain">Retail Chain</option>
                        <option value="other">Other</option>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Select
                      label="Estimated Monthly Order Volume"
                      value={formData.estimated_order_volume}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          estimated_order_volume: e.target.value,
                        })
                      }
                    >
                      <option value="">Select...</option>
                      <option value="50-100">50-100 units</option>
                      <option value="100-200">100-200 units</option>
                      <option value="200-500">200-500 units</option>
                      <option value="500+">500+ units</option>
                    </Select>
                  </div>

                  <div>
                    <Textarea
                      label="Message"
                      rows={4}
                      placeholder="Tell us about your business and what products you're interested in..."
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    variant="secondary"
                    size="lg"
                    fullWidth
                    trailingIcon={!loading ? <ArrowRight size={16} /> : null}
                  >
                    {loading ? 'Submitting...' : 'Submit Inquiry'}
                  </Button>
                </form>
              </>
            )}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-16 bg-primary text-inverse">
          <div className="ds-page-container mx-auto max-w-page">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <Mail size={32} className="mx-auto mb-4 text-accent-gold" />
                <h3 className="font-bold mb-2">Email Us</h3>
                <a
                  href="mailto:wholesale@odhvica.com"
                  className="text-muted hover:text-inverse text-body-sm"
                >
                  wholesale@odhvica.com
                </a>
              </div>
              <div>
                <Phone size={32} className="mx-auto mb-4 text-accent-gold" />
                <h3 className="font-bold mb-2">Call Us</h3>
                <a
                  href="tel:+1234567890"
                  className="text-muted hover:text-inverse text-body-sm"
                >
                  +1 (234) 567-890
                </a>
              </div>
              <div>
                <FileText size={32} className="mx-auto mb-4 text-accent-gold" />
                <h3 className="font-bold mb-2">Download Catalog</h3>
                <a href="#" className="text-muted hover:text-inverse text-body-sm">
                  2024 Wholesale Catalog (PDF)
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
