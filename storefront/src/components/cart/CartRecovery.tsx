'use client';

import { useCart } from '@/context/cart-context';
import { ShoppingCart, ArrowRight } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Button, Modal } from '@/design-system';

export function CartRecovery() {
  const { savedCartCount, recoverSavedCart, dismissSavedCart } = useCart();
  const [isVisible, setIsVisible] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoverError, setRecoverError] = useState<string | null>(null);

  useEffect(() => {
    if (savedCartCount > 0) {
      // Delay showing the modal slightly for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [savedCartCount]);

  const handleDismiss = useCallback(() => {
    setIsVisible(false);
    dismissSavedCart();
  }, [dismissSavedCart]);

  const handleRecover = async () => {
    setRecoverError(null);
    setIsRecovering(true);
    try {
      await recoverSavedCart();
      setIsVisible(false);
    } catch (err) {
      console.error('Failed to recover cart:', err);
      setRecoverError('Failed to restore cart. Please try again.');
      // Keep modal visible on failure
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <Modal
      isOpen={isVisible && savedCartCount > 0}
      onClose={handleDismiss}
      title="Welcome Back!"
      className="max-w-md"
      bodyClassName="p-[var(--ds-space-lg)]"
    >
        <div className="mb-[var(--ds-space-md)] flex items-start gap-[var(--ds-space-xs)]">
          <div className="flex items-center gap-[var(--ds-space-xs)]">
            <div className="w-12 h-12 bg-surface-soft rounded-full flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-body-sm text-muted">
                You have items in your saved cart
              </p>
            </div>
          </div>
        </div>

        <div className="bg-parchment p-4 rounded-lg mb-6">
          <p className="text-secondary text-body-sm">
            You have{' '}
            <span className="font-semibold text-primary">
              {savedCartCount} item{savedCartCount > 1 ? 's' : ''}
            </span>{' '}
            in your cart from your last visit.
          </p>
          <p className="text-muted text-body-xs mt-2">
            Would you like to restore them?
          </p>
        </div>

        {recoverError && (
          <div className="bg-danger-bg border border-danger text-error px-4 py-2 rounded text-body-sm mb-4">
            {recoverError}
          </div>
        )}

        <div className="flex gap-[var(--ds-space-xs)]">
          <Button
            type="button"
            onClick={handleDismiss}
            variant="outline"
            size="md"
            className="flex-1"
            disabled={isRecovering}
          >
            No, start fresh
          </Button>
          <Button
            type="button"
            onClick={handleRecover}
            disabled={isRecovering}
            variant="secondary"
            size="md"
            className="flex-1"
            trailingIcon={!isRecovering ? <ArrowRight size={16} /> : null}
          >
            {isRecovering ? 'Restoring...' : 'Restore Cart'}
          </Button>
        </div>
    </Modal>
  );
}
