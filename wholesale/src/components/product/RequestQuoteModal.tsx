'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface RequestQuoteModalProps {
  productTitle: string;
  variantDetails: string;
  quantity: number;
  estimatedTotal: number;
}

export function RequestQuoteModal({ productTitle, variantDetails, quantity, estimatedTotal }: RequestQuoteModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    
    const formData = new FormData(e.currentTarget);
    
    // Honeypot check
    if (formData.get('website')) {
      setStatus('success'); // Silently fail bots
      setTimeout(() => setIsOpen(false), 2000);
      return;
    }
    
    try {
      const messageContent = `Quote Request:\nProduct: ${productTitle}\nVariant: ${variantDetails}\nQuantity: ${quantity} Units\nEstimated Total: ₹${estimatedTotal.toLocaleString()}`;
      
      const payload = {
        company_name: formData.get('company_name'),
        contact_name: formData.get('contact_name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        country: 'N/A', // required by schema
        business_type: 'other', // required by schema
        message: messageContent,
      };
      
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
      const response = await fetch(`${baseUrl}/wholesale`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) throw new Error('Failed to submit quote request');
      
      setStatus('success');
      setTimeout(() => setIsOpen(false), 2000);
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <>
      <Button variant="primary" size="lg" fullWidth onClick={() => setIsOpen(true)}>
        Request Quote
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--ds-surface-page)] w-full max-w-lg rounded-xl shadow-xl overflow-hidden animate-fade-in-up">
            <div className="flex justify-between items-center p-6 border-b border-[var(--ds-border-subtle)]">
              <h2 className="font-heading text-xl font-bold text-[var(--ds-text-primary)]">Request a Quote</h2>
              <button onClick={() => setIsOpen(false)} className="text-[var(--ds-text-secondary)] hover:text-[var(--ds-text-primary)]">
                &times;
              </button>
            </div>
            
            <div className="p-6">
              <div className="bg-[var(--ds-surface-soft)] p-4 rounded-md mb-6 border border-[var(--ds-border-subtle)] text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-[var(--ds-text-secondary)]">Product:</span>
                  <span className="font-medium text-right">{productTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--ds-text-secondary)]">Variant:</span>
                  <span className="font-medium text-right">{variantDetails}</span>
                </div>
                <div className="flex justify-between border-t border-[var(--ds-border-subtle)] pt-2 mt-2">
                  <span className="text-[var(--ds-text-secondary)]">Requested Qty:</span>
                  <span className="font-bold text-right">{quantity} Units</span>
                </div>
              </div>

              {status === 'success' ? (
                <div className="text-center py-8">
                  <h3 className="text-success font-bold text-lg mb-2">Quote Request Sent!</h3>
                  <p className="text-[var(--ds-text-secondary)]">Our sales team will contact you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {status === 'error' && (
                    <div className="p-3 bg-[var(--ds-danger-bg)] border border-[var(--ds-danger)] rounded-md text-[var(--ds-danger)] text-sm text-center">
                      Network error. Please try again.
                    </div>
                  )}
                  
                  {/* Honeypot field - hidden from users */}
                  <div aria-hidden="true" className="hidden absolute w-0 h-0 overflow-hidden">
                    <input type="text" name="website" tabIndex={-1} autoComplete="off" />
                  </div>
                  
                  <Input required placeholder="Company Name" name="company_name" disabled={status === 'loading'} />
                  <Input required placeholder="Contact Name" name="contact_name" disabled={status === 'loading'} />
                  <Input required type="email" placeholder="Work Email" name="email" disabled={status === 'loading'} />
                  <Input required type="tel" placeholder="Phone Number" name="phone" disabled={status === 'loading'} />
                  
                  <div className="pt-4">
                    <Button type="submit" variant="primary" fullWidth disabled={status === 'loading'}>
                      {status === 'loading' ? 'Submitting...' : 'Submit Quote Request'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
