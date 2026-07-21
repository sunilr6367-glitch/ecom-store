'use client';


import { Heading } from '@/design-system';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/design-system';
import { Button } from '@/design-system';
import { Card } from '@/design-system';
import { StatusBanner } from '@/design-system';

export default function ProfilePage() {
  const { customer, loading, setUser } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!loading && !customer) {
      router.push('/login');
    }
    if (customer) {
      setFormData({
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        phone: customer.phone || '',
        email: customer.email || '', // Readonly
      });
    }
  }, [loading, customer, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await api.updateCustomer({
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
      });
      setUser(res.customer);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !customer)
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Loader2 className="animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-parchment py-token-xl md:py-token-2xl lg:py-token-3xl">
      <div className="mx-auto max-w-2xl px-home-mobile md:px-home-tablet lg:px-home-desktop">
        <Link
          href="/account"
          className="account-muted mb-8 inline-flex items-center gap-2 transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} /> Back to Account
        </Link>

        <Card className="p-8 shadow-sm">
          <Heading role="page" className="account-detail-title mb-6">
            Edit Profile
          </Heading>

          {message && (
            <StatusBanner
              tone={message.type === 'success' ? 'success' : 'danger'}
              className="account-alert mb-6"
            >
              {message.text}
            </StatusBanner>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Input
                type="text"
                label="First Name"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
              />
              <Input
                type="text"
                label="Last Name"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
              />
            </div>

            <div className="space-y-1">
              <Input
                type="email"
                label="Email Address"
                value={formData.email}
                disabled
              />
              <p className="account-caption mt-1">
                Email cannot be changed directly.
              </p>
            </div>

            <Input
              type="tel"
              label="Phone Number"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+1 (555) 000-0000"
            />

            <div className="pt-4">
              <Button
                type="submit"
                disabled={saving}
                variant="secondary"
                size="lg"
                fullWidth
                leadingIcon={saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
