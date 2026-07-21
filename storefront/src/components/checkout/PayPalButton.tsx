'use client';

import { useState } from 'react';
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
} from '@paypal/react-paypal-js';

interface PayPalButtonProps {
  orderId: string;      // Our DB order UUID
  checkoutToken: string;
  currency?: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';

function PayPalButtonInner({
  orderId,
  checkoutToken,
  onSuccess,
  onError,
}: PayPalButtonProps) {
  const [{ isPending }] = usePayPalScriptReducer();
  const [isProcessing, setIsProcessing] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const createOrder = async () => {
    const res = await fetch(`${API_URL}/store/payments/paypal/create-order`, {
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
      throw new Error(err.error || 'Failed to create PayPal order');
    }

    const { paypal_order_id } = await res.json();
    return paypal_order_id;
  };

  const onApprove = async (data: { orderID: string }) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/store/payments/paypal/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          order_id: orderId,
          paypal_order_id: data.orderID,
          checkout_token: checkoutToken,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'PayPal capture failed');
      }

      onSuccess();
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isPending || isProcessing) {
    return (
      <div className="w-full py-4 bg-parchment border border-border-subtle text-center text-body-sm text-muted">
        {isProcessing ? 'Processing payment...' : 'Loading PayPal...'}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-body-xs text-muted text-center  tracking-token-wider font-bold">
        Pay with PayPal
      </p>
      <PayPalButtons
        style={{
          layout: 'vertical',
          color: 'black',
          shape: 'rect',
          label: 'pay',
          height: 48,
        }}
        createOrder={createOrder}
        onApprove={onApprove}
        onError={(err) => {
          onError(String(err) || 'PayPal encountered an error');
        }}
        onCancel={() => {
          // User cancelled — no action needed
        }}
      />
    </div>
  );
}

export default function PayPalButton(props: PayPalButtonProps) {
  if (!clientId) {
    return (
      <div className="w-full py-4 bg-parchment border border-border-subtle text-center text-body-sm text-muted">
        PayPal not configured
      </div>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        clientId,
        currency: props.currency?.toUpperCase() || 'USD',
        intent: 'capture',
        components: 'buttons',
      }}
    >
      <PayPalButtonInner {...props} />
    </PayPalScriptProvider>
  );
}
