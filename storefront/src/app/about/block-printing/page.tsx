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
  title: 'Block Printing | Odhvica',
  description: 'Learn how Jaipur block print traditions influence Odhvica handmade cotton bags, pouches, jackets, and accessories.',
  path: '/about/block-printing',
});

export default function BlockPrintingPage() {
  return (
    <>
      <PageHero
        eyebrow="Craft Story"
        title="Block Printing"
        intro="Block printing uses carved wooden blocks, repeat placement, and layered color to create the textile patterns seen across many Odhvica pieces."
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'About', href: '/about' },
          { label: 'Block Printing' },
        ]}
      />
      <ContentContainer
        footer={
          <InlineCTA
            title="Follow the print into the wardrobe"
            body="Explore handmade cotton pieces shaped by Jaipur print traditions and small-batch finishing."
            links={[
              { label: 'Shop Products', href: '/products', variant: 'primary' },
              { label: 'Kantha Craft', href: '/about/kantha' },
            ]}
          />
        }
      >
        <ImageTextSplit
          eyebrow="Jaipur print language"
          title="Carved blocks, measured pressure, layered color"
          imageSrc="/images/home/collection-summer.jpg"
          imageAlt="Odhvica textile jacket with repeated surface motif"
          imageLabel="Wooden printing blocks and cotton yardage"
          body={
            <>
              <p>
                Block printing is a conversation between hand, block, pigment,
                and cloth. A carved wooden block is placed, pressed, lifted, and
                aligned again, creating pattern through patience rather than
                mechanical speed.
              </p>
              <p>
                Odhvica uses this language for pieces that feel warm, tactile,
                and slightly irregular in the best way. The print carries the
                memory of its making.
              </p>
            </>
          }
        />
        <QuoteBlock quote="The small shift in a block print is not a flaw. It is where the hand becomes visible." />
        <CraftStorySection eyebrow="Technique" title="Pattern with restraint">
          <p>
            We favor print scales and colors that can live with the body and the
            home: softened edges, balanced repeats, and surfaces that do not
            fight the silhouette. The craft should enrich the piece, not
            overwhelm it.
          </p>
          <p>
            That restraint keeps the work modern while staying rooted in Jaipur
            textile practice.
          </p>
        </CraftStorySection>
      </ContentContainer>
    </>
  );
}
