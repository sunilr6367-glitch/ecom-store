import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  ContentContainer,
  enhanceHtmlContent,
  extractHtmlToc,
  InlineCTA,
  PageHero,
} from '@/components/content/ContentPageSystem';
import { api } from '@/lib/api';
import {
  buildBasicPageMetadata,
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
  serializeJsonLd,
} from '@/lib/seo';
import { storefrontTrust } from '@/config/storefront-trust';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { page } = await api.getPage(slug);
    const title = page.seo_title || page.title;
    const description =
      page.seo_description ||
      `Explore ${page.title} at Odhvica for customer support, policy details, and brand information.`;

    return buildBasicPageMetadata({
      title: `${title} | Odhvica`,
      description,
      path: `/pages/${slug}`,
      keywords: [page.title, 'Odhvica'],
    });
  } catch {
    return {
      title: 'Page Not Found',
      robots: { index: false, follow: false },
    };
  }
}

export default async function DynamicPage({ params }: Props) {
  const { slug } = await params;

  let page;
  try {
    const data = await api.getPage(slug);
    page = data.page;
  } catch {
    notFound();
  }

  const schema = [
    buildWebPageJsonLd({
      title: page.title,
      path: `/pages/${slug}`,
      description:
        page.seo_description ||
        `Explore ${page.title} at Odhvica for policies, support information, and brand guidance.`,
    }),
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: page.title, path: `/pages/${slug}` },
    ]),
  ];
  const enhancedContent = enhanceHtmlContent(page.content);
  const toc = extractHtmlToc(enhancedContent);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: serializeJsonLd(schema),
        }}
      />

      <PageHero
        eyebrow="Odhvica Pages"
        title={page.title}
        intro={
          page.seo_description ||
          `Explore ${page.title} at Odhvica for policies, support information, and brand guidance.`
        }
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: page.title },
        ]}
      />

      <ContentContainer
        toc={toc}
        footer={
          <InlineCTA
            title="Need help finding the next step?"
            body="Our help routes connect policy details with order tracking, support, and live customer care."
            links={[
              { label: 'Help Center', href: storefrontTrust.policyRoutes.help },
              {
                label: 'Contact Support',
                href: storefrontTrust.policyRoutes.contact,
              },
              { label: 'Track Order', href: storefrontTrust.policyRoutes.track },
            ]}
          />
        }
      >
        <div
          className="content-rich"
          dangerouslySetInnerHTML={{ __html: enhancedContent }}
        />
      </ContentContainer>
    </>
  );
}
