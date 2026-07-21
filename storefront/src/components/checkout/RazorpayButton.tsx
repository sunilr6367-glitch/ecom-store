'use client';

import { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import { Button } from '@/design-system';

interface RazorpayButtonProps {
  orderId: string;        // Our DB order ID (UUID)
  checkoutToken: string;
  amount: number;         // Amount in paise
  currency?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

interface RazorpayCheckoutResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayPaymentFailureResponse {
  error?: {
    description?: string;
  };
}

interface RazorpayOptions {
  key?: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpayCheckoutResponse) => void | Promise<void>;
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpayInstance {
  on: (
    event: 'payment.failed',
    handler: (response: RazorpayPaymentFailureResponse) => void
  ) => void;
  open: () => void;
}

// Razorpay checkout.js is loaded dynamically from their CDN
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function RazorpayButton({
  orderId,
  checkoutToken,
  amount: _amount,
  currency = 'INR',
  customerName,
  customerEmail,
  customerPhone,
  onSuccess,
  onError,
}: RazorpayButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    loadRazorpayScript().then(setScriptLoaded);
  }, []);

  const handlePay = async () => {
    if (!scriptLoaded) {
      onError('Payment gateway failed to load. Please refresh and try again.');
      return;
    }

    setIsProcessing(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL;

      // Step 1: Create Razorpay order on our backend
      const res = await fetch(`${API_URL}/store/payments/razorpay/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          order_id: orderId,
          checkout_token: checkoutToken,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to initialize payment');
      }

      const { razorpay_order_id, amount: rzpAmount, key_id } = await res.json();

      // Step 2: Open Razorpay checkout popup
      const options: RazorpayOptions = {
        key: key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: rzpAmount,
        currency,
        name: 'Odhvica',
        description: `Order #${orderId.slice(0, 8)}`,
        image: '/logo.png',
        order_id: razorpay_order_id,
        prefill: {
          name: customerName || '',
          email: customerEmail || '',
          contact: customerPhone || '',
        },
        theme: {
          color: 'var(--ds-text-primary)',
        },
        handler: async (response) => {
          try {
            // Step 3: Verify payment signature on our backend
            const verifyRes = await fetch(
              `${API_URL}/store/payments/razorpay/verify`,
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                  order_id: orderId,
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  checkout_token: checkoutToken,
                }),
              }
            );

            if (!verifyRes.ok) {
              const err = await verifyRes.json();
              throw new Error(err.error || 'Payment verification failed');
            }

            onSuccess();
          } catch (err: unknown) {
            onError(
              err instanceof Error ? err.message : 'Payment verification failed'
            );
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            onError('Payment was cancelled. You can try again when ready.');
            setIsProcessing(false);
          },
        },
      };

      if (!window.Razorpay) {
        throw new Error('Payment gateway failed to load. Please refresh and try again.');
      }

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        onError(
          response.error?.description || 'Payment failed. Please try again.'
        );
        setIsProcessing(false);
      });
      rzp.open();
    } catch (err: unknown) {
      onError(
        err instanceof Error ? err.message : 'Failed to initialize payment'
      );
      setIsProcessing(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={handlePay}
      disabled={isProcessing || !scriptLoaded}
      variant="secondary"
      size="lg"
      fullWidth
      leadingIcon={<CreditCard size={16} />}
    >
      {isProcessing ? 'Processing Payment...' : 'Pay with Razorpay'}
    </Button>
  );
}
