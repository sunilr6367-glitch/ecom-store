import {
  ContentContainer,
  getEffectiveDate,
  InlineCTA,
  PageHero,
  PolicyMarkdown,
  stripMarkdownPageChrome,
  extractMarkdownToc,
} from '@/components/content/ContentPageSystem';
import { storefrontTrust } from '@/config/storefront-trust';
import {
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
  serializeJsonLd,
} from '@/lib/seo';

type StaticPolicyPageProps = {
  title: string;
  path: string;
  description: string;
  content: string;
};

export function StaticPolicyPage({
  title,
  path,
  description,
  content,
}: StaticPolicyPageProps) {
  const effectiveDate = getEffectiveDate(content);
  const bodyContent = stripMarkdownPageChrome(content, title);
  const toc = extractMarkdownToc(bodyContent);
  const schema = [
    buildWebPageJsonLd({
      title,
      path,
      description,
    }),
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: title, path },
    ]),
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
      />

      <PageHero
        eyebrow="Policies"
        title={title}
        intro={description}
        meta={effectiveDate ? `Effective ${effectiveDate}` : undefined}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: title },
        ]}
      />

      <ContentContainer
        toc={toc}
        footer={
          <InlineCTA
            title="Still need a hand?"
            body="Use the most relevant support route so your order, payment, or return question reaches the right desk."
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
        <PolicyMarkdown content={bodyContent} />
      </ContentContainer>
    </>
  );
}
