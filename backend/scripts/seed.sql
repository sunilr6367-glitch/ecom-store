-- Odhvica DB Seed — run once on fresh Docker Postgres
-- Safe: all inserts use ON CONFLICT DO NOTHING

-- ── REGIONS (49 global) ──────────────────────────────────────────────────
INSERT INTO regions (id,name,currency_code,tax_rate,tax_code,created_at,updated_at) VALUES
(gen_random_uuid(),'India','inr','18','GST',now(),now()),
(gen_random_uuid(),'United States','usd','0','Sales Tax',now(),now()),
(gen_random_uuid(),'Canada','cad','13','HST',now(),now()),
(gen_random_uuid(),'Mexico','mxn','16','IVA',now(),now()),
(gen_random_uuid(),'United Kingdom','gbp','20','VAT',now(),now()),
(gen_random_uuid(),'European Union','eur','20','VAT',now(),now()),
(gen_random_uuid(),'Switzerland','chf','8','VAT',now(),now()),
(gen_random_uuid(),'Norway','nok','25','MVA',now(),now()),
(gen_random_uuid(),'Sweden','sek','25','Moms',now(),now()),
(gen_random_uuid(),'Denmark','dkk','25','Moms',now(),now()),
(gen_random_uuid(),'Poland','pln','23','VAT',now(),now()),
(gen_random_uuid(),'Czechia','czk','21','DPH',now(),now()),
(gen_random_uuid(),'Hungary','huf','27','AFA',now(),now()),
(gen_random_uuid(),'Romania','ron','19','TVA',now(),now()),
(gen_random_uuid(),'UAE','aed','5','VAT',now(),now()),
(gen_random_uuid(),'Saudi Arabia','sar','15','VAT',now(),now()),
(gen_random_uuid(),'Kuwait','kwd','0','N/A',now(),now()),
(gen_random_uuid(),'Qatar','qar','0','N/A',now(),now()),
(gen_random_uuid(),'Bahrain','bhd','10','VAT',now(),now()),
(gen_random_uuid(),'Oman','omr','5','VAT',now(),now()),
(gen_random_uuid(),'Israel','ils','17','VAT',now(),now()),
(gen_random_uuid(),'Turkey','try','20','KDV',now(),now()),
(gen_random_uuid(),'Australia','aud','10','GST',now(),now()),
(gen_random_uuid(),'New Zealand','nzd','15','GST',now(),now()),
(gen_random_uuid(),'Japan','jpy','10','JCT',now(),now()),
(gen_random_uuid(),'South Korea','krw','10','VAT',now(),now()),
(gen_random_uuid(),'Singapore','sgd','9','GST',now(),now()),
(gen_random_uuid(),'Hong Kong','hkd','0','N/A',now(),now()),
(gen_random_uuid(),'China','cny','13','VAT',now(),now()),
(gen_random_uuid(),'Taiwan','twd','5','VAT',now(),now()),
(gen_random_uuid(),'Malaysia','myr','6','SST',now(),now()),
(gen_random_uuid(),'Thailand','thb','7','VAT',now(),now()),
(gen_random_uuid(),'Indonesia','idr','11','PPN',now(),now()),
(gen_random_uuid(),'Philippines','php','12','VAT',now(),now()),
(gen_random_uuid(),'Vietnam','vnd','10','VAT',now(),now()),
(gen_random_uuid(),'Bangladesh','bdt','15','VAT',now(),now()),
(gen_random_uuid(),'Pakistan','pkr','17','GST',now(),now()),
(gen_random_uuid(),'Sri Lanka','lkr','15','VAT',now(),now()),
(gen_random_uuid(),'Nepal','npr','13','VAT',now(),now()),
(gen_random_uuid(),'Brazil','brl','17','ICMS',now(),now()),
(gen_random_uuid(),'Argentina','ars','21','IVA',now(),now()),
(gen_random_uuid(),'Chile','clp','19','IVA',now(),now()),
(gen_random_uuid(),'Colombia','cop','19','IVA',now(),now()),
(gen_random_uuid(),'Peru','pen','18','IGV',now(),now()),
(gen_random_uuid(),'South Africa','zar','15','VAT',now(),now()),
(gen_random_uuid(),'Nigeria','ngn','7','VAT',now(),now()),
(gen_random_uuid(),'Kenya','kes','16','VAT',now(),now()),
(gen_random_uuid(),'Egypt','egp','14','VAT',now(),now()),
(gen_random_uuid(),'Ghana','ghs','15','VAT',now(),now())
ON CONFLICT DO NOTHING;

