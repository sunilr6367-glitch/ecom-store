import { db } from './client';
import { regions } from './schema';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

const globalRegions = [
  // ── South Asia ──────────────────────────────────────────────
  { name: 'India',                currency_code: 'inr', tax_rate: '18', tax_code: 'GST' },

  // ── North America ────────────────────────────────────────────
  { name: 'United States',        currency_code: 'usd', tax_rate: '0',  tax_code: 'Sales Tax' },
  { name: 'Canada',               currency_code: 'cad', tax_rate: '13', tax_code: 'HST' },
  { name: 'Mexico',               currency_code: 'mxn', tax_rate: '16', tax_code: 'IVA' },

  // ── Europe ───────────────────────────────────────────────────
  { name: 'United Kingdom',       currency_code: 'gbp', tax_rate: '20', tax_code: 'VAT' },
  { name: 'European Union',       currency_code: 'eur', tax_rate: '20', tax_code: 'VAT' },
  { name: 'Switzerland',          currency_code: 'chf', tax_rate: '8',  tax_code: 'VAT' },
  { name: 'Norway',               currency_code: 'nok', tax_rate: '25', tax_code: 'MVA' },
  { name: 'Sweden',               currency_code: 'sek', tax_rate: '25', tax_code: 'Moms' },
  { name: 'Denmark',              currency_code: 'dkk', tax_rate: '25', tax_code: 'Moms' },
  { name: 'Poland',               currency_code: 'pln', tax_rate: '23', tax_code: 'VAT' },
  { name: 'Czechia',              currency_code: 'czk', tax_rate: '21', tax_code: 'DPH' },
  { name: 'Hungary',              currency_code: 'huf', tax_rate: '27', tax_code: 'ÁFA' },
  { name: 'Romania',              currency_code: 'ron', tax_rate: '19', tax_code: 'TVA' },

  // ── Middle East ──────────────────────────────────────────────
  { name: 'UAE',                  currency_code: 'aed', tax_rate: '5',  tax_code: 'VAT' },
  { name: 'Saudi Arabia',         currency_code: 'sar', tax_rate: '15', tax_code: 'VAT' },
  { name: 'Kuwait',               currency_code: 'kwd', tax_rate: '0',  tax_code: 'N/A' },
  { name: 'Qatar',                currency_code: 'qar', tax_rate: '0',  tax_code: 'N/A' },
  { name: 'Bahrain',              currency_code: 'bhd', tax_rate: '10', tax_code: 'VAT' },
  { name: 'Oman',                 currency_code: 'omr', tax_rate: '5',  tax_code: 'VAT' },
  { name: 'Israel',               currency_code: 'ils', tax_rate: '17', tax_code: 'VAT' },
  { name: 'Turkey',               currency_code: 'try', tax_rate: '20', tax_code: 'KDV' },

  // ── Asia Pacific ─────────────────────────────────────────────
  { name: 'Australia',            currency_code: 'aud', tax_rate: '10', tax_code: 'GST' },
  { name: 'New Zealand',          currency_code: 'nzd', tax_rate: '15', tax_code: 'GST' },
  { name: 'Japan',                currency_code: 'jpy', tax_rate: '10', tax_code: 'JCT' },
  { name: 'South Korea',          currency_code: 'krw', tax_rate: '10', tax_code: 'VAT' },
  { name: 'Singapore',            currency_code: 'sgd', tax_rate: '9',  tax_code: 'GST' },
  { name: 'Hong Kong',            currency_code: 'hkd', tax_rate: '0',  tax_code: 'N/A' },
  { name: 'China',                currency_code: 'cny', tax_rate: '13', tax_code: 'VAT' },
  { name: 'Taiwan',               currency_code: 'twd', tax_rate: '5',  tax_code: 'VAT' },
  { name: 'Malaysia',             currency_code: 'myr', tax_rate: '6',  tax_code: 'SST' },
  { name: 'Thailand',             currency_code: 'thb', tax_rate: '7',  tax_code: 'VAT' },
  { name: 'Indonesia',            currency_code: 'idr', tax_rate: '11', tax_code: 'PPN' },
  { name: 'Philippines',          currency_code: 'php', tax_rate: '12', tax_code: 'VAT' },
  { name: 'Vietnam',              currency_code: 'vnd', tax_rate: '10', tax_code: 'VAT' },
  { name: 'Bangladesh',           currency_code: 'bdt', tax_rate: '15', tax_code: 'VAT' },
  { name: 'Pakistan',             currency_code: 'pkr', tax_rate: '17', tax_code: 'GST' },
  { name: 'Sri Lanka',            currency_code: 'lkr', tax_rate: '15', tax_code: 'VAT' },
  { name: 'Nepal',                currency_code: 'npr', tax_rate: '13', tax_code: 'VAT' },

  // ── Latin America ────────────────────────────────────────────
  { name: 'Brazil',               currency_code: 'brl', tax_rate: '17', tax_code: 'ICMS' },
  { name: 'Argentina',            currency_code: 'ars', tax_rate: '21', tax_code: 'IVA' },
  { name: 'Chile',                currency_code: 'clp', tax_rate: '19', tax_code: 'IVA' },
  { name: 'Colombia',             currency_code: 'cop', tax_rate: '19', tax_code: 'IVA' },
  { name: 'Peru',                 currency_code: 'pen', tax_rate: '18', tax_code: 'IGV' },

  // ── Africa ───────────────────────────────────────────────────
  { name: 'South Africa',         currency_code: 'zar', tax_rate: '15', tax_code: 'VAT' },
  { name: 'Nigeria',              currency_code: 'ngn', tax_rate: '7',  tax_code: 'VAT' },
  { name: 'Kenya',                currency_code: 'kes', tax_rate: '16', tax_code: 'VAT' },
  { name: 'Egypt',                currency_code: 'egp', tax_rate: '14', tax_code: 'VAT' },
  { name: 'Ghana',                currency_code: 'ghs', tax_rate: '15', tax_code: 'VAT' },
];

async function seedGlobalRegions() {
  console.log('🌍 Seeding global regions...');
  let created = 0;
  let skipped = 0;

  for (const r of globalRegions) {
    const existing = await db
      .select()
      .from(regions)
      .where(eq(regions.currency_code, r.currency_code))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(regions).values(r);
      console.log(`✅ ${r.name} (${r.currency_code.toUpperCase()})`);
      created++;
    } else {
      console.log(`⏭️  Skipped: ${r.name} — ${r.currency_code.toUpperCase()} already exists`);
      skipped++;
    }
  }

  console.log(`\n🎉 Done! Created: ${created}, Skipped: ${skipped}`);
  process.exit(0);
}

seedGlobalRegions().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
