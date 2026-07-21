import Link from 'next/link';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { ButtonLink, OptimizedImage, cardClasses } from '@/design-system';
import { cn } from '@/lib/utils';

export type TocItem = {
  id: string;
  label: string;
  level?: 2 | 3;
};

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type PageHeroProps = {
  eyebrow: string;
  title: string;
  intro?: string;
  meta?: string;
  breadcrumbs?: BreadcrumbItem[];
  align?: 'center' | 'left';
};

type ContentContainerProps = {
  toc?: TocItem[];
  children: React.ReactNode;
  footer?: React.ReactNode;
};

type SectionBlockProps = {
  eyebrow?: string;
  title?: string;
  intro?: string;
  children?: React.ReactNode;
  className?: string;
};

type InfoCardProps = {
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
  href?: string;
  cta?: string;
};

type InlineCTAProps = {
  title: string;
  body?: string;
  links: Array<{ label: string; href: string; variant?: 'primary' | 'secondary' }>;
};

type FAQItem = {
  question: string;
  answer: string;
};

type ImageTextSplitProps = {
  eyebrow?: string;
  title: string;
  body: React.ReactNode;
  imageSrc?: string;
  imageAlt?: string;
  imageLabel?: string;
  reverse?: boolean;
};

const HEADING_RE = /^(#{2,4})\s+(.+)$/gm;

export function slugifyHeading(value: string) {
  return value
    .toLowerCase()
    .replace(/&amp;/g, 'and')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
}

function textFromNode(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textFromNode).join('');
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return textFromNode(node.props.children);
  }
  return '';
}

export function extractMarkdownToc(content: string): TocItem[] {
  const items: TocItem[] = [];
  const seen = new Map<string, number>();
  let match: RegExpExecArray | null;

  while ((match = HEADING_RE.exec(content)) !== null) {
    const level = match[1].length;
    if (level > 3) continue;

    const label = match[2].replace(/[*_`]/g, '').trim();
    const baseId = slugifyHeading(label);
    const count = seen.get(baseId) || 0;
    seen.set(baseId, count + 1);
    items.push({
      id: count ? `${baseId}-${count + 1}` : baseId,
      label,
      level: level as 2 | 3,
    });
  }

  return items;
}

export function stripMarkdownPageChrome(content: string, title: string) {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return content
    .replace(new RegExp(`^#{1,2}\\s+${escaped}\\s*\\n+`, 'i'), '')
    .replace(/^Effective Date:\s*([^\n]+)\n+/i, '')
    .trim();
}

export function getEffectiveDate(content: string) {
  return content.match(/Effective Date:\s*([^\n]+)/i)?.[1]?.trim();
}

export function enhanceHtmlContent(content: string) {
  const seen = new Map<string, number>();

  return content.replace(
    /<h([2-4])([^>]*)>(.*?)<\/h\1>/gi,
    (full, level: string, attrs: string, inner: string) => {
      if (/\sid=/.test(attrs)) return full;

      const label = inner.replace(/<[^>]+>/g, '').trim();
      const baseId = slugifyHeading(label);
      const count = seen.get(baseId) || 0;
      seen.set(baseId, count + 1);
      const id = count ? `${baseId}-${count + 1}` : baseId;
      return `<h${level}${attrs} id="${id}">${inner}</h${level}>`;
    }
  );
}

export function extractHtmlToc(content: string): TocItem[] {
  const items: TocItem[] = [];
  const seen = new Map<string, number>();
  const headingRegex = /<h([2-3])[^>]*>(.*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = headingRegex.exec(content)) !== null) {
    const label = match[2].replace(/<[^>]+>/g, '').trim();
    const baseId = slugifyHeading(label);
    const count = seen.get(baseId) || 0;
    seen.set(baseId, count + 1);
    items.push({
      id: count ? `${baseId}-${count + 1}` : baseId,
      label,
      level: Number(match[1]) as 2 | 3,
    });
  }

  return items;
}

export function PageHero({
  eyebrow,
  title,
  intro,
  meta,
  breadcrumbs,
  align = 'center',
}: PageHeroProps) {
  return (
    <header className={cn('content-hero', align === 'left' && 'content-hero--left')}>
      <div className="content-shell">
        {breadcrumbs?.length ? (
          <nav aria-label="Breadcrumb" className="content-breadcrumb">
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={`${item.label}-${index}`}>
                {item.href ? (
                  <Link href={item.href}>{item.label}</Link>
                ) : (
                  <span aria-current="page">{item.label}</span>
                )}
                {index < breadcrumbs.length - 1 ? <span aria-hidden="true">/</span> : null}
              </React.Fragment>
            ))}
          </nav>
        ) : null}
        <p className="content-eyebrow">{eyebrow}</p>
        <h1 className="font-display text-display-lg text-primary leading-token-tight">{title}</h1>
        {intro ? <p className="content-hero__intro">{intro}</p> : null}
        {meta ? <p className="content-hero__meta">{meta}</p> : null}
      </div>
    </header>
  );
}

export function ContentContainer({ toc, children, footer }: ContentContainerProps) {
  return (
    <div className="content-page-band">
      <div className="content-layout">
        {toc?.length ? <StickyTableOfContents items={toc} /> : null}
        <article className="content-article">
          {children}
          {footer}
        </article>
      </div>
    </div>
  );
}

