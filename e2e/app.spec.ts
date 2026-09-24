import { test, expect } from '@playwright/test'

test('the app loads', async ({ page }) => {
  const pageErrors: Error[] = []
  page.on('pageerror', (error) => pageErrors.push(error))

  await page.goto('/')

  await expect(page).toHaveTitle('D&D Tracker')
  await expect(page.locator('#app main')).toBeAttached()
  expect(pageErrors).toEqual([])
})
