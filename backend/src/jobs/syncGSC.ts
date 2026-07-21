import { db } from '../db/client';
import { gsc_performance } from '../db/schema';
import { createSign } from 'crypto';

type GscRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

function isDirectJobRun() {
  return (process.argv[1] || '').replace(/\\/g, '/').includes('/syncGSC');
}

async function getAccessToken() {
  if (process.env.GSC_ACCESS_TOKEN) return process.env.GSC_ACCESS_TOKEN;
  const clientEmail = process.env.GSC_CLIENT_EMAIL;
  const privateKey = process.env.GSC_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!clientEmail || !privateKey) return null;

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claims = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value))
      .toString('base64url');
  const unsigned = `${encode(header)}.${encode(claims)}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(privateKey, 'base64url');
  const assertion = `${unsigned}.${signature}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  if (!response.ok) {
    throw new Error(`GSC OAuth token request failed: ${response.status}`);
  }

  const payload = (await response.json()) as { access_token?: string };
  return payload.access_token || null;
}

export async function syncGSCPerformance() {
  const token = await getAccessToken();
  const siteUrl = process.env.GSC_SITE_URL || 'https://odhvica.com';
  if (!token) {
    return { synced: 0, skipped: true, reason: 'GSC credentials are not configured' };
  }

  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 2);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - 7);

  const response = await fetch(
    `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        startDate: startDate.toISOString().slice(0, 10),
        endDate: endDate.toISOString().slice(0, 10),
        dimensions: ['date', 'page', 'query'],
        rowLimit: 25000,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`GSC sync failed: ${response.status}`);
  }

  const payload = (await response.json()) as { rows?: GscRow[] };
  const rows = payload.rows || [];

  if (rows.length) {
    await db.insert(gsc_performance).values(
      rows.map((row) => ({
        date: new Date(row.keys?.[0] || startDate),
        page: row.keys?.[1] || siteUrl,
        query: row.keys?.[2] || null,
        clicks: Math.round(row.clicks || 0),
        impressions: Math.round(row.impressions || 0),
        ctr: String(row.ctr || 0),
        position: String(row.position || 0),
        metadata: { source: 'google_search_console' },
      }))
    );
  }

  return { synced: rows.length, skipped: false };
}

if (require.main === module && isDirectJobRun()) {
  syncGSCPerformance()
    .then((result) => {
      console.log(result);
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
