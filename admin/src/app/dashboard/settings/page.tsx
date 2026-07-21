'use client';
/* eslint-disable @next/next/no-img-element */

import {
  useCallback,
  useState,
  useEffect,
} from 'react';
import {
  Store,
  Bell,
  Lock,
  Mail,
  CreditCard,
  Truck,
  Save,
  Shield,
  CheckCircle,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';
import type { User as ApiUser } from '@/lib/api';

import { useNotification } from '@/context/notification-context';
interface ShippingOriginAddress {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

interface ShippingZone {
  id: string;
  name: string;
  countries: string;
  standard_rate?: number | null;
  express_rate?: number | null;
  rate?: number | null;
  free_threshold?: number | null;
}

type SettingValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ShippingOriginAddress
  | ShippingZone[];

interface SettingsState {
  [key: string]: SettingValue;
  announcement_bar_enabled?: boolean;
  announcement_bar_text?: string | null;
  brand_story_content?: string | null;
  brand_story_image?: string | null;
  brand_story_title?: string | null;
  contact_email?: string | null;
  domestic_shipping_rate?: number | null;
  email_notify_delivery?: boolean;
  email_notify_order_confirm?: boolean;
  email_notify_payment?: boolean;
  email_notify_shipping?: boolean;
  email_reply_to?: string | null;
  email_review_request?: boolean;
  email_review_request_days?: number | null;
  featured_product_ids?: string | null;
  from_email?: string | null;
  from_name?: string | null;
  hero_cta_link?: string | null;
  hero_cta_text?: string | null;
  hero_image?: string | null;
  hero_subtitle?: string | null;
  hero_title?: string | null;
  international_shipping_rate?: number | null;
  nav_links?: string | null;
  newsletter_subtitle?: string | null;
  newsletter_title?: string | null;
  notify_low_stock?: boolean;
  notify_orders?: boolean;
  phone_number?: string | null;
  quick_links?: string | null;
  shipping_countries?: string | null;
  shipping_free_applies_to?: string | null;
  shipping_free_enabled?: boolean;
  shipping_free_min_value?: number | null;
  shipping_origin_address?: ShippingOriginAddress;
  shipping_zones?: ShippingZone[];
  smtp_host?: string | null;
  smtp_pass?: string | null;
  smtp_port?: string | null;
  smtp_user?: string | null;
  store_address?: string | null;
  store_description?: string | null;
  store_email?: string | null;
  store_logo_url?: string | null;
  store_name?: string | null;
  store_phone?: string | null;
  stripe_publishable_key?: string | null;
  stripe_secret_key?: string | null;
  tax_rate?: number | null;
}

interface SettingArrayEntry {
  key: string;
  value: SettingValue;
}

interface SettingsResponse {
  settings?:
    | SettingArrayEntry[]
    | Record<string, Record<string, SettingValue> | null | undefined>;
}

const EMAIL_NOTIFICATION_ITEMS = [
  {
    key: 'email_notify_order_confirm',
    label: 'Order Confirmation',
    desc: 'Send email when a new order is placed',
  },
  {
    key: 'email_notify_payment',
    label: 'Payment Received',
    desc: 'Send email when payment is confirmed',
  },
  {
    key: 'email_notify_shipping',
    label: 'Shipping Update',
    desc: 'Send email when order is shipped with tracking info',
  },
  {
    key: 'email_notify_delivery',
    label: 'Delivery Confirmed',
    desc: 'Send email when order is marked as delivered',
  },
] as const;

export default function SettingsPage() {
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SettingsState>({});
  const [user, setUser] = useState<ApiUser | null>(null);

  // Stripe Modal State
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [stripeKeys, setStripeKeys] = useState({ publishable: '', secret: '' });

  // 2FA Modal State
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [otp, setOtp] = useState('');
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [disabling2FA, setDisabling2FA] = useState(false);


  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [settingsData, profileData] = await Promise.all([
        api.getSettings(),
        api.getMe().catch(() => null),
      ]);

      // Flatten settings - handle both array and object formats
      const flatSettings: SettingsState = {};
      const settingsPayload = (settingsData as SettingsResponse | null)?.settings;
      if (settingsPayload) {
        // Backend returns array: [{ key, value, category }, ...]
        if (Array.isArray(settingsPayload)) {
          settingsPayload.forEach((setting) => {
            flatSettings[setting.key] = setting.value;
          });
        }
        // Backend returns object: { category: { key: value } }
        else if (typeof settingsPayload === 'object') {
          Object.values(settingsPayload).forEach((category) => {
            if (category && typeof category === 'object') {
              Object.entries(category).forEach(([key, value]) => {
                flatSettings[key] = value;
              });
            }
          });
        }
      }
      setSettings(flatSettings);

      // Set User Profile
      if (profileData?.user) {
        setUser(profileData.user);
      }

      // Pre-fill stripe
      if (flatSettings.stripe_publishable_key) {
        setStripeKeys({
          publishable: flatSettings.stripe_publishable_key,
          secret: flatSettings.stripe_secret_key || '',
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showNotification('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleChange = <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.updateSettingsBulk(settings);
      showNotification('success', 'Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      showNotification('error', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStripe = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setSaving(true);
      await api.updateSetting(
        'stripe_publishable_key',
        stripeKeys.publishable,
        'payment'
      );
      await api.updateSetting(
        'stripe_secret_key',
        stripeKeys.secret,
        'payment'
      );

      setSettings((prev) => ({
        ...prev,
        stripe_publishable_key: stripeKeys.publishable,
        stripe_secret_key: stripeKeys.secret,
      }));

      setShowStripeModal(false);
      showNotification('success', 'Stripe configuration saved!');
    } catch (error) {
      console.error('Error saving Stripe settings:', error);
      showNotification('error', 'Failed to save Stripe settings');
    } finally {
      setSaving(false);
    }
  };

  const handleEnable2FA = async () => {
    try {
      setLoading(true); // temporary spinner
      const res = await api.generate2FA();
      setQrCode(res.qrCode);
      setShowTwoFactorModal(true);
    } catch (error) {
      console.error('Error generating 2FA:', error);
      showNotification('error', 'Failed to generate 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    try {
      setVerifying2FA(true);
      await api.verify2FA(otp);

      // Refresh User
      const profile = await api.getMe();
      setUser(profile?.user);

      setShowTwoFactorModal(false);
      setOtp('');
      showNotification('success', 'Two-Factor Authentication Enabled!');
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      showNotification('error', 'Invalid OTP. Please try again.');
    } finally {
      setVerifying2FA(false);
    }
  };

  const handleDisable2FA = () => {
    setOtp('');
    setShowDisable2FAModal(true);
  };

  const handleConfirmDisable2FA = async () => {
    if (otp.length !== 6) return;

    try {
      setDisabling2FA(true);
      await api.disable2FA(otp);
      const profile = await api.getMe();
      setUser(profile?.user);
      setShowDisable2FAModal(false);
      setOtp('');
      showNotification('success', 'Two-Factor Authentication Disabled');
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      showNotification('error', 'Invalid OTP. Please try again.');
    } finally {
      setDisabling2FA(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Store },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'shipping', label: 'Shipping', icon: Truck },
  ];

  const shippingOrigin = settings.shipping_origin_address ?? {};
  const shippingZones = Array.isArray(settings.shipping_zones)
    ? settings.shipping_zones
    : [];

  if (loading) {
    return (
      <div className="space-y-6 px-4 py-6 md:px-6">
        <div className="h-10 w-40 bg-[var(--surface-container-high)] rounded-xl animate-pulse" />
        <div className="h-64 bg-[var(--surface-container-lowest)] rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-6 md:px-6 relative">
      <div>
        <h2 className="text-[2.75rem] font-black leading-none tracking-tight text-[var(--on-surface)]">Settings</h2>
        <p className="mt-2 text-sm font-medium text-[var(--on-surface-variant)]">
          Manage your store settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-[var(--surface-container-lowest)] rounded-2xl shadow-[0_4px_12px_rgba(25,28,30,0.04)] p-3">
            <nav className="space-y-0.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[var(--primary)] text-white'
                        : 'text-[var(--on-surface-variant)] hover:bg-[var(--surface-container-low)]'
                    }`}
                  >
                    <Icon size={16} />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        <div className="lg:col-span-3">
          <div className="bg-[var(--surface-container-lowest)] rounded-2xl shadow-[0_4px_12px_rgba(25,28,30,0.04)] p-6">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h2 className="text-lg font-black text-[var(--on-surface)]">
                  General Settings
                </h2>

                <div>
                  <label
                    htmlFor="store_name"
                    className="block text-xs font-bold text-[var(--on-surface-variant)] mb-2 uppercase tracking-widest"
                  >
                    Store Name
                  </label>
                  <input
                    id="store_name"
                    type="text"
                    value={settings.store_name || ''}
                    onChange={(e) => handleChange('store_name', e.target.value)}
                    placeholder="Odhvica Store"
                    className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-3 text-sm text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                  />
                </div>
                <div>
                  <label
                    htmlFor="store_description"
                    className="block text-xs font-bold text-[var(--on-surface-variant)] mb-2 uppercase tracking-widest"
                  >
                    Store Description
                  </label>
                  <textarea
                    id="store_description"
                    rows={4}
                    value={settings.store_description || ''}
                    onChange={(e) =>
                      handleChange('store_description', e.target.value)
                    }
                    placeholder="Your premium e-commerce store"
                    className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-3 text-sm text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                  />
                </div>
                <div>
                  <label
                    htmlFor="contact_email"
                    className="block text-xs font-bold text-[var(--on-surface-variant)] mb-2 uppercase tracking-widest"
                  >
                    Contact Email
                  </label>
                  <input
                    id="contact_email"
                    type="email"
                    value={settings.contact_email || ''}
                    onChange={(e) =>
                      handleChange('contact_email', e.target.value)
                    }
                    placeholder="admin@odhvica.com"
                    className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-3 text-sm text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone_number"
                    className="block text-xs font-bold text-[var(--on-surface-variant)] mb-2 uppercase tracking-widest"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phone_number"
                    type="tel"
                    value={settings.phone_number || ''}
                    onChange={(e) =>
                      handleChange('phone_number', e.target.value)
                    }
                    placeholder="+1 (555) 123-4567"
                    className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-3 text-sm text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                  />
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-lg font-black text-[var(--on-surface)]">
                  Notification Settings
                </h2>
                {/* Use settings state but simplified for brevity in this replace */}
                <div className="space-y-4">
                  {/* Keeping previous structure simplified */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[var(--on-surface)]">
                        Order Notifications
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notify_orders ?? true}
                      onChange={(e) =>
                        handleChange('notify_orders', e.target.checked)
                      }
                      className="w-5 h-5 text-[var(--primary)]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[var(--on-surface)]">
                        Low Stock Alerts
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notify_low_stock ?? true}
                      onChange={(e) =>
                        handleChange('notify_low_stock', e.target.checked)
                      }
                      className="w-5 h-5 text-[var(--primary)]"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-black text-[var(--on-surface)]">
                  Security Settings
                </h2>
                <p className="text-[var(--on-surface-variant)]">
                  Password management is handled via profile settings.
                </p>

                <div className="pt-4 border-t border-[var(--surface-container-low)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[var(--on-surface)]">
                          Two-Factor Authentication
                        </p>
                        {user?.two_factor_enabled && (
                          <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                            <CheckCircle size={10} /> Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--on-surface-variant)]">
                        {user?.two_factor_enabled
                          ? 'Account is secured with 2FA'
                          : 'Add an extra layer of security'}
                      </p>
                    </div>
                    {user?.two_factor_enabled ? (
                      <button
                        onClick={handleDisable2FA}
                        className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium"
                      >
                        Disable
                      </button>
                    ) : (
                      <button
                        onClick={handleEnable2FA}
                        className="px-4 py-2 bg-[var(--surface-container-low)]0 text-white rounded-lg hover:bg-[var(--primary)] font-medium"
                      >
                        Enable 2FA
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payment' && (
              <div className="space-y-6">
                <h2 className="text-lg font-black text-[var(--on-surface)]">
                  Payment Settings
                </h2>

                <div className="space-y-4">
                  <div className="border border-[var(--surface-container-low)] rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-[var(--on-surface)]">Stripe</p>
                          {settings.stripe_publishable_key && (
                            <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle size={10} /> Configured
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[var(--on-surface-variant)]">
                          Accept credit cards and digital wallets
                        </p>
                      </div>
                      <button
                        onClick={() => setShowStripeModal(true)}
                        className="px-4 py-2 bg-gray-100 text-[var(--on-surface-variant)] rounded-lg hover:bg-gray-200 flex items-center gap-2"
                      >
                        Configure
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-6">
                <h2 className="text-lg font-black text-[var(--on-surface)]">
                  Email Settings (SMTP)
                </h2>
                <p className="text-[var(--on-surface-variant)]">
                  Configure your email provider for sending order confirmations
                  and notifications.
                </p>

                <div className="grid grid-cols-1 gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="from_name"
                        className="block text-xs font-bold text-[var(--on-surface-variant)] mb-2 uppercase tracking-widest"
                      >
                        From Name
                      </label>
                      <input
                        id="from_name"
                        type="text"
                        value={settings.from_name || ''}
                        onChange={(e) =>
                          handleChange('from_name', e.target.value)
                        }
                        placeholder="Odhvica Support"
                        className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-3 text-sm text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="from_email"
                        className="block text-xs font-bold text-[var(--on-surface-variant)] mb-2 uppercase tracking-widest"
                      >
                        From Email
                      </label>
                      <input
                        id="from_email"
                        type="email"
                        value={settings.from_email || ''}
                        onChange={(e) =>
                          handleChange('from_email', e.target.value)
                        }
                        placeholder="support@odhvica.com"
                        className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-3 text-sm text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                      />
                    </div>
                  </div>

                  {/* Reply-To Email */}
                  <div>
                    <label
                      htmlFor="email_reply_to"
                      className="block text-xs font-bold text-[var(--on-surface-variant)] mb-2 uppercase tracking-widest"
                    >
                      Reply-To Email
                    </label>
                    <input
                      id="email_reply_to"
                      type="email"
                      value={settings.email_reply_to || ''}
                      onChange={(e) =>
                        handleChange('email_reply_to', e.target.value)
                      }
                      placeholder="hello@odhvica.com"
                      className="w-full lg:w-1/2 px-4 py-2 border border-[var(--outline-variant)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-[var(--on-surface-variant)] mt-1">
                      Customer replies will be sent to this address
                    </p>
                  </div>

                  <div className="border-t border-[var(--surface-container-low)] pt-6">
                    <h3 className="text-lg font-medium text-[var(--on-surface)] mb-4">
                      SMTP Configuration
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 md:col-span-1">
                        <label
                          htmlFor="smtp_host"
                          className="block text-xs font-bold text-[var(--on-surface-variant)] mb-2 uppercase tracking-widest"
                        >
                          SMTP Host
                        </label>
                        <input
                          id="smtp_host"
                          type="text"
                          value={settings.smtp_host || ''}
                          onChange={(e) =>
                            handleChange('smtp_host', e.target.value)
                          }
                          placeholder="smtp.example.com"
                          className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-3 text-sm text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label
                          htmlFor="smtp_port"
                          className="block text-xs font-bold text-[var(--on-surface-variant)] mb-2 uppercase tracking-widest"
                        >
                          SMTP Port
                        </label>
                        <input
                          id="smtp_port"
                          type="number"
                          value={settings.smtp_port || ''}
                          onChange={(e) =>
                            handleChange('smtp_port', e.target.value)
                          }
                          placeholder="587"
                          className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-3 text-sm text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label
                          htmlFor="smtp_user"
                          className="block text-xs font-bold text-[var(--on-surface-variant)] mb-2 uppercase tracking-widest"
                        >
                          SMTP User
                        </label>
                        <input
                          id="smtp_user"
                          type="text"
                          value={settings.smtp_user || ''}
                          onChange={(e) =>
                            handleChange('smtp_user', e.target.value)
                          }
                          placeholder="apikey"
                          className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-3 text-sm text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                        />
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <label
                          htmlFor="smtp_pass"
                          className="block text-xs font-bold text-[var(--on-surface-variant)] mb-2 uppercase tracking-widest"
                        >
                          SMTP Password
                        </label>
                        <div className="relative">
                          <input
                            id="smtp_pass"
                            type="password"
                            value={settings.smtp_pass || ''}
                            onChange={(e) =>
                              handleChange('smtp_pass', e.target.value)
                            }
                            placeholder="••••••••••••"
                            className="w-full px-4 py-2 border border-[var(--outline-variant)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                          />
                          <Lock
                            size={16}
                            className="absolute right-3 top-3 text-[var(--on-surface-variant)]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Email Notification Toggles */}
                  <div className="border-t border-[var(--surface-container-low)] pt-6">
                    <h3 className="text-lg font-medium text-[var(--on-surface)] mb-2">
                      Email Notifications
                    </h3>
                    <p className="text-sm text-[var(--on-surface-variant)] mb-4">
                      Choose which emails are sent automatically to customers
                    </p>

                    <div className="space-y-3">
                      {EMAIL_NOTIFICATION_ITEMS.map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center justify-between bg-gray-50 rounded-lg p-4"
                        >
                          <div>
                            <p className="font-medium text-gray-800">
                              {item.label}
                            </p>
                            <p className="text-xs text-[var(--on-surface-variant)]">{item.desc}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleChange(
                                item.key,
                                !settings[item.key]
                              )
                            }
                            className={`relative w-12 h-6 rounded-full transition-colors ${
                              settings[item.key]
                                ? 'bg-[var(--surface-container-low)]0'
                                : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                                settings[item.key]
                                  ? 'translate-x-6'
                                  : ''
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Review Request */}
                  <div className="border-t border-[var(--surface-container-low)] pt-6">
                    <h3 className="text-lg font-medium text-[var(--on-surface)] mb-2">
                      Review Request
                    </h3>
                    <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 mb-3">
                      <div>
                        <p className="font-medium text-gray-800">
                          Send Review Request Email
                        </p>
                        <p className="text-xs text-[var(--on-surface-variant)]">
                          Automatically ask customers to review purchased
                          products
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          handleChange(
                            'email_review_request',
                            !settings.email_review_request
                          )
                        }
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          settings.email_review_request
                            ? 'bg-[var(--surface-container-low)]0'
                            : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                            settings.email_review_request ? 'translate-x-6' : ''
                          }`}
                        />
                      </button>
                    </div>
                    {settings.email_review_request && (
                      <div className="pl-4 border-l-2 border-blue-200">
                        <label className="block text-xs font-bold text-[var(--on-surface-variant)] mb-1 uppercase tracking-widest">
                          Send after how many days of delivery?
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={settings.email_review_request_days || 7}
                          onChange={(e) =>
                            handleChange(
                              'email_review_request_days',
                              parseInt(e.target.value)
                            )
                          }
                          className="w-32 px-4 py-2 border border-[var(--outline-variant)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-[var(--on-surface-variant)] mt-1">
                          Days after delivery confirmation
                        </p>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="space-y-6">
                <h2 className="text-lg font-black text-[var(--on-surface)]">
                  Shipping & Tax Settings
                </h2>

                <div className="bg-[var(--surface-container-low)] border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800">
                    Configure shipping origin, rates, free shipping rules, and
                    shipping zones.
                  </p>
                </div>

                {/* Shipping Origin Address */}
                <div className="border-b border-[var(--surface-container-low)] pb-6">
                  <h3 className="text-sm font-bold text-[var(--on-surface)] mb-4">
                    Shipping Origin Address
                  </h3>
                  <p className="text-sm text-[var(--on-surface-variant)] mb-4">
                    The address from which your orders are shipped. Used for
                    shipping rate calculations.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-[var(--on-surface-variant)] mb-1 uppercase tracking-widest">
                        Street Address
                      </label>
                      <input
                        type="text"
                        value={shippingOrigin.address || ''}
                        onChange={(e) =>
                          handleChange('shipping_origin_address', {
                            ...shippingOrigin,
                            address: e.target.value,
                          })
                        }
                        placeholder="123 Main Street"
                        className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-3 text-sm text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--on-surface-variant)] mb-1 uppercase tracking-widest">
                        City
                      </label>
                      <input
                        type="text"
                        value={shippingOrigin.city || ''}
                        onChange={(e) =>
                          handleChange('shipping_origin_address', {
                            ...shippingOrigin,
                            city: e.target.value,
                          })
                        }
                        placeholder="Mumbai"
                        className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-3 text-sm text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--on-surface-variant)] mb-1 uppercase tracking-widest">
                        State / Province
                      </label>
                      <input
                        type="text"
                        value={shippingOrigin.state || ''}
                        onChange={(e) =>
                          handleChange('shipping_origin_address', {
                            ...shippingOrigin,
                            state: e.target.value,
                          })
                        }
                        placeholder="Maharashtra"
                        className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-3 text-sm text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--on-surface-variant)] mb-1 uppercase tracking-widest">
                        Country
                      </label>
                      <input
                        type="text"
                        value={shippingOrigin.country || ''}
                        onChange={(e) =>
                          handleChange('shipping_origin_address', {
                            ...shippingOrigin,
                            country: e.target.value,
                          })
                        }
                        placeholder="India"
                        className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-3 text-sm text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[var(--on-surface-variant)] mb-1 uppercase tracking-widest">
                        PIN / ZIP Code
                      </label>
                      <input
                        type="text"
                        value={shippingOrigin.pincode || ''}
                        onChange={(e) =>
                          handleChange('shipping_origin_address', {
                            ...shippingOrigin,
                            pincode: e.target.value,
                          })
                        }
                        placeholder="400001"
                        className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-3 text-sm text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                      />
                    </div>
                  </div>
                </div>

                {/* Tax Configuration */}
                <div className="border-b border-[var(--surface-container-low)] pb-6">
                  <h3 className="text-sm font-bold text-[var(--on-surface)] mb-4">
                    Tax Configuration
                  </h3>
                  <div>
                    <label
                      htmlFor="tax_rate"
                      className="block text-xs font-bold text-[var(--on-surface-variant)] mb-2 uppercase tracking-widest"
                    >
                      Default Tax Rate (%)
                    </label>
                    <input
                      id="tax_rate"
                      type="number"
                      step="0.01"
                      value={settings.tax_rate || 0}
                      onChange={(e) =>
                        handleChange(
                          'tax_rate',
                          Number.parseFloat(e.target.value)
                        )
                      }
                      className="w-full lg:w-1/2 px-4 py-2 border border-[var(--outline-variant)] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-[var(--on-surface-variant)] mt-1">
                      This tax rate will be applied to all orders.
                    </p>
                  </div>
                </div>

                {/* Free Shipping */}
                <div className="border-b border-[var(--surface-container-low)] pb-6">
                  <h3 className="text-sm font-bold text-[var(--on-surface)] mb-4">
                    Free Shipping
                  </h3>
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4 mb-4">
                    <div>
                      <p className="font-medium text-gray-800">
                        Enable Free Shipping
                      </p>
                      <p className="text-xs text-[var(--on-surface-variant)]">
                        Offer free shipping for qualifying orders
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleChange(
                          'shipping_free_enabled',
                          !settings.shipping_free_enabled
                        )
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.shipping_free_enabled
                          ? 'bg-[var(--surface-container-low)]0'
                          : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform shadow ${
                          settings.shipping_free_enabled ? 'translate-x-6' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {settings.shipping_free_enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-blue-200">
                      <div>
                        <label className="block text-xs font-bold text-[var(--on-surface-variant)] mb-1 uppercase tracking-widest">
                          Minimum Order Value (USD)
                        </label>
                        <input
                          type="number"
                          value={settings.shipping_free_min_value || 100}
                          onChange={(e) =>
                            handleChange(
                              'shipping_free_min_value',
                              Number.parseFloat(e.target.value)
                            )
                          }
                          className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-3 text-sm text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                        />
                        <p className="text-xs text-[var(--on-surface-variant)] mt-1">
                          Orders above this amount qualify for free shipping
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-[var(--on-surface-variant)] mb-1 uppercase tracking-widest">
                          Applies To
                        </label>
                        <select
                          value={settings.shipping_free_applies_to || 'all'}
                          onChange={(e) =>
                            handleChange(
                              'shipping_free_applies_to',
                              e.target.value
                            )
                          }
                          className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-3 text-sm text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                        >
                          <option value="all">All Orders</option>
                          <option value="domestic">Domestic Only</option>
                          <option value="international">
                            International Only
                          </option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Shipping Rates */}
                <div className="border-b border-[var(--surface-container-low)] pb-6">
                  <h3 className="text-sm font-bold text-[var(--on-surface)] mb-4">
                    Default Shipping Rates
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="domestic_shipping_rate"
                        className="block text-xs font-bold text-[var(--on-surface-variant)] mb-2 uppercase tracking-widest"
                      >
                        Domestic Shipping Rate (USD)
                      </label>
                      <input
                        id="domestic_shipping_rate"
                        type="number"
                        value={settings.domestic_shipping_rate || 10}
                        onChange={(e) =>
                          handleChange(
                            'domestic_shipping_rate',
                            Number.parseFloat(e.target.value)
                          )
                        }
                        className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-3 text-sm text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="international_shipping_rate"
                        className="block text-xs font-bold text-[var(--on-surface-variant)] mb-2 uppercase tracking-widest"
                      >
                        International Shipping Rate (USD)
                      </label>
                      <input
                        id="international_shipping_rate"
                        type="number"
                        value={settings.international_shipping_rate || 30}
                        onChange={(e) =>
                          handleChange(
                            'international_shipping_rate',
                            Number.parseFloat(e.target.value)
                          )
                        }
                        className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-3 text-sm text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Zones Table */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold text-[var(--on-surface)]">
                        Shipping Zones
                      </h3>
                      <p className="text-xs text-[var(--on-surface-variant)]">
                        Define custom zones with specific rates for different
                        regions
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const zones = [...shippingZones];
                        zones.push({
                          id: Date.now().toString(),
                          name: '',
                          countries: '',
                          standard_rate: 0,
                          express_rate: 0,
                        });
                        handleChange('shipping_zones', zones);
                      }}
                      className="px-3 py-1.5 bg-[var(--surface-container-low)]0 text-white text-sm rounded-lg hover:bg-[var(--primary)]"
                    >
                      + Add Zone
                    </button>
                  </div>

                  {shippingZones.length > 0 ? (
                    <div className="border border-[var(--surface-container-low)] rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--on-surface-variant)] uppercase">
                              Zone Name
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--on-surface-variant)] uppercase">
                              Countries
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--on-surface-variant)] uppercase">
                              Standard Rate
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--on-surface-variant)] uppercase">
                              Express Rate
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-[var(--on-surface-variant)] uppercase">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {shippingZones.map((zone, index) => (
                              <tr key={zone.id || index}>
                                <td className="px-4 py-2">
                                  <input
                                    type="text"
                                    value={zone.name || ''}
                                    onChange={(e) => {
                                      const zones = [...shippingZones];
                                      zones[index] = {
                                        ...zones[index],
                                        name: e.target.value,
                                      };
                                      handleChange('shipping_zones', zones);
                                    }}
                                    placeholder="e.g. South Asia"
                                    className="w-full px-2 py-1 text-sm border border-[var(--outline-variant)] rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="text"
                                    value={zone.countries || ''}
                                    onChange={(e) => {
                                      const zones = [...shippingZones];
                                      zones[index] = {
                                        ...zones[index],
                                        countries: e.target.value,
                                      };
                                      handleChange('shipping_zones', zones);
                                    }}
                                    placeholder="IN, LK, BD"
                                    className="w-full px-2 py-1 text-sm border border-[var(--outline-variant)] rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="number"
                                    value={zone.standard_rate || 0}
                                    onChange={(e) => {
                                      const zones = [...shippingZones];
                                      zones[index] = {
                                        ...zones[index],
                                        standard_rate: Number.parseFloat(
                                          e.target.value
                                        ),
                                      };
                                      handleChange('shipping_zones', zones);
                                    }}
                                    className="w-20 px-2 py-1 text-sm border border-[var(--outline-variant)] rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="px-4 py-2">
                                  <input
                                    type="number"
                                    value={zone.express_rate || 0}
                                    onChange={(e) => {
                                      const zones = [...shippingZones];
                                      zones[index] = {
                                        ...zones[index],
                                        express_rate: Number.parseFloat(
                                          e.target.value
                                        ),
                                      };
                                      handleChange('shipping_zones', zones);
                                    }}
                                    className="w-20 px-2 py-1 text-sm border border-[var(--outline-variant)] rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="px-4 py-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const zones = shippingZones.filter(
                                        (_, i) => i !== index
                                      );
                                      handleChange('shipping_zones', zones);
                                    }}
                                    className="text-red-500 hover:text-red-700 text-sm"
                                  >
                                    Remove
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-[var(--on-surface-variant)] border border-dashed border-[var(--outline-variant)] rounded-lg">
                      <p className="mb-2">No shipping zones configured yet.</p>
                      <p className="text-sm">
                        Click &quot;+ Add Zone&quot; to create custom shipping
                        zones with specific rates.
                      </p>
                    </div>
                  )}
                </div>

                {/* Allowed Countries */}
                <div className="pt-2">
                  <label
                    htmlFor="shipping_countries"
                    className="block text-xs font-bold text-[var(--on-surface-variant)] mb-2 uppercase tracking-widest"
                  >
                    Allowed Shipping Countries
                  </label>
                  <input
                    id="shipping_countries"
                    type="text"
                    value={settings.shipping_countries || 'US, CA'}
                    onChange={(e) =>
                      handleChange('shipping_countries', e.target.value)
                    }
                    placeholder="US, CA, GB, AU"
                    className="w-full rounded-xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] px-4 py-3 text-sm text-[var(--on-surface)] placeholder:text-[var(--on-surface-variant)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30"
                  />
                  <p className="text-xs text-[var(--on-surface-variant)] mt-1">
                    Comma-separated two-letter ISO country codes.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-[var(--surface-container-low)]">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-full bg-[var(--primary)] px-6 py-3 text-xs font-bold uppercase tracking-widest text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              >
                <Save size={20} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stripe Config Modal */}
      {showStripeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[var(--on-surface)] flex items-center gap-2">
                <CreditCard size={24} className="text-[var(--primary)]" />
                Configure Stripe
              </h2>
              <button
                onClick={() => setShowStripeModal(false)}
                className="text-[var(--on-surface-variant)] hover:text-[var(--on-surface-variant)]"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveStripe} className="space-y-4">
              <div className="bg-[var(--surface-container-low)] p-3 rounded-lg text-sm text-blue-800 border border-blue-200">
                Enter your Stripe API keys. These are stored safely and used for
                payment processing.
              </div>
              <div>
                <label
                  htmlFor="stripe_publishable_key"
                  className="block text-xs font-bold text-[var(--on-surface-variant)] mb-1 uppercase tracking-widest"
                >
                  Publishable Key
                </label>
                <input
                  id="stripe_publishable_key"
                  type="text"
                  required
                  placeholder="pk_test_..."
                  className="w-full border border-[var(--outline-variant)] rounded p-2 text-[var(--on-surface)]"
                  value={stripeKeys.publishable}
                  onChange={(e) =>
                    setStripeKeys({
                      ...stripeKeys,
                      publishable: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="stripe_secret_key"
                  className="block text-xs font-bold text-[var(--on-surface-variant)] mb-1 uppercase tracking-widest"
                >
                  Secret Key
                </label>
                <div className="relative">
                  <input
                    id="stripe_secret_key"
                    type="password"
                    required
                    placeholder="sk_test_..."
                    className="w-full border border-[var(--outline-variant)] rounded p-2 text-[var(--on-surface)] pr-10"
                    value={stripeKeys.secret}
                    onChange={(e) =>
                      setStripeKeys({ ...stripeKeys, secret: e.target.value })
                    }
                  />
                  <Lock
                    size={14}
                    className="absolute right-3 top-3 text-[var(--on-surface-variant)]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowStripeModal(false)}
                  className="px-4 py-2 text-[var(--on-surface-variant)] hover:bg-gray-100 rounded border border-[var(--outline-variant)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded hover:bg-blue-700"
                >
                  Save Configuration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA Modal - Enable */}
      {showTwoFactorModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[var(--on-surface)] flex items-center gap-2">
                <Shield size={24} className="text-[var(--primary)]" />
                Enable 2FA
              </h2>
              <button
                onClick={() => setShowTwoFactorModal(false)}
                className="text-[var(--on-surface-variant)] hover:text-[var(--on-surface-variant)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 text-center">
              <p className="text-xs text-[var(--on-surface-variant)]">
                Scan this QR code with your authenticator app (Google
                Authenticator, Authy, etc.), then enter the code below.
              </p>

              {qrCode && (
                <div className="flex justify-center bg-gray-50 p-4 rounded-lg border border-[var(--surface-container-low)]">
                  <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                </div>
              )}

              <div>
                <label
                  htmlFor="otp_enable"
                  className="block text-sm font-medium text-[var(--on-surface-variant)] mb-2 text-left"
                >
                  Authentication Code
                </label>
                <input
                  id="otp_enable"
                  type="text"
                  maxLength={6}
                  placeholder="000 000"
                  className="w-full text-center text-2xl tracking-widest border border-[var(--outline-variant)] rounded-lg p-3 font-mono"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replaceAll(/\D/g, ''))}
                />
              </div>

              <button
                onClick={handleVerify2FA}
                disabled={otp.length !== 6 || verifying2FA}
                className="w-full py-3 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {verifying2FA ? 'Verifying...' : 'Verify & Enable'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Modal - Disable */}
      {showDisable2FAModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[var(--on-surface)] flex items-center gap-2">
                <Shield size={24} className="text-[var(--error)]" />
                Disable 2FA
              </h2>
              <button
                onClick={() => setShowDisable2FAModal(false)}
                className="text-[var(--on-surface-variant)] hover:text-[var(--on-surface-variant)]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-[var(--error-container)] p-4 rounded-lg border border-[var(--error)]/20">
                <p className="text-sm text-red-800">
                  <strong>Warning:</strong> Disabling 2FA will remove the extra
                  layer of security from your account. You will only need your
                  password to log in.
                </p>
              </div>

              <p className="text-xs text-[var(--on-surface-variant)]">
                To confirm, please enter the current 6-digit code from your
                authenticator app:
              </p>

              <div>
                {/* Nav Links JSON format hint */}
                <label
                  htmlFor="otp_disable"
                  className="block text-xs font-bold text-[var(--on-surface-variant)] mb-2 uppercase tracking-widest"
                >
                  Authentication Code
                </label>
                <input
                  id="otp_disable"
                  type="text"
                  maxLength={6}
                  placeholder="000 000"
                  className="w-full text-center text-2xl tracking-widest border border-[var(--outline-variant)] rounded-lg p-3 font-mono"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replaceAll(/\D/g, ''))}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDisable2FAModal(false)}
                  className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDisable2FA}
                  disabled={otp.length !== 6 || disabling2FA}
                  className="flex-1 py-3 bg-[var(--error)] text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                >
                  {disabling2FA ? 'Disabling...' : 'Disable 2FA'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

