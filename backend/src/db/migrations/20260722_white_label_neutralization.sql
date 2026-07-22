-- Additive white-label boundary for databases that previously applied branded
-- manual migrations. Historical files stay immutable; this migration removes
-- their client identity before a fresh client is configured and seeded.

UPDATE pages
SET
  content = replace(
    replace(
      replace(content, 'support@odhvica.com', 'support@example.com'),
      'https://odhvica.com',
      'http://localhost:3100'
    ),
    'Odhvica',
    'Store'
  ),
  seo_title = replace(coalesce(seo_title, ''), 'Odhvica', 'Store'),
  seo_description = replace(coalesce(seo_description, ''), 'Odhvica', 'Store'),
  updated_at = now()
WHERE
  content ILIKE '%odhvica%'
  OR coalesce(seo_title, '') ILIKE '%odhvica%'
  OR coalesce(seo_description, '') ILIKE '%odhvica%';

UPDATE settings
SET
  value = replace(
    replace(
      replace(value::text, 'support@odhvica.com', 'support@example.com'),
      'https://odhvica.com',
      'http://localhost:3100'
    ),
    'Odhvica',
    'Store'
  )::jsonb,
  updated_at = now()
WHERE value::text ILIKE '%odhvica%';
