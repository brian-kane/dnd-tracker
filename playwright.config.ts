import { defineConfig, devices } from '@playwright/test'

// Acceptance tests run against the production build (`npm run test:e2e` builds
// first), so they exercise what actually gets deployed.
export default defineConfig({
  testDir: './e2e',
  forbidOnly: !!process.env.CI,
  // No retries: a flaky acceptance test should fail loudly, not pass on try two.
  retries: 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
})
