import type { Metadata } from 'next';

import {
  ContentContainer,
  CraftStorySection,
  ImageTextSplit,
  InlineCTA,
  PageHero,
  QuoteBlock,
} from '@/components/content/ContentPageSystem';
import { buildBasicPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildBasicPageMetadata({
  title: 'Kantha Craft | Odhvica',
  description: 'A short guide to Kantha-inspired quilting and stitched textile craft in Odhvica handmade pieces.',
  path: '/about/kantha',
});

export default function KanthaPage() {
  return (
    <>
      <PageHero
        eyebrow="Craft Story"
        title="Kantha Craft"
        intro="Kantha is known for visible stitch texture, layered fabric, and a human rhythm that machine-perfect surfaces cannot reproduce."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'About', href: '/about' },
          { label: 'Kantha Craft' },
        ]}
      />
      <ContentContainer
        footer={
          <InlineCTA
            title="See Kantha-inspired pieces"
            body="Browse pieces where stitch texture, quilting, and layered cloth carry the design."
            links={[
              { label: 'Shop Collection', href: '/products', variant: 'primary' },
              { label: 'Our Craft', href: '/about/our-craft' },
            ]}
          />
        }
      >
        <ImageTextSplit
          eyebrow="Running stitch"
          title="A surface made by time"
          imageSrc="/images/home/category-sarees.jpg"
          imageAlt="Kantha-inspired Odhvica jacket with visible embroidery"
          imageLabel="Close stitch texture across layered cloth"
          body={
            <>
              <p>
                Kantha is built from repetition. A line of stitch travels across
                layered cloth, then another, then another, until the surface
                begins to hold memory. The texture is subtle from a distance and
                intimate up close.
              </p>
              <p>
                At Odhvica, Kantha informs the way we think about quilting,
                repair, reuse, and tactility. The stitch is not decoration
                pasted on at the end. It is structure, rhythm, and evidence of
                handwork.
              </p>
            </>
          }
        />
        <QuoteBlock quote="Kantha asks you to notice the interval between one stitch and the next." />
        <CraftStorySection eyebrow="Heritage" title="Not machine-perfect, deliberately human">
          <p>
            Small variations in stitch length and density are part of the craft.
            They show where the maker adjusted to fabric weight, curve, and
            touch. This is why two handmade pieces may feel related without
            being identical.
          </p>
          <p>
            That human texture is central to Odhvica&apos;s idea of luxury: not
            excess, but attention.
          </p>
        </CraftStorySection>
      </ContentContainer>
    </>
  );
}
