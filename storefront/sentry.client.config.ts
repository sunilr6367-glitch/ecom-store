import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Define how likely traces are sampled
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Replay integration - disabled to avoid dependency issues
  // Can enable by installing @sentry/replay
  // integrations: [
  //   new Replay({
  //     replaysSessionSampleRate: 0.1,
  //     replaysOnErrorSampleRate: 1.0,
  //   }),
  // ],

  // Setting this option to true will print useful information to the console while you're setting up Sentry
  debug: process.env.NODE_ENV === 'development',
  
  // Only enable Sentry in production or if DSN is provided
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Environment
  environment: process.env.NODE_ENV || 'development',
  
  // Release version (helps track which deployments introduced errors)
  release: process.env.NEXT_PUBLIC_APP_VERSION || 'odhvica-storefront@1.0.0',
  
  // Before sending event, you can modify it
  beforeSend(event) {
    // Don't send errors in development if no DSN is configured
    if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_SENTRY_DSN) {
      return null;
    }
    return event;
  },
});