-- ── TAGS ─────────────────────────────────────────────────────────────────
INSERT INTO tags (id,name,slug,created_at,updated_at) VALUES
(gen_random_uuid(),'New Arrival','new-arrival',now(),now()),
(gen_random_uuid(),'Bestseller','bestseller',now(),now()),
(gen_random_uuid(),'Sale','sale',now(),now()),
(gen_random_uuid(),'Handmade','handmade',now(),now()),
(gen_random_uuid(),'Kantha','kantha',now(),now()),
(gen_random_uuid(),'Limited Edition','limited-edition',now(),now()),
(gen_random_uuid(),'Plus Size','plus-size',now(),now()),
(gen_random_uuid(),'Gifting','gifting',now(),now()),
(gen_random_uuid(),'Sustainable','sustainable',now(),now())
ON CONFLICT (slug) DO NOTHING;

-- ── SETTINGS ─────────────────────────────────────────────────────────────
INSERT INTO settings (id,key,value,category,created_at,updated_at) VALUES
(gen_random_uuid(),'store_name','"Odhvica"','general',now(),now()),
(gen_random_uuid(),'store_email','"support@odhvica.com"','general',now(),now()),
(gen_random_uuid(),'store_phone','"+91 98765 43210"','general',now(),now()),
(gen_random_uuid(),'store_address','"Jaipur, Rajasthan, India"','general',now(),now()),
(gen_random_uuid(),'store_currency','"INR"','general',now(),now()),
(gen_random_uuid(),'store_country','"IN"','general',now(),now()),
(gen_random_uuid(),'tax_rate','18','tax',now(),now()),
(gen_random_uuid(),'tax_inclusive','false','tax',now(),now()),
(gen_random_uuid(),'tax_name','"GST"','tax',now(),now()),
(gen_random_uuid(),'domestic_shipping_rate','99','shipping',now(),now()),
(gen_random_uuid(),'international_shipping_rate','499','shipping',now(),now()),
(gen_random_uuid(),'free_shipping_threshold','999','shipping',now(),now()),
(gen_random_uuid(),'free_shipping_enabled','true','shipping',now(),now()),
(gen_random_uuid(),'shipping_countries','"IN,US,CA,GB,AU,AE,SG,MY,NZ,JP"','shipping',now(),now()),
(gen_random_uuid(),'announcement_bar_text','"Free shipping on orders above Rs.999"','content',now(),now()),
(gen_random_uuid(),'announcement_bar_enabled','true','content',now(),now()),
(gen_random_uuid(),'hero_title','"Handcrafted Indian Fashion"','content',now(),now()),
(gen_random_uuid(),'newsletter_title','"Join the Odhvica Family"','content',now(),now()),
(gen_random_uuid(),'seo_title','"Odhvica - Handcrafted Indian Fashion"','seo',now(),now()),
(gen_random_uuid(),'order_prefix','"KV"','orders',now(),now()),
(gen_random_uuid(),'social_instagram','"https://instagram.com/odhvica"','social',now(),now()),
(gen_random_uuid(),'email_order_confirmation','true','email',now(),now()),
(gen_random_uuid(),'email_low_stock_threshold','5','email',now(),now())
ON CONFLICT (key) DO NOTHING;

-- ── CATEGORIES (top-level) ────────────────────────────────────────────────
INSERT INTO categories (id,name,slug,emoji,display_order,show_in_header,is_active,created_at,updated_at) VALUES
(gen_random_uuid(),'Sarees','sarees','S',1,true,true,now(),now()),
(gen_random_uuid(),'Suits & Kurtas','suits-kurtas','K',2,true,true,now(),now()),
(gen_random_uuid(),'Lehengas','lehengas','L',3,true,true,now(),now()),
(gen_random_uuid(),'Dupattas & Stoles','dupattas-stoles','D',4,true,true,now(),now()),
(gen_random_uuid(),'Accessories','accessories','A',5,true,true,now(),now()),
(gen_random_uuid(),'Handmade','handmade-cat','H',6,true,true,now(),now()),
(gen_random_uuid(),'New Arrivals','new-arrivals','N',7,true,true,now(),now()),
(gen_random_uuid(),'Sale','sale-cat','%',8,true,true,now(),now())
ON CONFLICT (slug) DO NOTHING;

