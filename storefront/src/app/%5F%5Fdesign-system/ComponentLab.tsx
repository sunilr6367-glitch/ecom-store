'use client';

import { useState } from 'react';
import { Button, Card, CardContent, Cluster, Drawer, EmptyState, Heading, IconButton, Input, Modal, PageContainer, PageHeader, Section, Stack, StatusBanner, Text, Textarea } from '@/design-system';
import { Heart, X } from 'lucide-react';

export function ComponentLab() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  return (
    <>
      <PageContainer>
        <PageHeader eyebrow="Development only" title="Odhvica component lab" description="Certified variants, interaction states, wrapping, and resilience fixtures." />
        <Stack className="pb-[var(--ds-space-3xl)]">
          <Section><Heading role="section">Typography and controls</Heading><Text className="mt-[var(--ds-space-xs)]">Long content fixture verifies Cardo wrapping without inventing route-local measures or display sizes.</Text><Cluster className="mt-[var(--ds-space-md)]"><Button>Primary</Button><Button variant="secondary">Secondary</Button><Button variant="outline">Outline</Button><Button disabled>Disabled</Button><IconButton aria-label="Wishlist"><Heart aria-hidden size={18} /></IconButton></Cluster></Section>
          <Section><Heading role="section">Forms and feedback</Heading><Stack className="mt-[var(--ds-space-md)] max-w-[var(--ds-narrow-width)]"><Input label="Email" placeholder="name@example.com" /><Input label="Invalid field" error="A recoverable validation message." /><Textarea aria-label="Editorial note" placeholder="Long CMS copy fixture" /><StatusBanner tone="success">Success state remains readable and semantic.</StatusBanner><StatusBanner tone="danger">Recoverable error state remains actionable.</StatusBanner></Stack></Section>
          <Section><Heading role="section">Cards, empty data, and overlays</Heading><Card className="mt-[var(--ds-space-md)]"><CardContent><Heading role="card">A product title that intentionally wraps across two lines</Heading><Text role="price" className="mt-[var(--ds-space-xs)]">₹12,500</Text></CardContent></Card><EmptyState className="mt-[var(--ds-space-md)]" title="No items yet" description="Empty collections render a customer-facing state, never an admin instruction." actions={<Button>Continue shopping</Button>} /><Cluster className="mt-[var(--ds-space-md)]"><Button onClick={() => setModalOpen(true)}>Open modal</Button><Button variant="outline" onClick={() => setDrawerOpen(true)}>Open drawer</Button></Cluster></Section>
        </Stack>
      </PageContainer>
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Modal state"><Text>Keyboard focus is trapped and Escape closes this dialog.</Text></Modal>
      <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Drawer state"><Text>Drawer stacking and long-copy behavior.</Text><Button className="mt-[var(--ds-space-md)]" onClick={() => setDrawerOpen(false)} leadingIcon={<X aria-hidden size={18} />}>Close</Button></Drawer>
    </>
  );
}
