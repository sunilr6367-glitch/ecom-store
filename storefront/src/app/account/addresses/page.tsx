'use client';


import { Heading } from '@/design-system';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, MapPin, Plus, Trash2 } from 'lucide-react';

import { useAuth } from '@/context/auth-context';
import { countries, getCountryName } from '@/config/countries';
import { api } from '@/lib/api';
import { Input } from '@/design-system';
import { Select } from '@/design-system';
import { Button, IconButton } from '@/design-system';
import { Card } from '@/design-system';
import { StatusBanner } from '@/design-system';

interface Address {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  address_1: string;
  address_2?: string | null;
  city: string;
  province?: string | null;
  postal_code: string;
  country_code: string;
  phone?: string | null;
  created_at?: string;
}

type AddressFormData = {
  first_name: string;
  last_name: string;
  address_1: string;
  address_2: string;
  city: string;
  province: string;
  postal_code: string;
  country_code: string;
  phone: string;
};

const DEFAULT_FORM: AddressFormData = {
  first_name: '',
  last_name: '',
  address_1: '',
  address_2: '',
  city: '',
  province: '',
  postal_code: '',
  country_code: 'IN',
  phone: '',
};

function toFormData(address?: Address | null): AddressFormData {
  if (!address) return DEFAULT_FORM;

  return {
    first_name: address.first_name || '',
    last_name: address.last_name || '',
    address_1: address.address_1 || '',
    address_2: address.address_2 || '',
    city: address.city || '',
    province: address.province || '',
    postal_code: address.postal_code || '',
    country_code: address.country_code || 'IN',
    phone: address.phone || '',
  };
}

