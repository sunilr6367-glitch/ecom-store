-- Populate production-ready SEO discovery defaults for Odhvica's current
-- handcrafted Jaipur / boho / block-print fashion catalog.

WITH values_to_seed(attribute_code, slug, label, synonyms) AS (
  VALUES
    ('fabric', 'cotton', 'Cotton', '["handloom cotton","quilted cotton","printed cotton"]'::jsonb),
    ('fabric', 'velvet', 'Velvet', '["embroidered velvet","luxury velvet"]'::jsonb),
    ('technique', 'block-print', 'Block Print', '["hand block print","bagru print","sanganeri print","rajasthani block print"]'::jsonb),
    ('technique', 'kantha', 'Kantha', '["kantha stitch","kantha quilted","hand stitched"]'::jsonb),
    ('technique', 'quilted', 'Quilted', '["hand quilted","padded","stitched quilt"]'::jsonb),
    ('technique', 'embroidery', 'Embroidery', '["embroidered","hand embroidery"]'::jsonb),
    ('technique', 'handmade', 'Handmade', '["artisan made","handcrafted","hand crafted"]'::jsonb),
    ('occasion', 'gift', 'Gift', '["gift for her","gift for women","handmade gift"]'::jsonb),
    ('occasion', 'travel', 'Travel', '["vacation","holiday","weekend trip"]'::jsonb),
    ('occasion', 'shopping', 'Shopping', '["market bag","shopper","daily carry"]'::jsonb),
    ('occasion', 'wedding', 'Wedding', '["bridal","wedding guest","trousseau"]'::jsonb),
    ('occasion', 'festive', 'Festive', '["festival","celebration","diwali"]'::jsonb),
    ('style', 'boho', 'Boho', '["bohemian","boho chic","free spirit"]'::jsonb),
    ('style', 'ethnic', 'Ethnic', '["indian ethnic","artisan ethnic","jaipur style"]'::jsonb),
    ('style', 'kimono', 'Kimono', '["kimono jacket","open front jacket","short kimono"]'::jsonb),
    ('style', 'jacket', 'Jacket', '["coat","outerwear","short jacket"]'::jsonb),
    ('style', 'tote-bag', 'Tote Bag', '["shoulder bag","shopper bag","market bag"]'::jsonb),
    ('style', 'toiletry-bag', 'Toiletry Bag', '["cosmetic pouch","makeup bag","travel pouch"]'::jsonb),
    ('pattern', 'floral', 'Floral', '["flower print","botanical","flower"]'::jsonb),
    ('pattern', 'fruit-print', 'Fruit Print', '["fruit motif","quirky print"]'::jsonb),
    ('pattern', 'patchwork', 'Patchwork', '["patch work","mixed print","multicolor patchwork"]'::jsonb),
    ('pattern', 'block-print', 'Block Print', '["hand block print","rajasthani print"]'::jsonb),
    ('color', 'blue', 'Blue', '["sky blue","indigo","navy"]'::jsonb),
    ('color', 'green', 'Green', '["sage","emerald","leaf green"]'::jsonb),
    ('color', 'red', 'Red', '["maroon","ruby","crimson"]'::jsonb),
    ('color', 'orange', 'Orange', '["rust","terracotta","saffron"]'::jsonb),
    ('color', 'white', 'White', '["ivory","cream","off white"]'::jsonb),
    ('color', 'yellow', 'Yellow', '["mustard","sunflower","golden"]'::jsonb),
    ('color', 'multicolor', 'Multicolor', '["multi color","mixed color","colorful"]'::jsonb),
    ('region', 'jaipur', 'Jaipur', '["pink city","jaipur artisan","sanganer"]'::jsonb),
    ('region', 'rajasthan', 'Rajasthan', '["rajasthani","desert craft"]'::jsonb),
    ('region', 'india', 'India', '["made in india","handmade in india","indian artisan"]'::jsonb),
    ('artisan_type', 'jaipur-artisan', 'Jaipur Artisan', '["jaipur maker","rajasthan artisan"]'::jsonb),
    ('artisan_type', 'block-printer', 'Block Printer', '["hand block printer","print artisan"]'::jsonb),
    ('artisan_type', 'hand-quilter', 'Hand Quilter', '["kantha artisan","quilt artisan"]'::jsonb)
)
INSERT INTO attribute_values (attribute_id, slug, label, synonyms)
SELECT pa.id, v.slug, v.label, v.synonyms
FROM values_to_seed v
JOIN product_attributes pa ON pa.code = v.attribute_code
ON CONFLICT DO NOTHING;

