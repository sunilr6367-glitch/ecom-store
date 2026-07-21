DO $$
DECLARE
  market record;
  market_id uuid;
BEGIN
  UPDATE regions
  SET metadata = COALESCE(metadata, '{}'::jsonb) ||
    jsonb_build_object('checkout_enabled', false);

  FOR market IN
    SELECT *
    FROM (
      VALUES
        ('india', 'India', 'inr', '18', 'GST', ARRAY['IN']::text[], false),
        ('us', 'United States', 'usd', '0', 'Sales Tax', ARRAY['US']::text[], false),
        (
          'europe',
          'Europe',
          'eur',
          '20',
          'VAT',
          ARRAY['DE','FR','PL','IT','ES','NL','BE','AT','SE','DK','FI','NO']::text[],
          false
        ),
        ('uk', 'United Kingdom', 'gbp', '20', 'VAT', ARRAY['GB']::text[], false),
        ('rest-of-world', 'Rest of World', 'usd', '0', NULL, ARRAY[]::text[], true)
    ) AS desired(
      market_key,
      region_name,
      currency_code,
      tax_rate,
      tax_code,
      country_codes,
      is_catchall
    )
  LOOP
    SELECT id
    INTO market_id
    FROM regions
    WHERE lower(name) = lower(market.region_name)
       OR (
         market.market_key = 'europe'
         AND lower(name) = 'european union'
       )
    ORDER BY
      CASE WHEN lower(name) = lower(market.region_name) THEN 0 ELSE 1 END
    LIMIT 1;

    IF market_id IS NULL THEN
      INSERT INTO regions (
        id,
        name,
        currency_code,
        tax_rate,
        tax_code,
        countries,
        metadata,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        market.region_name,
        market.currency_code,
        market.tax_rate::numeric,
        market.tax_code,
        to_jsonb(market.country_codes),
        jsonb_build_object(
          'market_key', market.market_key,
          'checkout_enabled', true,
          'catchall', market.is_catchall
        ),
        now(),
        now()
      )
      RETURNING id INTO market_id;
    ELSE
      UPDATE regions
      SET
        name = market.region_name,
        currency_code = market.currency_code,
        tax_rate = market.tax_rate::numeric,
        tax_code = market.tax_code,
        countries = to_jsonb(market.country_codes),
        metadata = COALESCE(metadata, '{}'::jsonb) ||
          jsonb_build_object(
            'market_key', market.market_key,
            'checkout_enabled', true,
            'catchall', market.is_catchall
          ),
        updated_at = now()
      WHERE id = market_id;
    END IF;
  END LOOP;
END $$;

-- Rest of World shares the United States USD price book.
WITH market_ids AS (
  SELECT
    (SELECT id FROM regions WHERE metadata->>'market_key' = 'us' LIMIT 1) AS us_id,
    (SELECT id FROM regions WHERE metadata->>'market_key' = 'rest-of-world' LIMIT 1) AS row_id
)
INSERT INTO money_amounts (
  id,
  currency_code,
  amount,
  min_quantity,
  max_quantity,
  variant_id,
  region_id,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  'usd',
  source.amount,
  source.min_quantity,
  source.max_quantity,
  source.variant_id,
  market_ids.row_id,
  now(),
  now()
FROM money_amounts source
CROSS JOIN market_ids
WHERE source.region_id = market_ids.us_id
  AND market_ids.row_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM money_amounts existing
    WHERE existing.region_id = market_ids.row_id
      AND existing.variant_id = source.variant_id
      AND existing.min_quantity IS NOT DISTINCT FROM source.min_quantity
      AND existing.max_quantity IS NOT DISTINCT FROM source.max_quantity
  );
