import { buildBreadcrumbJsonLd, buildProductFaqJsonLd, buildProductJsonLd, serializeJsonLd } from '@/lib/seo';
import type { BreadcrumbItem } from '@/lib/seo';
import type { Product } from '@/types';

export function ProductSchema({
  product,
  breadcrumbItems,
}: {
  product: Product;
  breadcrumbItems: BreadcrumbItem[];
}) {
  const jsonLdData = [
    buildProductJsonLd(product),
    buildProductFaqJsonLd(product),
    buildBreadcrumbJsonLd(breadcrumbItems),
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(jsonLdData),
      }}
    />
  );
}