WITH mapping(attribute_code, value_slug, match_regex, confidence) AS (
  VALUES
    ('fabric', 'cotton', '(cotton|mulmul|voile)', 92),
    ('fabric', 'velvet', '(velvet)', 92),
    ('technique', 'block-print', '(block print|block-print|bagru|sanganeri|rajasthani print)', 94),
    ('technique', 'kantha', '(kantha)', 96),
    ('technique', 'quilted', '(quilt|quilted)', 94),
    ('technique', 'embroidery', '(embroider|embroidery)', 92),
    ('technique', 'handmade', '(handmade|hand made|handcrafted|hand crafted|artisan)', 90),
    ('occasion', 'gift', '(gift for her|gift for women|gift)', 86),
    ('occasion', 'travel', '(travel|toiletry|cosmetic|pouch|vacation)', 88),
    ('occasion', 'shopping', '(shopping|shopper|market bag|tote)', 86),
    ('occasion', 'wedding', '(wedding|bridal)', 84),
    ('occasion', 'festive', '(festival|festive)', 82),
    ('style', 'boho', '(boho|bohemian)', 90),
    ('style', 'ethnic', '(ethnic|indian|rajasthani|jaipur)', 84),
    ('style', 'kimono', '(kimono)', 94),
    ('style', 'jacket', '(jacket|coat)', 92),
    ('style', 'tote-bag', '(tote|shoulder bag|shopper|market bag)', 92),
    ('style', 'toiletry-bag', '(toiletry|cosmetic|makeup|pouch)', 92),
    ('pattern', 'floral', '(floral|flower)', 90),
    ('pattern', 'fruit-print', '(fruit)', 88),
    ('pattern', 'patchwork', '(patchwork|patch work)', 88),
    ('pattern', 'block-print', '(block print|block-print)', 90),
    ('color', 'blue', '(blue|sky blue)', 88),
    ('color', 'green', '(green)', 88),
    ('color', 'red', '(red)', 88),
    ('color', 'orange', '(orange)', 88),
    ('color', 'white', '(white|ivory)', 88),
    ('color', 'yellow', '(yellow|mustard)', 88),
    ('color', 'multicolor', '(multicolor|multi color)', 88),
    ('region', 'jaipur', '(jaipur|sanganer)', 90),
    ('region', 'rajasthan', '(rajasthan|rajasthani)', 88),
    ('region', 'india', '(india|indian|made in india)', 88),
    ('artisan_type', 'jaipur-artisan', '(jaipur artisan|jaipur|artisan)', 86),
    ('artisan_type', 'block-printer', '(block print|block-printer|block printer)', 86),
    ('artisan_type', 'hand-quilter', '(kantha|quilt|quilted)', 86)
),
product_text AS (
  SELECT
    p.id AS product_id,
    lower(concat_ws(' ', p.title, p.handle, p.subtitle, p.description, p.material)) AS text_blob
  FROM products p
  WHERE p.status = 'published'
),
matches AS (
  SELECT
    pt.product_id,
    pa.id AS attribute_id,
    av.id AS value_id,
    av.label AS raw_value,
    m.confidence
  FROM product_text pt
  JOIN mapping m ON pt.text_blob ~ m.match_regex
  JOIN product_attributes pa ON pa.code = m.attribute_code
  JOIN attribute_values av ON av.attribute_id = pa.id AND av.slug = m.value_slug
)
INSERT INTO product_attribute_values (product_id, attribute_id, value_id, raw_value, source, confidence)
SELECT product_id, attribute_id, value_id, raw_value, 'seo_auto_population', confidence
FROM matches
WHERE NOT EXISTS (
  SELECT 1
  FROM product_attribute_values existing
  WHERE existing.product_id = matches.product_id
    AND existing.attribute_id = matches.attribute_id
    AND existing.value_id = matches.value_id
);

WITH synonym_seed(term, synonyms, boost) AS (
  VALUES
    ('tote bag', '["shoulder bag","shopper bag","market bag","shopping bag"]'::jsonb, 3),
    ('toiletry bag', '["cosmetic pouch","makeup bag","travel pouch","wash bag"]'::jsonb, 3),
    ('kimono jacket', '["short kimono","open front jacket","boho jacket"]'::jsonb, 3),
    ('quilted bag', '["padded bag","stitched bag","hand quilted bag"]'::jsonb, 2),
    ('handmade', '["handcrafted","artisan made","made by hand"]'::jsonb, 2),
    ('floral', '["flower print","botanical print","flower pattern"]'::jsonb, 2),
    ('gift for her', '["gift for women","boho gift","handmade gift"]'::jsonb, 2),
    ('jaipur bag', '["rajasthan bag","indian artisan bag","sanganer bag"]'::jsonb, 2)
)
INSERT INTO search_synonyms (locale, term, normalized_term, synonyms, boost)
SELECT 'en', s.term, lower(s.term), s.synonyms, s.boost
FROM synonym_seed s
WHERE NOT EXISTS (
  SELECT 1 FROM search_synonyms existing
  WHERE existing.locale = 'en' AND existing.normalized_term = lower(s.term)
);

