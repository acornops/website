import { existsSync } from 'node:fs';
import { defineConfig } from '@playwright/test';

const localChrome = '/usr/bin/google-chrome';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'line',
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      maxDiffPixelRatio: 0.02
    }
  },
  use: {
    baseURL: 'http://127.0.0.1:4322',
    browserName: 'chromium',
    colorScheme: 'light',
    trace: 'retain-on-failure',
    ...(existsSync(localChrome) ? { launchOptions: { executablePath: localChrome } } : {})
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4322',
    url: 'http://127.0.0.1:4322',
    reuseExistingServer: false,
    timeout: 120_000
  }
});
