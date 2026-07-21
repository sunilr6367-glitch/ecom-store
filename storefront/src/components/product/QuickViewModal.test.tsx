import type { AnchorHTMLAttributes } from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { QuickViewModal } from './QuickViewModal';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/components/ui/OptimizedImage', () => ({
  default: ({
    alt,
    src,
  }: {
    alt: string;
    src: string;
  }) => <div aria-label={alt} data-src={src} data-testid="quickview-image" />,
}));

const addItem = vi.fn();
const getReviews = vi.fn();

vi.mock('@/context/cart-context', () => ({
  useCart: () => ({ addItem }),
}));

vi.mock('@/context/currency-context', () => ({
  useCurrency: () => ({ formatPrice: (amount: number) => `Rs ${amount}` }),
}));

vi.mock('@/lib/api', () => ({
  api: {
    getReviews: (...args: unknown[]) => getReviews(...args),
  },
}));

describe('QuickViewModal', () => {
  beforeEach(() => {
    addItem.mockReset();
    getReviews.mockReset();
    getReviews.mockResolvedValue({ reviews: [] });
  });

  it('lets shoppers navigate through multiple product images', async () => {
    const view = render(
      <QuickViewModal
        isOpen
        onClose={vi.fn()}
        product={{
          id: 'prod_1',
          title: 'Test Product',
          handle: 'test-product',
          images: ['https://example.com/1.jpg', 'https://example.com/2.jpg'],
          variants: [
            {
              id: 'variant_1',
              title: 'Default',
              prices: [{ amount: 1200, currency_code: 'inr' }],
            },
          ],
        }}
      />
    );

    expect(view.getByTestId('quickview-image')).toHaveAttribute(
      'data-src',
      'https://example.com/1.jpg'
    );

    fireEvent.click(view.getByLabelText('Show next product image'));

    await waitFor(() =>
      expect(view.getByTestId('quickview-image')).toHaveAttribute(
        'data-src',
        'https://example.com/2.jpg'
      )
    );

    fireEvent.keyDown(window, { key: 'ArrowLeft' });

    await waitFor(() =>
      expect(view.getByTestId('quickview-image')).toHaveAttribute(
        'data-src',
        'https://example.com/1.jpg'
      )
    );
  });
});
