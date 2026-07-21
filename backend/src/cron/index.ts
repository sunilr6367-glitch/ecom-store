import { generateEmbeddingsForProducts } from '../jobs/generateEmbeddings';
import { sendReviewRequestEmails } from '../jobs/reviewEmailJob';
import { sendAbandonedCartEmails } from '../jobs/abandonedCartEmailJob';
import { syncAllProductsToMeilisearch } from '../jobs/syncMeilisearch';
import { syncGSCPerformance } from '../jobs/syncGSC';
import { releaseExpiredInventoryReservations } from '../utils/inventory-reservation';
import { releaseAbandonedOrderInventory } from '../jobs/releaseAbandonedOrderInventory';

type JobResult = {
  name: string;
  ok: boolean;
  result?: unknown;
  error?: string;
};

const timers: NodeJS.Timeout[] = [];

function isDirectCronRun() {
  return (process.argv[1] || '').replace(/\\/g, '/').includes('/cron/index');
}

async function runJob(name: string, fn: () => Promise<unknown>): Promise<JobResult> {
  try {
    return { name, ok: true, result: await fn() };
  } catch (error) {
    return { name, ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function runSeoCronJobs() {
  return Promise.all([
    runJob('release_expired_inventory', () =>
      releaseExpiredInventoryReservations()
    ),
    runJob('generate_embeddings', () => generateEmbeddingsForProducts()),
    runJob('sync_gsc', () => syncGSCPerformance()),
    runJob('review_request_emails', () => sendReviewRequestEmails()),
    runJob('abandoned_cart_emails', () => sendAbandonedCartEmails()),
    runJob('sync_meilisearch', () => syncAllProductsToMeilisearch()),
    runJob('release_abandoned_order_inventory', () => releaseAbandonedOrderInventory()),
  ]);
}

function scheduleJob(name: string, intervalMs: number, fn: () => Promise<unknown>) {
  const run = async () => {
    const result = await runJob(name, fn);
    if (!result.ok) {
      console.error(`[seo-cron] ${name} failed: ${result.error}`);
    } else {
      console.log(`[seo-cron] ${name} completed`);
    }
  };

  const initialDelayMs = Number(process.env.SEO_CRON_INITIAL_DELAY_MS || '60000');
  const initialTimer = setTimeout(run, Number.isFinite(initialDelayMs) ? initialDelayMs : 60000);
  const intervalTimer = setInterval(run, intervalMs);
  initialTimer.unref();
  intervalTimer.unref();
  timers.push(initialTimer, intervalTimer);
}

export function startSeoCronScheduler() {
  if (timers.length > 0) return;
  if (process.env.SEO_CRON_ENABLED === 'false') return;

  const hour = 60 * 60 * 1000;
  scheduleJob('release_expired_inventory', 5 * 60 * 1000, () =>
    releaseExpiredInventoryReservations()
  );
  scheduleJob('review_request_emails', 6 * hour, () => sendReviewRequestEmails());
  scheduleJob('abandoned_cart_emails', 1 * hour, () => sendAbandonedCartEmails());
  scheduleJob('generate_embeddings', 24 * hour, () => generateEmbeddingsForProducts());
  scheduleJob('sync_meilisearch', 12 * hour, () => syncAllProductsToMeilisearch());
  scheduleJob('sync_gsc', 7 * 24 * hour, () => syncGSCPerformance());
  scheduleJob('release_abandoned_order_inventory', 30 * 60 * 1000, () => releaseAbandonedOrderInventory());
  console.log('[seo-cron] Scheduler started');
}

export function stopSeoCronScheduler() {
  while (timers.length > 0) {
    const timer = timers.pop();
    if (timer) clearTimeout(timer);
  }
}

if (require.main === module && isDirectCronRun()) {
  runSeoCronJobs()
    .then((results) => {
      console.log(JSON.stringify(results, null, 2));
      process.exit(results.some((result) => !result.ok) ? 1 : 0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
