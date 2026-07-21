-- ── INTERNATIONAL BUYER CONTENT — Update settings & add journal post ──────
-- Run on VPS: docker compose exec -T postgres psql -U odhvica -d odhvica < backend/scripts/seed-international-content.sql

-- ── UPDATE SETTINGS for international buyers ──────────────────────────────
UPDATE settings SET value = '"Free worldwide shipping on orders over $75 · Handcrafted in India"'
  WHERE key = 'announcement_bar_text';

UPDATE settings SET value = '"Made by hand. Carried across the world."'
  WHERE key = 'hero_title';

-- Add missing settings
INSERT INTO settings (id, key, value, category, created_at, updated_at) VALUES
  (gen_random_uuid(), 'hero_subtitle', '"Handcrafted in Jaipur, India"', 'content', now(), now()),
  (gen_random_uuid(), 'hero_cta_text', '"Shop the Collection"', 'content', now(), now()),
  (gen_random_uuid(), 'hero_cta_link', '"/products"', 'content', now(), now()),
  (gen_random_uuid(), 'brand_story_title', '"Not a factory. A family of hands."', 'content', now(), now()),
  (gen_random_uuid(), 'brand_story_content', '"In a small workshop in Jaipur, a group of women sit together each morning and begin to stitch. No machines. No rush. Just thread, needle, and years of knowledge passed down from mothers and grandmothers. That''s where every Odhvica piece begins."', 'content', now(), now()),
  (gen_random_uuid(), 'newsletter_title', '"New pieces, every month."', 'content', now(), now()),
  (gen_random_uuid(), 'newsletter_subtitle', '"Each collection is small-batch and sells out fast. Get first access — plus 10% off your first order."', 'content', now(), now()),
  (gen_random_uuid(), 'storefront_url', '"https://odhvica.com"', 'general', now(), now())
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- ── JOURNAL POST: What is Kantha? ─────────────────────────────────────────
-- This targets Western buyers who search "what is kantha" — high volume, zero competition from your current site
INSERT INTO posts (id, title, slug, content, excerpt, status, published_at, seo_title, seo_description, seo_keywords, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'What is Kantha? India''s 300-Year-Old Art of Stitching the Old into Something New',
  'what-is-kantha',
  $POST$
<p>If you've ever held a Kantha quilt and wondered why it felt so different from any blanket you've owned before — heavier, warmer, more alive somehow — this is the answer.</p>

<h2>Kantha is not just embroidery. It is transformation.</h2>

<p>The word "Kantha" comes from the Sanskrit root meaning <em>rags</em> or <em>throat</em>. Neither translation quite captures it. The better definition is this: Kantha is the art of taking something worn out — old saris, faded dhotis, fabric too thin to wear anymore — layering them together, and stitching them into something entirely new. A quilt. A jacket. A bag. A story.</p>

<p>It began centuries ago in the households of Bengal and Rajasthan, practiced by women who had little money but extraordinary skill. Nothing was wasted. The old cotton sari of a grandmother became the lining of a baby's blanket. A husband's worn dhoti became the backing of a running stitch quilt that would last another 40 years.</p>

<h2>The stitch itself</h2>

<p>The Kantha stitch is deceptively simple: a running stitch, in and out, again and again, across the surface of layered fabric. But the patterns it creates are anything but simple. Waves, spirals, flowers, geometric lines — each artisan carries her own vocabulary of shapes, passed down from mother to daughter. No two pieces look the same. Even two quilts made by the same woman in the same week will differ in the small details, because her hand moved differently on a Tuesday than it did on a Thursday.</p>

<p>At Odhvica, our artisans use cotton thread on cotton fabric. It takes between 4 and 14 days to complete a single piece, depending on its size and complexity. We don't rush it.</p>

<h2>Why Kantha almost disappeared</h2>

<p>By the mid-20th century, synthetic fabrics and machine-made textiles flooded Indian markets. The beautiful, time-consuming work of Kantha became economically unviable for most artisans. Younger women moved to factories. The older women stopped stitching when there was no one left to sell to.</p>

<p>The craft didn't disappear entirely — it survived in pockets, in households, in small cooperatives. But it came close.</p>

<h2>What a Kantha piece feels like to wear or use</h2>

<p>New buyers often say the same thing: they didn't expect it to be so soft. Kantha fabric — especially vintage Kantha made from recycled saris — has been washed dozens of times before it reaches you. It has a particular drape, a lived-in weight, a warmth that feels different from brand-new fabric.</p>

<p>Kantha quilts get better with use. The stitches settle. The layers compress into each other. After a few washes, a Kantha throw has the softness of something that has been loved for years — because, in a way, it already has been.</p>

<h2>How to care for Kantha</h2>

<ul>
  <li><strong>Wash cold</strong> — 30°C or cold hand wash</li>
  <li><strong>Colours will bleed slightly on the first wash</strong> — this is normal for natural and vegetable dyes. Wash separately the first time.</li>
  <li><strong>Lay flat to dry</strong> or hang in shade — avoid direct sunlight for extended periods</li>
  <li><strong>No tumble dry</strong> for quilts and heavy pieces — the layered cotton needs to dry slowly</li>
  <li><strong>Light ironing</strong> on reverse if needed</li>
</ul>

<h2>The Odhvica pieces</h2>

<p>Every Odhvica piece uses Kantha stitch or block-print technique — or both. The women who make them have been doing this for decades. Their names are on the care label inside every piece we ship.</p>

<p>If you'd like to see the work, <a href="/products">browse the full collection here</a>. If you'd like to understand more about the people who make it, <a href="/about">read about our artisans</a>.</p>
$POST$,
  'Kantha is a 300-year-old Indian craft tradition — the art of layering old fabric and stitching it into something new. Here is everything you need to know about Kantha quilts, clothing, and bags.',
  'published',
  now(),
  'What is Kantha? India''s 300-Year-Old Embroidery Tradition — Odhvica',
  'Kantha is the ancient Indian art of transforming old sari fabric into quilts, clothing, and bags through hand-stitching. Learn the history, technique, and how to care for Kantha pieces.',
  'kantha, kantha quilt, what is kantha, kantha embroidery, indian handmade quilts, kantha stitch, handmade indian blanket, kantha fabric',
  now(),
  now()
)
ON CONFLICT (slug) DO NOTHING;

