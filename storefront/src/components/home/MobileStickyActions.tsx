'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MessageCircle, ShoppingBag, Sparkles } from 'lucide-react';
import { useCart } from '@/context/cart-context';

function whatsappHref(message: string) {
  return `https://wa.me/message/odhvica?text=${encodeURIComponent(message)}&utm_source=homepage&utm_medium=sticky`;
}

export function MobileStickyActions() {
  const [visible, setVisible] = useState(false);
  const { totalItems } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > Math.min(520, window.innerHeight * 0.65));
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`mobile-sticky-actions ${visible ? 'is-visible' : ''}`}
      aria-label="Mobile shopping shortcuts"
    >
      <Link href="/products?sort=newest">
        <Sparkles aria-hidden="true" size={16} strokeWidth={1.8} />
        <span>Shop New</span>
      </Link>
      <a
        href={whatsappHref('Hi, I need help choosing a Odhvica piece')}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircle aria-hidden="true" size={16} strokeWidth={1.8} />
        <span>WhatsApp</span>
      </a>
      <Link href="/cart">
        <ShoppingBag aria-hidden="true" size={16} strokeWidth={1.8} />
        <span>Cart{totalItems > 0 ? ` (${totalItems})` : ''}</span>
      </Link>
    </nav>
  );
}
