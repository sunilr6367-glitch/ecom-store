'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function CatalogRequestForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    
    const formData = new FormData(e.currentTarget);
    
    // Honeypot check
    if (formData.get('website')) {
      setStatus('success'); // Silently fail bots by showing success
      return;
    }
    
    try {
      const payload = {
        company_name: formData.get('company_name'),
        contact_name: formData.get('contact_name'),
        email: formData.get('email'),
        phone: formData.get('phone') || 'N/A', // phone is required by schema
        country: 'N/A', // required by schema
        business_type: 'other', // required by schema
        message: 'Requested Full PDF Catalog',
      };
      
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const response = await fetch(`${baseUrl}/wholesale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error('Failed to submit request');
      
      setStatus('success');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-[var(--ds-surface-paper)] border border-border-subtle rounded-lg p-8 text-center">
        <h3 className="font-heading text-xl font-bold text-success mb-2">Request Sent!</h3>
        <p className="text-body-sm text-[var(--ds-text-secondary)]">
          Thank you. Our B2B team will email you the catalog shortly.
        </p>
      </div>
    );
  }

  return (
    <div id="request-catalog" className="bg-[var(--ds-surface-paper)] border border-border-subtle shadow-sm rounded-lg p-6 sm:p-10">
      <div className="text-center mb-8">
        <h3 className="font-heading text-display-xs text-[var(--ds-text-primary)] mb-3">Request Full PDF Catalog</h3>
        <p className="text-body-sm text-[var(--ds-text-secondary)]">
          Get our complete collection with wholesale pricing tiers delivered to your inbox.
        </p>
      </div>
      
      {status === 'error' && (
        <div className="mb-6 p-4 bg-[var(--ds-danger-bg)] border border-[var(--ds-danger)] rounded-md text-[var(--ds-danger)] text-sm text-center">
          Network error. Please try again or email us directly.
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
        {/* Honeypot field - hidden from users */}
        <div aria-hidden="true" className="hidden absolute w-0 h-0 overflow-hidden">
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </div>
        
        <div>
          <Input 
            required 
            placeholder="Company Name" 
            name="company_name" 
            disabled={status === 'loading'}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input 
            required 
            placeholder="Contact Name" 
            name="contact_name"
            disabled={status === 'loading'}
          />
          <Input 
            required 
            type="email" 
            placeholder="Work Email" 
            name="email"
            disabled={status === 'loading'}
          />
        </div>
        {status === 'error' && (
          <p className="text-sm text-[var(--ds-danger)]">Failed to submit request. Please try again.</p>
        )}
        <Button 
          type="submit" 
          variant="primary" 
          fullWidth 
          disabled={status === 'loading'}
          className="mt-4"
        >
          {status === 'loading' ? 'Sending Request...' : 'Send Me The Catalog'}
        </Button>
      </form>
    </div>
  );
}