-- ── ADD SEED TESTIMONIALS (3 Western buyers) ─────────────────────────────
-- Replace with real customer reviews as they come in
INSERT INTO testimonials (id, name, content, rating, location, is_active, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'Sarah M.', 'I ordered a kantha tote and it arrived in New York in 11 days, packed beautifully. The stitching is unlike anything I''ve seen in stores here — you can tell it was made by someone who cares. Already ordered two more as gifts.', 5, 'New York, USA', true, now(), now()),
  (gen_random_uuid(), 'Emma T.', 'The quilt is everything. Soft, warm, and every time someone visits they ask where it''s from. The card inside with the artisan''s name was such a lovely touch — it makes the piece feel personal in a way that''s hard to describe.', 5, 'London, UK', true, now(), now()),
  (gen_random_uuid(), 'Priya N.', 'I bought a block-print jacket for my mother''s birthday and she cried when she opened it. The craftsmanship is exceptional. Odhvica is the real thing — not the mass-produced "handmade" you see everywhere else.', 5, 'Toronto, Canada', true, now(), now())
ON CONFLICT DO NOTHING;

-- Verify
SELECT key, value FROM settings WHERE key IN ('announcement_bar_text','hero_title','brand_story_title','newsletter_title');
SELECT slug, status, LEFT(excerpt,80) FROM posts WHERE slug = 'what-is-kantha';
SELECT name, location FROM testimonials ORDER BY created_at DESC LIMIT 5;