-- ── CATEGORIES (sub-level) ────────────────────────────────────────────────
INSERT INTO categories (id,name,slug,emoji,display_order,show_in_header,is_active,parent_id,created_at,updated_at)
SELECT gen_random_uuid(),'Silk Sarees','silk-sarees','S',1,false,true,id,now(),now() FROM categories WHERE slug='sarees' ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (id,name,slug,emoji,display_order,show_in_header,is_active,parent_id,created_at,updated_at)
SELECT gen_random_uuid(),'Cotton Sarees','cotton-sarees','C',2,false,true,id,now(),now() FROM categories WHERE slug='sarees' ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (id,name,slug,emoji,display_order,show_in_header,is_active,parent_id,created_at,updated_at)
SELECT gen_random_uuid(),'Kantha Sarees','kantha-sarees','K',3,false,true,id,now(),now() FROM categories WHERE slug='sarees' ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (id,name,slug,emoji,display_order,show_in_header,is_active,parent_id,created_at,updated_at)
SELECT gen_random_uuid(),'Jewellery','jewellery','J',1,false,true,id,now(),now() FROM categories WHERE slug='accessories' ON CONFLICT (slug) DO NOTHING;
INSERT INTO categories (id,name,slug,emoji,display_order,show_in_header,is_active,parent_id,created_at,updated_at)
SELECT gen_random_uuid(),'Bags & Clutches','bags-clutches','B',2,false,true,id,now(),now() FROM categories WHERE slug='accessories' ON CONFLICT (slug) DO NOTHING;

-- ── WHOLESALE TIERS ───────────────────────────────────────────────────────
INSERT INTO wholesale_tiers (id,name,slug,discount_percent,min_order_value,min_order_quantity,default_moq,payment_terms,description,color,priority,active,created_at,updated_at) VALUES
(gen_random_uuid(),'Starter','starter',20,0,0,10,'net_30','Perfect for new boutiques. 20% off retail price.','#10B981',1,true,now(),now()),
(gen_random_uuid(),'Growth','growth',35,1000000,50,25,'net_45','For established businesses. 35% off retail price.','#3B82F6',2,true,now(),now()),
(gen_random_uuid(),'Enterprise','enterprise',50,5000000,200,50,'net_60','For large distributors. 50% off retail price.','#8B5CF6',3,true,now(),now())
ON CONFLICT (slug) DO NOTHING;

-- ── PAGES ─────────────────────────────────────────────────────────────────
-- Placeholder inserts only — run seed-legal-pages.sql after to fill real content
INSERT INTO pages (id,title,slug,content,is_visible,created_at,updated_at) VALUES
(gen_random_uuid(),'Privacy Policy','privacy-policy','<h1>Privacy Policy</h1><p>Content coming soon.</p>',true,now(),now()),
(gen_random_uuid(),'Terms of Service','terms-of-service','<h1>Terms of Service</h1><p>Content coming soon.</p>',true,now(),now()),
(gen_random_uuid(),'Refund & Cancellation Policy','refund-cancellation-policy','<h1>Refund & Cancellation Policy</h1><p>Content coming soon.</p>',true,now(),now()),
(gen_random_uuid(),'Shipping Policy','shipping-policy','<h1>Shipping Policy</h1><p>Content coming soon.</p>',true,now(),now()),
(gen_random_uuid(),'Contact Us','contact','<h1>Contact Us</h1><p>Content coming soon.</p>',true,now(),now()),
(gen_random_uuid(),'FAQ','faq','<h1>FAQ</h1><p>Content coming soon.</p>',true,now(),now()),
(gen_random_uuid(),'About Us','about','<h1>About Us</h1><p>Content coming soon.</p>',true,now(),now()),
(gen_random_uuid(),'Shipping & Returns','shipping-returns','<h1>Shipping & Returns</h1><p>Content coming soon.</p>',true,now(),now()),
(gen_random_uuid(),'Size Guide','size-guide','<h1>Size Guide</h1><p>Content coming soon.</p>',true,now(),now())
ON CONFLICT (slug) DO NOTHING;

-- ── VERIFY ────────────────────────────────────────────────────────────────
SELECT 'regions' as tbl, count(*) FROM regions
UNION ALL SELECT 'tags', count(*) FROM tags
UNION ALL SELECT 'settings', count(*) FROM settings
UNION ALL SELECT 'categories', count(*) FROM categories
UNION ALL SELECT 'wholesale_tiers', count(*) FROM wholesale_tiers
UNION ALL SELECT 'pages', count(*) FROM pages
UNION ALL SELECT 'users', count(*) FROM users;
