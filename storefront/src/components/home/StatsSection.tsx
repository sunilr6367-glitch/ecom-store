'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

interface StatData {
  num: string;
  label: string;
}

interface StatsSectionProps {
  statsData: StatData[];
}

interface ParsedStatValue {
  numericValue: number;
  decimals: number;
  prefix: string;
  suffix: string;
  useGrouping: boolean;
}

const statSymbols = ['★', '✦', '◆', '✷'];

function parseStatValue(value: string): ParsedStatValue {
  const match = value.match(/-?\d[\d,]*(?:\.\d+)?/);

  if (!match || match.index === undefined) {
    return {
      numericValue: 0,
      decimals: 0,
      prefix: '',
      suffix: value,
      useGrouping: false,
    };
  }

  const numericPart = match[0];
  const normalized = numericPart.replace(/,/g, '');
  const numericValue = Number.parseFloat(normalized);
  const decimals = normalized.includes('.') ? normalized.split('.')[1].length : 0;

  return {
    numericValue: Number.isFinite(numericValue) ? numericValue : 0,
    decimals,
    prefix: value.slice(0, match.index),
    suffix: value.slice(match.index + numericPart.length),
    useGrouping: numericPart.includes(','),
  };
}

function formatAnimatedValue(parsed: ParsedStatValue, progressValue: number): string {
  const formattedNumber = progressValue.toLocaleString('en-US', {
    minimumFractionDigits: parsed.decimals,
    maximumFractionDigits: parsed.decimals,
    useGrouping: parsed.useGrouping,
  });

  return `${parsed.prefix}${formattedNumber}${parsed.suffix}`;
}

function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - progress, 3);
}

export function StatsSection({ statsData }: StatsSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hasAnimatedRef = useRef(false);

  const parsedStats = useMemo(() => statsData.map((stat) => parseStatValue(stat.num)), [statsData]);

  const [animatedValues, setAnimatedValues] = useState<string[]>(() =>
    parsedStats.map((parsed) => formatAnimatedValue(parsed, 0))
  );

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) {
      return;
    }

    const startAnimation = () => {
      if (hasAnimatedRef.current) {
        return;
      }

      hasAnimatedRef.current = true;
      const duration = 2000;
      const startTime = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutCubic(progress);

        setAnimatedValues(
          parsedStats.map((parsed) =>
            formatAnimatedValue(parsed, parsed.numericValue * easedProgress)
          )
        );

        if (progress < 1) {
          animationFrameRef.current = window.requestAnimationFrame(tick);
        }
      };

      animationFrameRef.current = window.requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            startAnimation();
          }
        });
      },
      {
        threshold: 0.25,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    observer.observe(section);

    return () => {
      observer.disconnect();
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [parsedStats]);

  return (
    <section ref={sectionRef} className="kv-page-gutter px-[var(--ds-space-md)] py-home-section-mobile md:px-[var(--ds-space-lg)] md:py-[var(--ds-space-2xl)] lg:px-[var(--ds-space-xl)] lg:py-home-section" data-home-section="11-stats">
      <div className="stats-row">
        {statsData.map((stat, index) => (
          <article key={stat.label} className="stat-entry">
            <span className="stat-symbol" aria-hidden="true">
              {statSymbols[index] || '•'}
            </span>
            <span className="stat-num">{animatedValues[index] ?? stat.num}</span>
            <span className="stat-label">{stat.label}</span>
          </article>
        ))}
      </div>

      <style jsx>{`
        .stats-row {
          max-width: 1360px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: var(--ds-space-2xl) var(--ds-space-lg);
        }

        .stat-entry {
          position: relative;
          display: flex;
          min-width: 0;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .stat-entry::after {
          content: '';
          position: absolute;
          top: 22%;
          right: -14px;
          width: 1px;
          height: 56%;
          background: linear-gradient(
            180deg,
            rgba(var(--ds-accent-gold-rgb), 0),
            rgba(var(--ds-accent-gold-rgb), 0.55),
            rgba(var(--ds-accent-gold-rgb), 0)
          );
        }

        .stat-entry:nth-child(2n)::after {
          display: none;
        }

        .stat-symbol {
          margin-bottom: var(--ds-space-sm);
          font-size: var(--ds-text-body-lg);
          line-height: var(--ds-leading-tight);
          color: var(--ds-accent-gold);
          text-shadow: 0 0 18px rgba(var(--ds-accent-gold-rgb), 0.14);
          animation: symbolFloat 4.2s ease-in-out infinite;
        }

        .stat-num {
          font-family: var(--ds-font-display);
          font-size: var(--ds-text-display-lg);
          font-weight: var(--ds-type-heading-weight);
          line-height: var(--ds-leading-tight);
          letter-spacing: var(--ds-type-heading-tracking);
          color: var(--ds-text-primary);
          white-space: nowrap;
        }

        .stat-label {
          margin-top: var(--ds-space-sm);
          font-size: var(--ds-text-body-xs);
          font-weight: var(--ds-type-label-weight);
          line-height: var(--ds-leading-relaxed);
          letter-spacing: var(--ds-type-label-tracking);
          text-transform: var(--ds-type-label-transform);
          color: rgba(var(--ds-text-secondary-rgb), 0.72);
        }

        @media (min-width: 768px) {
          .stats-row {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: var(--ds-space-md);
          }

          .stat-entry::after {
            right: -12px;
            display: block;
          }

          .stat-entry:last-child::after {
            display: none;
          }

          .stat-symbol {
            margin-bottom: var(--ds-space-md);
          }
        }

        @media (max-width: 767px) {
          .stat-num {
            font-size: var(--ds-text-display-md);
            white-space: normal;
          }
        }

        @keyframes symbolFloat {
          0%,
          100% {
            transform: translateY(0px) scale(1);
            opacity: 0.82;
          }
          50% {
            transform: translateY(-4px) scale(1.08);
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
}
