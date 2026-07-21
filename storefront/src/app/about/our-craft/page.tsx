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
  title: 'Our Craft | Odhvica',
  description: 'Learn about Odhvica handmade textile craft, Jaipur block printing, quilting, and artisan-made cotton accessories.',
  path: '/about/our-craft',
});

export default function OurCraftPage() {
  return (
    <>
      <PageHero
        eyebrow="Craft Story"
        title="Our Craft"
        intro="Odhvica pieces are shaped by handmade textile traditions: block printing, quilting, embroidery, careful finishing, and small-batch production."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'About', href: '/about' },
          { label: 'Our Craft' },
        ]}
      />
      <ContentContainer
        footer={
          <InlineCTA
            title="Explore the collection through craft"
            body="Start with the pieces, then follow the stitches, blocks, and textile stories that shaped them."
            links={[
              { label: 'Shop Products', href: '/products', variant: 'primary' },
              { label: 'Read Journal', href: '/journal' },
            ]}
          />
        }
      >
        <ImageTextSplit
          eyebrow="Made slowly"
          title="The work begins before the first stitch"
          imageSrc="/images/home/atelier-story.jpg"
          imageAlt="Hand embroidered Odhvica jacket showing textile detail"
          imageLabel="Hands arranging cotton, carved blocks, and quilt layers"
          body={
            <>
              <p>
                Every Odhvica piece begins with material choice: the feel of
                cotton, the strength of a seam, the softness a quilt will carry
                after many uses. We design around touch first because handmade
                clothing and home textiles should feel lived with, not staged.
              </p>
              <p>
                Block printing, quilting, embroidery, and finishing are treated
                as connected steps rather than decorative add-ons. The result is
                a quieter kind of luxury: visible hands, careful rhythm, and
                pieces made in small batches.
              </p>
            </>
          }
        />
        <QuoteBlock quote="A handmade object should not shout that it is rare. It should reward the person who keeps looking." />
        <CraftStorySection eyebrow="Process" title="A rhythm of many hands">
          <p>
            Fabric is cut, printed, layered, stitched, checked, pressed, and
            packed with the restraint of a workshop that knows repetition is
            part of beauty. Slight shifts in print placement, stitch density,
            and surface texture are not hidden. They are the signature of the
            process.
          </p>
          <p>
            This is why Odhvica avoids the look of factory-perfect sameness.
            The pieces are polished enough for modern wardrobes, but their
            character stays close to the craft that made them.
          </p>
        </CraftStorySection>
      </ContentContainer>
    </>
  );
}