export function StickyTableOfContents({ items }: { items: TocItem[] }) {
  if (items.length < 2) return null;

  return (
    <aside className="content-toc" aria-label="On this page">
      <details className="content-toc__mobile">
        <summary>On this page</summary>
        <TocLinks items={items} />
      </details>
      <nav className="content-toc__desktop">
        <p>On this page</p>
        <TocLinks items={items} />
      </nav>
    </aside>
  );
}

function TocLinks({ items }: { items: TocItem[] }) {
  return (
    <ol>
      {items.map((item) => (
        <li key={item.id} className={item.level === 3 ? 'is-nested' : undefined}>
          <a href={`#${item.id}`}>{item.label}</a>
        </li>
      ))}
    </ol>
  );
}

export function SectionBlock({
  eyebrow,
  title,
  intro,
  children,
  className,
}: SectionBlockProps) {
  return (
    <section className={cn('section-block', className)}>
      {eyebrow ? <p className="content-eyebrow">{eyebrow}</p> : null}
      {title ? <h2 className="font-display text-display-sm text-primary leading-token-tight mt-8">{title}</h2> : null}
      {intro ? <p className="section-block__intro">{intro}</p> : null}
      {children}
    </section>
  );
}

export function EditorialText({ children }: { children: React.ReactNode }) {
  return <div className="editorial-text">{children}</div>;
}

export function LegalSection({ children }: { children: React.ReactNode }) {
  return <section className="legal-section">{children}</section>;
}

export function InfoCard({ eyebrow, title, children, href, cta }: InfoCardProps) {
  const body = (
    <>
      {eyebrow ? <p className="info-card__eyebrow">{eyebrow}</p> : null}
      <h3 className="font-display text-display-xs text-primary leading-token-tight mt-6">{title}</h3>
      <div className="info-card__body">{children}</div>
      {href && cta ? <span className="info-card__cta">{cta}</span> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn(cardClasses, 'info-card info-card--link')}>
        {body}
      </Link>
    );
  }

  return <div className={cn(cardClasses, 'info-card')}>{body}</div>;
}

export function PolicyTable({ children }: { children: React.ReactNode }) {
  return <div className="policy-table">{children}</div>;
}

export function HighlightBox({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <aside className="highlight-box">
      {title ? <h3 className="font-display text-display-xs text-primary leading-token-tight mt-6">{title}</h3> : null}
      <div>{children}</div>
    </aside>
  );
}

export function InlineCTA({ title, body, links }: InlineCTAProps) {
  return (
    <aside className="inline-cta">
      <div>
        <p className="content-eyebrow">Need help?</p>
        <h2 className="font-display text-display-sm text-primary leading-token-tight mt-8">{title}</h2>
        {body ? <p>{body}</p> : null}
      </div>
      <div className="inline-cta__links">
        {links.map((link) => (
          <ButtonLink
            key={link.href}
            href={link.href}
            variant={link.variant === 'primary' ? 'secondary' : 'outline'}
            size="md"
          >
            {link.label}
          </ButtonLink>
        ))}
      </div>
    </aside>
  );
}

export function FAQAccordion({ items }: { items: FAQItem[] }) {
  return (
    <div className="faq-accordion">
      {items.map((item, index) => (
        <details key={item.question} open={index === 0}>
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function QuoteBlock({
  quote,
  credit,
}: {
  quote: string;
  credit?: string;
}) {
  return (
    <figure className="quote-block">
      <blockquote>{quote}</blockquote>
      {credit ? <figcaption>{credit}</figcaption> : null}
    </figure>
  );
}

export function ImageTextSplit({
  eyebrow,
  title,
  body,
  imageSrc,
  imageAlt,
  imageLabel,
  reverse = false,
}: ImageTextSplitProps) {
  return (
    <section className={cn('image-text-split', reverse && 'image-text-split--reverse')}>
      <div className="image-text-split__media" aria-label={imageLabel || title}>
        {imageSrc ? (
          <OptimizedImage
            src={imageSrc}
            alt={imageAlt || imageLabel || title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 42vw"
            className="object-cover object-[center_58%]"
          />
        ) : (
          <span>{imageLabel || 'Odhvica atelier image'}</span>
        )}
      </div>
      <div className="image-text-split__content">
        {eyebrow ? <p className="content-eyebrow">{eyebrow}</p> : null}
        <h2 className="font-display text-display-sm text-primary leading-token-tight mt-8">{title}</h2>
        <div className="editorial-text">{body}</div>
      </div>
    </section>
  );
}

export function CraftStorySection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="craft-story-section">
      <p className="content-eyebrow">{eyebrow}</p>
      <h2 className="font-display text-display-sm text-primary leading-token-tight mt-8">{title}</h2>
      <div className="editorial-text">{children}</div>
    </section>
  );
}

export function PolicyMarkdown({ content }: { content: string }) {
  const headingCounts = new Map<string, number>();

  function headingId(children: React.ReactNode) {
    const baseId = slugifyHeading(textFromNode(children));
    const count = headingCounts.get(baseId) || 0;
    headingCounts.set(baseId, count + 1);
    return count ? `${baseId}-${count + 1}` : baseId;
  }

  return (
    <div className="content-rich">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => <h2 id={headingId(children)}>{children}</h2>,
          h3: ({ children }) => <h3 id={headingId(children)}>{children}</h3>,
          h4: ({ children }) => <h4 className="font-display text-display-sm text-primary">{children}</h4>,
          table: ({ children }) => (
            <PolicyTable>
              <table>{children}</table>
            </PolicyTable>
          ),
          a: ({ href, children }) => <a href={href || '#'}>{children}</a>,
          hr: () => <hr aria-hidden="true" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
