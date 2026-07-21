'use client';

import { useEffect } from 'react';

/**
 * RevealOnScroll — wraps children and adds/removes .visible on .reveal elements
 * when they enter/leave viewport. Works with the .reveal CSS class in globals.css.
 * Must be 'use client' since it uses IntersectionObserver.
 */
export function RevealOnScroll({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  useEffect(() => {
    const observeElements = () => {
      const revealEls = document.querySelectorAll('.reveal');
      revealEls.forEach((el) => observer.observe(el));
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -20px 0px',
      }
    );

    // Initial observation
    observeElements();

    // Re-check after a brief delay for any late-mounting components
    const timer = setTimeout(observeElements, 1000);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return <>{children}</>;
}

/**
 * StatReveal — specifically handles stat items with staggered animation
 */
export function StatReveal() {
  useEffect(() => {
    const statItems = document.querySelectorAll('[data-stat-reveal]');

    const handleIntersect = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('visible');
          }, i * 100);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersect, {
      threshold: 0.2,
    });

    statItems.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return null;
}
