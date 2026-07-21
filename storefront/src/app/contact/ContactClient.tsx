'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react';

import {
  HighlightBox,
  InfoCard,
} from '@/components/content/ContentPageSystem';
import {
  Button,
  ButtonLink,
  Card,
  EmptyState,
  Input,
  StatusBanner,
  Textarea,
} from '@/design-system';
import { storefrontTrust } from '@/config/storefront-trust';

const reasonLabels: Record<string, string> = {
  payment: 'Payment Support',
  returns: 'Returns Support',
  tracking: 'Tracking Support',
  visit: 'Atelier / Visit Enquiry',
  'order-support': 'Order Support',
};

function buildReasonPrefill(reason: string | null, orderReference: string | null) {
  if (!reason && !orderReference) return '';

  const orderLine = orderReference
    ? `Order reference: #${orderReference}\n`
    : '';

  switch (reason) {
    case 'payment':
      return `${orderLine}I need help confirming whether my payment attempt went through.\n\nPayment method used:\nPayment time:\nWhat happened:\n`;
    case 'returns':
      return `${orderLine}I need help with a return or refund request.\n\nItem(s):\nReason:\nCurrent item condition:\n`;
    case 'tracking':
      return `${orderLine}I need help with order tracking or shipment visibility.\n\nWhat I can see right now:\nWhat I need help with:\n`;
    case 'visit':
      return `I want help with an atelier visit, stockist enquiry, or in-person buying request.\n\nCity:\nWhat I want to shop:\nPreferred timing:\n`;
    case 'order-support':
      return `${orderLine}I need general support for this order.\n\nIssue summary:\nWhat I need help with:\n`;
    default:
      return orderReference ? `I need help with order #${orderReference}.\n\n` : '';
  }
}

export function ContactClient() {
  const searchParams = useSearchParams();
  const orderReference = searchParams.get('order');
  const emailPrefill = searchParams.get('email');
  const reason = searchParams.get('reason');
  const [formData, setFormData] = useState(() => ({
    firstName: '',
    lastName: '',
    email: emailPrefill || '',
    message: buildReasonPrefill(reason, orderReference),
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'firstName':
        if (!value.trim()) return 'First name is required';
        if (value.trim().length < 2)
          return 'First name must be at least 2 characters';
        return '';
      case 'lastName':
        if (!value.trim()) return 'Last name is required';
        if (value.trim().length < 2)
          return 'Last name must be at least 2 characters';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!emailRegex.test(value))
          return 'Please enter a valid email address';
        return '';
      case 'message':
        if (!value.trim()) return 'Message is required';
        if (value.trim().length < 10)
          return 'Message must be at least 10 characters';
        if (value.trim().length > 2000)
          return 'Message must be less than 2000 characters';
        return '';
      default:
        return '';
    }
  };

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const isFormValid =
    Object.values(errors).every((err) => err === '') &&
    Object.values(formData).every((val) => val.trim() !== '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const res = await fetch(`/api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          orderReference: orderReference || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('success');
        setFormData({ firstName: '', lastName: '', email: '', message: '' });
      } else {
        setStatus('error');
        setErrorMessage(
          data.error || 'Failed to send message. Please try again.'
        );
      }
    } catch {
      setStatus('error');
      setErrorMessage(
        'Network error. Please check your connection and try again.'
      );
    }
  };

  return (
    <section className="content-page-band">
        <div className="content-shell grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16 py-[var(--ds-space-xl)] md:py-[var(--ds-space-2xl)] lg:py-[var(--ds-space-3xl)]">
          <div className="space-y-6">
            <div className="info-grid lg:grid-cols-1">
              <InfoCard title="Email Us" eyebrow="Support">
                <div className="flex items-start gap-3">
                  <Mail size={18} aria-hidden="true" />
                  <div>
                    <p>{storefrontTrust.supportEmail}</p>
                    <p>{storefrontTrust.supportHours}</p>
                  </div>
                </div>
              </InfoCard>
              <InfoCard title="Call or WhatsApp" eyebrow="Care">
                <div className="flex items-start gap-3">
                  <Phone size={18} aria-hidden="true" />
                  <div>
                    <p>{storefrontTrust.supportPhone}</p>
                    <p>{storefrontTrust.supportHours}</p>
                  </div>
                </div>
              </InfoCard>
              <InfoCard title="Business Address" eyebrow="Jaipur">
                <div className="flex items-start gap-3">
                  <MapPin size={18} aria-hidden="true" />
                  <div>
                    {storefrontTrust.addressLines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>
              </InfoCard>
            </div>
            <HighlightBox title="Before you write">
              Include your order reference, purchase email, and clear photos if
              your message is about a return, defect, or delivery issue.
            </HighlightBox>
          </div>

          <Card className="p-6 shadow-[0_24px_80px_rgba(var(--ds-text-primary-rgb),0.06)] md:p-10">
            {orderReference || reason ? (
              <div className="mb-6 border border-border-subtle bg-parchment px-4 py-3 text-body-sm text-secondary">
                {reason ? (
                  <span>{reasonLabels[reason] || 'Support Request'}</span>
                ) : null}
                {reason && orderReference ? <span> for </span> : null}
                {orderReference ? (
                  <span>
                    order <strong>#{orderReference}</strong>
                  </span>
                ) : null}
              </div>
            ) : null}

            {status === 'success' ? (
              <EmptyState
                icon={<CheckCircle size={56} />}
                title="Message Sent"
                description={
                  orderReference
                    ? `Your support request for order #${orderReference} is with our concierge team.`
                    : `Thank you for reaching out. We'll get back to you soon.`
                }
                className="border-0 py-12"
                actions={
                <Button
                  onClick={() => setStatus('idle')}
                  variant="secondary"
                  size="md"
                >
                  Send Another Message
                </Button>
                }
              />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <Input
                    type="text"
                    name="firstName"
                    label="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    error={touched.firstName ? errors.firstName : undefined}
                  />
                  <Input
                    type="text"
                    name="lastName"
                    label="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    error={touched.lastName ? errors.lastName : undefined}
                  />
                </div>

                <Input
                  type="email"
                  name="email"
                  label="Email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  error={touched.email ? errors.email : undefined}
                />

                <Textarea
                  name="message"
                  label="Message"
                  value={formData.message}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  minLength={10}
                  rows={6}
                  error={touched.message ? errors.message : undefined}
                />

                <div className="border border-border-subtle bg-parchment px-4 py-4 text-body-sm leading-token-relaxed text-secondary">
                  For payment or return questions, the guided help pages may
                  answer faster than a general message.
                  <div className="mt-3 flex flex-wrap gap-3">
                    <ButtonLink
                      href={storefrontTrust.policyRoutes.paymentHelp}
                      variant="outline"
                      size="sm"
                    >
                      Payment Help
                    </ButtonLink>
                    <ButtonLink
                      href={storefrontTrust.policyRoutes.returns}
                      variant="outline"
                      size="sm"
                    >
                      Returns Help
                    </ButtonLink>
                  </div>
                </div>

                {status === 'error' && (
                  <StatusBanner tone="danger" icon={<AlertCircle size={16} aria-hidden="true" />}>
                    {errorMessage}
                  </StatusBanner>
                )}

                <Button
                  type="submit"
                  disabled={status === 'loading' || !isFormValid}
                  variant="secondary"
                  size="lg"
                  fullWidth
                  leadingIcon={
                    status === 'loading' ? (
                      <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                    ) : null
                  }
                >
                  {status === 'loading' ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            )}
          </Card>
        </div>
    </section>
  );
}