INSERT INTO seo_landing_pages (
  slug,
  title,
  meta_description,
  intro_content,
  outro_content,
  rule_definition,
  canonical_url,
  robots_index,
  robots_follow,
  status,
  priority,
  metadata
)
VALUES
  (
    'kantha-jackets',
    'Kantha Jackets Handmade in Jaipur',
    'Shop handmade Kantha jackets crafted in Jaipur with quilted cotton, boho styling, and artisan hand-stitch detail.',
    'Explore Kantha quilted jackets made with hand-finished cotton layers, easy open-front fits, and Jaipur craft character.',
    'Each Kantha jacket connects textile reuse, slow fashion, and everyday boho layering for global wardrobes.',
    '{"search":"kantha jacket"}'::jsonb,
    '/collections/kantha-jackets',
    true,
    true,
    'active',
    20,
    '{"cluster":"kantha outerwear","intent":"buy"}'::jsonb
  ),
  (
    'block-print-bags',
    'Block Print Bags and Pouches',
    'Discover Jaipur block print bags, tote bags, toiletry pouches, and quilted cotton accessories made by Indian artisans.',
    'Shop block print bags and pouches rooted in Jaipur craft, cotton quilting, and practical everyday travel use.',
    'Use this collection for artisan gifts, market bags, travel pouches, and boho accessories with handmade print detail.',
    '{"search":"block print bag"}'::jsonb,
    '/collections/block-print-bags',
    true,
    true,
    'active',
    25,
    '{"cluster":"block print accessories","intent":"buy"}'::jsonb
  ),
  (
    'cotton-toiletry-bags',
    'Cotton Toiletry Bags and Cosmetic Pouches',
    'Shop quilted cotton toiletry bags, cosmetic pouches, and travel bag sets with handmade Jaipur block print charm.',
    'These cotton toiletry bags are designed for travel, makeup, gifting, and daily organization with quilted handmade construction.',
    'Choose cotton cosmetic pouches for sustainable travel accessories, bridesmaid gifts, or practical boho storage.',
    '{"search":"cotton toiletry bag"}'::jsonb,
    '/collections/cotton-toiletry-bags',
    true,
    true,
    'active',
    30,
    '{"cluster":"travel cosmetic pouches","intent":"buy"}'::jsonb
  ),
  (
    'jaipur-boho-bags',
    'Jaipur Boho Bags Handmade in India',
    'Browse Jaipur boho bags, quilted totes, floral cotton shoppers, and artisan handmade gifts from India.',
    'Jaipur boho bags combine floral prints, quilted cotton, and artisan construction for everyday carry and gifting.',
    'This edit supports Etsy-style discovery for shoppers searching handmade Indian bags, boho totes, and artisan gifts.',
    '{"search":"jaipur boho bag"}'::jsonb,
    '/collections/jaipur-boho-bags',
    true,
    true,
    'active',
    35,
    '{"cluster":"jaipur boho accessories","intent":"buy"}'::jsonb
  ),
  (
    'floral-quilted-bags',
    'Floral Quilted Cotton Bags',
    'Shop floral quilted cotton bags, handmade tote bags, and soft Jaipur artisan shoppers for gifting and everyday use.',
    'Floral quilted bags bring cotton texture, soft structure, and handmade Indian craft into a practical accessory format.',
    'Ideal for shoppers seeking colorful, sustainable, artisan-made cotton bags with visible craft provenance.',
    '{"search":"floral quilted bag"}'::jsonb,
    '/collections/floral-quilted-bags',
    true,
    true,
    'active',
    40,
    '{"cluster":"floral quilted accessories","intent":"buy"}'::jsonb
  ),
  (
    'handmade-gifts-for-her',
    'Handmade Gifts for Her',
    'Find handmade gifts for her including Jaipur tote bags, Kantha jackets, cosmetic pouches, and boho cotton accessories.',
    'This gift edit focuses on handmade Indian pieces with practical use, tactile craft, and boho styling.',
    'Use it for birthday gifts, travel gifts, wedding favors, and slow-fashion presents with artisan provenance.',
    '{"search":"gift for her handmade"}'::jsonb,
    '/collections/handmade-gifts-for-her',
    true,
    true,
    'active',
    45,
    '{"cluster":"handmade gifts","intent":"gift"}'::jsonb
  )
ON CONFLICT (slug) DO UPDATE SET
  title = excluded.title,
  meta_description = excluded.meta_description,
  intro_content = excluded.intro_content,
  outro_content = excluded.outro_content,
  rule_definition = excluded.rule_definition,
  canonical_url = excluded.canonical_url,
  robots_index = excluded.robots_index,
  robots_follow = excluded.robots_follow,
  status = excluded.status,
  priority = excluded.priority,
  metadata = excluded.metadata,
  updated_at = now();

INSERT INTO product_embeddings (product_id, locale, source_hash, document, metadata, updated_at)
SELECT
  p.id,
  'en',
  md5(concat_ws(' ', p.title, p.subtitle, p.description, p.material, pd.primary_keyword, pd.product_document)),
  trim(concat_ws(
    ' ',
    p.title,
    p.subtitle,
    p.description,
    p.material,
    pd.primary_keyword,
    pd.product_document
  )),
  '{"source":"seo_auto_population","provider":"pending"}'::jsonb,
  now()
FROM products p
LEFT JOIN product_discovery pd ON pd.product_id = p.id
WHERE p.status = 'published'
ON CONFLICT (product_id) DO UPDATE SET
  source_hash = excluded.source_hash,
  document = excluded.document,
  metadata = excluded.metadata,
  updated_at = now();
