
import { Heading } from '@/design-system';
import { EditorialMedia } from '@/design-system';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

import { OptimizedImage } from '@/design-system';
import { api } from '@/lib/api';
import {
  buildArticleJsonLd,
  buildArticleMetadata,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
} from '@/lib/seo';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { post } = await api.getPost(slug);
    return buildArticleMetadata({
      title: `${post.seo_title || post.title} | Odhvica Journal`,
      description:
        post.seo_description ||
        post.excerpt ||
        `Read ${post.title} on the Odhvica Journal.`,
      path: `/journal/${slug}`,
      image: post.cover_image,
      keywords: post.seo_keywords
        ? post.seo_keywords.split(',').map((value: string) => value.trim())
        : [post.title, 'Odhvica Journal'],
    });
  } catch {
    return {
      title: 'Article Not Found',
      robots: { index: false, follow: false },
    };
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;

  let post;
  try {
    const data = await api.getPost(slug);
    post = data.post;
  } catch {
    notFound();
  }

  const schema = [
    buildArticleJsonLd({
      title: post.title,
      path: `/journal/${slug}`,
      description:
        post.seo_description ||
        post.excerpt ||
        `Read ${post.title} on the Odhvica Journal.`,
      image: post.cover_image,
      publishedAt: post.published_at,
      updatedAt: post.updated_at || post.published_at,
    }),
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Journal', path: '/journal' },
      { name: post.title, path: `/journal/${slug}` },
    ]),
  ];

  return (
    <article className="min-h-screen bg-surface-paper pb-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(schema),
        }}
      />

      <EditorialMedia as="div" variant="journal" className="text-inverse">
        {post.cover_image ? (
          <div className="absolute inset-0">
            <OptimizedImage
              src={post.cover_image}
              alt={`${post.title} - Odhvica Journal`}
              fill
              priority
              className="object-cover brightness-[0.85]"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[rgba(var(--ds-black-rgb),0.50)] to-transparent" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-primary" />
        )}

        <div className="ds-page-container absolute inset-0 mx-auto flex w-full max-w-page flex-col justify-between p-6 md:p-12 lg:px-20">
          <Link
            href="/journal"
            className="flex w-fit items-center gap-2 text-body-sm font-bold  tracking-token-wider hover:text-disabled"
          >
            <ArrowLeft size={16} />
            Back to Journal
          </Link>

          <div className="max-w-4xl space-y-4">
            <div className="flex items-center gap-4 text-body-xs font-bold  tracking-token-wider opacity-80">
              <span>{new Date(post.published_at).toLocaleDateString()}</span>
              <span>&bull;</span>
              <span>Odhvica Editorial</span>
            </div>
            <Heading role="page" className="font-display text-display-xl font-semibold  tracking-token-wide md:text-display-xl">
              {post.title}
            </Heading>
          </div>
        </div>
      </EditorialMedia>

      <div className="mx-auto max-w-3xl px-6 py-token-xl md:py-token-2xl lg:py-token-3xl">
        {post.excerpt && (
          <p className="mb-12 border-l-4 border-primary pl-6 font-display text-display-md font-medium leading-token-relaxed text-secondary">
            {post.excerpt}
          </p>
        )}

        <div className="prose prose-lg max-w-none whitespace-pre-wrap font-light text-primary">
          {post.content}
        </div>
      </div>
    </article>
  );
}
