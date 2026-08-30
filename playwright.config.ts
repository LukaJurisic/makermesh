import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', {open: 'never'}]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev:e2e',
    url: 'http://127.0.0.1:4173',
    env: {
      CONVEX_DEPLOYMENT: 'anonymous:anonymous-agent',
      VITE_CONVEX_URL: 'http://127.0.0.1:3210',
      VITE_CONVEX_SITE_URL: 'http://127.0.0.1:3211',
    },
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {name: 'chromium', use: {...devices['Desktop Chrome']}},
    {name: 'mobile-chromium', use: {...devices['Pixel 7']}},
  ],
});