export default function AddressesPage() {
  const { customer, loading } = useAuth();
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AddressFormData>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const editingAddress = useMemo(
    () => addresses.find((address) => address.id === editingId) || null,
    [addresses, editingId]
  );

  const resetForm = () => {
    setFormData(DEFAULT_FORM);
    setEditingId(null);
    setShowForm(false);
  };

  const loadAddresses = useCallback(async () => {
    setLoadingAddresses(true);
    setError('');
    try {
      const data = await api.getCustomerAddresses();
      setAddresses(data.addresses || []);
    } catch (err: unknown) {
      setAddresses([]);
      setError(
        err instanceof Error
          ? err.message
          : 'Could not load your saved addresses.'
      );
    } finally {
      setLoadingAddresses(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !customer) {
      router.push('/login?redirect=/account/addresses');
    }
  }, [customer, loading, router]);

  useEffect(() => {
    if (loading || !customer) return;
    loadAddresses();
  }, [customer, loading, loadAddresses]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMessage('');

    const payload = {
      first_name: formData.first_name.trim() || undefined,
      last_name: formData.last_name.trim() || undefined,
      address_1: formData.address_1.trim(),
      address_2: formData.address_2.trim() || undefined,
      city: formData.city.trim(),
      province: formData.province.trim() || undefined,
      postal_code: formData.postal_code.trim(),
      country_code: formData.country_code,
      phone: formData.phone.trim() || undefined,
    };

    try {
      if (editingId) {
        const data = await api.updateCustomerAddress(editingId, payload);
        const updated = data.address as Address;
        setAddresses((prev) =>
          prev.map((item) => (item.id === editingId ? updated : item))
        );
        setSuccessMessage('Address updated.');
      } else {
        const data = await api.createCustomerAddress(payload);
        const created = data.address as Address;
        setAddresses((prev) => [created, ...prev]);
        setSuccessMessage('Address saved.');
      }

      resetForm();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not save your address. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this saved address?')) return;

    setDeletingId(id);
    setError('');
    setSuccessMessage('');

    try {
      await api.deleteCustomerAddress(id);
      setAddresses((prev) => prev.filter((address) => address.id !== id));
      if (editingId === id) {
        resetForm();
      }
      setSuccessMessage('Address removed.');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not delete your address. Please try again.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading || !customer) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-parchment">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-parchment py-token-xl md:py-token-2xl lg:py-token-3xl">
      <div className="mx-auto max-w-4xl px-home-mobile md:px-home-tablet lg:px-home-desktop">
        <Link
          href="/account"
          className="account-muted mb-8 inline-flex items-center gap-2 transition-colors hover:text-primary"
        >
          <ArrowLeft size={16} /> Back to Account
        </Link>

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Heading role="page" className="account-page-title mb-2">Addresses</Heading>
            <p className="account-muted max-w-2xl">
              Save delivery addresses for faster repeat checkout. You can still
              review and change the final shipping address at checkout before
              payment.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              setEditingId(null);
              setFormData(DEFAULT_FORM);
              setShowForm((prev) => !prev);
              setError('');
              setSuccessMessage('');
            }}
            variant="secondary"
            size="md"
            leadingIcon={<Plus size={16} />}
          >
            {showForm && !editingId ? 'Close Form' : 'Add Address'}
          </Button>
        </div>

        {error ? (
          <StatusBanner tone="danger" className="mb-6">
            {error}
          </StatusBanner>
        ) : null}

        {successMessage ? (
          <StatusBanner tone="success" className="mb-6">
            {successMessage}
          </StatusBanner>
        ) : null}

        {showForm ? (
          <Card className="mb-8 p-6 shadow-sm">
            <h2 className="account-section-title mb-2">
              {editingAddress ? 'Edit Address' : 'New Address'}
            </h2>
            <p className="account-muted mb-6">
              Keep this address accurate so shipping previews and delivery
              details stay reliable.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Input
                    type="text"
                    label="First Name"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        first_name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    label="Last Name"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        last_name: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <Input
                  type="text"
                  label="Address line 1"
                  required
                  value={formData.address_1}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address_1: e.target.value,
                    }))
                  }
                  placeholder="Street address"
                />
              </div>

              <div>
                <Input
                  type="text"
                  label="Address line 2"
                  value={formData.address_2}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address_2: e.target.value,
                    }))
                  }
                  placeholder="Apartment, suite, landmark"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Input
                    type="text"
                    label="City"
                    required
                    value={formData.city}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, city: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Input
                    type="text"
                    label="State / Province"
                    value={formData.province}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        province: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Input
                    type="text"
                    label="Postal Code"
                    required
                    value={formData.postal_code}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        postal_code: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Input
                    type="tel"
                    label="Phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div>
                <Select
                  label="Country"
                  required
                  value={formData.country_code}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      country_code: e.target.value,
                    }))
                  }
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-wrap gap-4 pt-2">
                <Button
                  type="submit"
                  disabled={submitting}
                  variant="secondary"
                  size="md"
                >
                  {submitting
                    ? editingAddress
                      ? 'Saving...'
                      : 'Adding...'
                    : editingAddress
                      ? 'Save Changes'
                      : 'Save Address'}
                </Button>
                <Button
                  type="button"
                  onClick={resetForm}
                  variant="outline"
                  size="md"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        ) : null}

        {loadingAddresses ? (
          <Card className="p-12 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            <p className="account-muted mt-4">Loading saved addresses...</p>
          </Card>
        ) : addresses.length === 0 ? (
          <Card className="p-12 text-center shadow-sm">
            <MapPin size={48} className="mx-auto mb-4 text-disabled" />
            <h3 className="account-section-title mb-2">No saved addresses</h3>
            <p className="account-muted mb-6">
              Add an address now to speed up future checkouts and order support.
            </p>
            <Button
              type="button"
              onClick={() => setShowForm(true)}
              variant="secondary"
              size="md"
              leadingIcon={<Plus size={16} />}
            >
              Add Your First Address
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {addresses.map((address) => (
              <Card
                key={address.id}
                className="flex flex-col justify-between gap-5 p-6 shadow-sm md:flex-row md:items-start"
              >
                <div>
                  <p className="account-name">
                    {[address.first_name, address.last_name]
                      .filter(Boolean)
                      .join(' ') || 'Saved Address'}
                  </p>
                  <p className="account-body mt-1">{address.address_1}</p>
                  {address.address_2 ? (
                    <p className="account-body">{address.address_2}</p>
                  ) : null}
                  <p className="account-body">
                    {address.city}
                    {address.province ? `, ${address.province}` : ''}{' '}
                    {address.postal_code}
                  </p>
                  <p className="account-body">
                    {getCountryName(address.country_code)}
                  </p>
                  {address.phone ? (
                    <p className="account-muted mt-2">{address.phone}</p>
                  ) : null}
                </div>

                <div className="flex gap-2 self-end md:self-start">
                  <IconButton
                    type="button"
                    onClick={() => {
                      setEditingId(address.id);
                      setFormData(toFormData(address));
                      setShowForm(true);
                      setError('');
                      setSuccessMessage('');
                    }}
                    variant="outline"
                    size="sm"
                    aria-label={`Edit address ${address.id}`}
                  >
                    <Edit2 size={16} />
                  </IconButton>
                  <IconButton
                    type="button"
                    onClick={() => handleDelete(address.id)}
                    disabled={deletingId === address.id}
                    variant="outline"
                    size="sm"
                    className="hover:border-danger hover:text-error"
                    aria-label={`Delete address ${address.id}`}
                  >
                    <Trash2 size={16} />
                  </IconButton>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
