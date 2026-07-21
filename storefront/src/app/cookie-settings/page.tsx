'use client';


import { Heading } from '@/design-system';
import { useEffect, useState } from 'react';
import { ConsentManager } from '@/lib/consent-manager';
import { Button } from '@/design-system';

export default function CookieSettingsPage() {
  const defaultConsent = {
    timestamp: 0,
    version: '1.0',
    categories: {
      essential: true,
      analytics: false,
      marketing: false,
      session_recording: false,
    },
  };
  const [consent, setConsent] = useState(defaultConsent);

  useEffect(() => {
    setConsent(ConsentManager.getConsent() ?? defaultConsent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = (category: keyof typeof consent.categories) => {
    // essential cannot be toggled
    if (category === 'essential') return;
    setConsent((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        [category]: !prev.categories[category],
      },
    }));
  };

  const handleSave = () => {
    ConsentManager.setConsent(consent.categories);
    // reload so scripts pick up new settings
    window.location.reload();
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 md:px-12 md:py-16 lg:px-20 lg:py-24">
      <Heading role="page" className="text-display-md font-bold mb-6">Cookie & Privacy Settings</Heading>
      <p className="mb-8">
        Adjust which categories of cookies and tracking technologies you allow.
      </p>
      <div className="space-y-4">
        {(
          Object.keys(consent.categories) as Array<keyof typeof consent.categories>
        ).map((cat) => (
          <div key={cat} className="flex items-center justify-between">
            <label className="capitalize">
              {cat.replace('_', ' ')}{' '}
              {cat === 'essential' && '(required)'}
            </label>
            {cat === 'essential' ? (
              <input type="checkbox" checked readOnly />
            ) : (
              <input
                type="checkbox"
                checked={consent.categories[cat]}
                onChange={() => handleToggle(cat)}
              />
            )}
          </div>
        ))}
      </div>
      <div className="mt-8 flex gap-4">
        <Button
          type="button"
          onClick={handleSave}
          variant="secondary"
          size="md"
        >
          Save Preferences
        </Button>
        <Button
          type="button"
          onClick={() => window.history.back()}
          variant="outline"
          size="md"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
