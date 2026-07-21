import { Hono } from 'hono';
import { and, desc, eq, gte, ilike, or, sql } from 'drizzle-orm';
import { db } from '../../db/client';
import { security_events } from '../../db/schema';
import { verifyAdmin } from '../../middleware/auth';

const router = new Hono();
const ALERT_POLICIES = [
  {
    event: 'Rate limit exceeded',
    title: 'Rate-limit spike',
    warnThreshold: 10,
    errorThreshold: 25,
    windowHours: 1,
    description:
      'Repeated throttling usually means a bot, scraper, or abusive client is hammering public routes.',
  },
  {
    event: 'Invalid order tracking lookup',
    title: 'Tracking lookup abuse',
    warnThreshold: 8,
    errorThreshold: 20,
    windowHours: 1,
    description:
      'Repeated invalid order-number lookups can indicate enumeration attempts against order tracking.',
  },
  {
    event: 'Order tracking lookup not found',
    title: 'Tracking miss spike',
    warnThreshold: 15,
    errorThreshold: 35,
    windowHours: 1,
    description:
      'A sudden burst of lookup misses often means probing or guessing against the tracking surface.',
  },
  {
    event: 'Contact form validation failed',
    title: 'Contact form spam signal',
    warnThreshold: 10,
    errorThreshold: 25,
    windowHours: 1,
    description:
      'Repeated invalid contact submissions can point to automated spam or reconnaissance traffic.',
  },
  {
    event: 'Newsletter validation failed',
    title: 'Newsletter abuse signal',
    warnThreshold: 10,
    errorThreshold: 25,
    windowHours: 1,
    description:
      'Repeated invalid newsletter submissions usually come from spam tooling or scripted abuse.',
  },
  {
    event: 'Studio inquiry validation failed',
    title: 'Studio inquiry spam signal',
    warnThreshold: 10,
    errorThreshold: 25,
    windowHours: 1,
    description:
      'A burst of invalid studio inquiry payloads usually means automated form abuse.',
  },
] as const;

router.get('/', verifyAdmin, async (c) => {
  try {
    const { severity = 'all', search = '', event = '' } = c.req.query();
    const conditions = [];

    if (severity && severity !== 'all') {
      conditions.push(eq(security_events.severity, severity));
    }

    if (event) {
      conditions.push(eq(security_events.event, event));
    }

    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          ilike(security_events.event, pattern),
          ilike(security_events.path, pattern),
          ilike(security_events.ip_address, pattern),
          sql`cast(${security_events.details} as text) ilike ${pattern}`
        )
      );
    }

    const rows = await db
      .select()
      .from(security_events)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(security_events.created_at))
      .limit(300);

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    const [stats] = await db
      .select({
        total: sql<number>`count(*)`,
        warn: sql<number>`count(*) filter (where ${security_events.severity} = 'warn')`,
        error: sql<number>`count(*) filter (where ${security_events.severity} = 'error')`,
      })
      .from(security_events);

    const [last24hStats] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(security_events)
      .where(gte(security_events.created_at, since));

    const [lastHourStats] = await db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(security_events)
      .where(gte(security_events.created_at, lastHour));

    const [topEvent] = await db
      .select({
        event: security_events.event,
        count: sql<number>`count(*)`,
      })
      .from(security_events)
      .where(gte(security_events.created_at, since))
      .groupBy(security_events.event)
      .orderBy(sql`count(*) desc`, desc(security_events.event))
      .limit(1);

    const lastHourCounts = await db
      .select({
        event: security_events.event,
        count: sql<number>`count(*)`,
      })
      .from(security_events)
      .where(gte(security_events.created_at, lastHour))
      .groupBy(security_events.event);

    const countsByEvent = new Map(
      lastHourCounts.map((row) => [row.event, Number(row.count || 0)])
    );

    const alerts = ALERT_POLICIES.map((policy) => {
      const count = countsByEvent.get(policy.event) || 0;
      const severity =
        count >= policy.errorThreshold
          ? 'error'
          : count >= policy.warnThreshold
            ? 'warn'
            : null;

      if (!severity) return null;

      return {
        event: policy.event,
        title: policy.title,
        description: policy.description,
        severity,
        count,
        threshold:
          severity === 'error' ? policy.errorThreshold : policy.warnThreshold,
        window_hours: policy.windowHours,
      };
    })
      .filter(Boolean)
      .sort((a, b) => {
        if (a!.severity === b!.severity) {
          return b!.count - a!.count;
        }
        return a!.severity === 'error' ? -1 : 1;
      });

    return c.json({
      events: rows.map((row) => ({
        ...row,
        details:
          row.details && typeof row.details === 'string'
            ? JSON.parse(row.details)
            : row.details,
      })),
      stats: {
        total: Number(stats?.total || 0),
        warn: Number(stats?.warn || 0),
        error: Number(stats?.error || 0),
        last_1h: Number(lastHourStats?.count || 0),
        last_24h: Number(last24hStats?.count || 0),
        top_event_24h: topEvent?.event || null,
        top_event_count_24h: Number(topEvent?.count || 0),
      },
      alerts,
    });
  } catch (error) {
    console.error('[Admin Security Events] GET error:', error);
    return c.json({ error: 'Failed to fetch security events' }, 500);
  }
});

export default router;
