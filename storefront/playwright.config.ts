import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 60000,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    headless: true,
  },
  webServer: process.env.BASE_URL
    ? undefined
    : [
        {
          command: 'node scripts/e2e-mock-api.mjs',
          url: 'http://127.0.0.1:4000/health',
          reuseExistingServer: !process.env.CI,
          timeout: 30000,
          gracefulShutdown: {
            signal: 'SIGTERM',
            timeout: 5000,
          },
        },
        {
          command: 'node scripts/playwright-storefront-server.mjs',
          url: 'http://127.0.0.1:3000/health',
          reuseExistingServer: !process.env.CI,
          timeout: 240000,
          gracefulShutdown: {
            signal: 'SIGTERM',
            timeout: 5000,
          },
        },
      ],
  projects: [
    {
      name: 'mobile-375',
      use: { ...devices['Desktop Chrome'], viewport: { width: 375, height: 812 } },
    },
    {
      name: 'tablet-768',
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } },
    },
    {
      name: 'tablet-1024',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 } },
    },
    {
      name: 'desktop-1440',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
  ],
});
