import { test, expect } from '@playwright/test'

test('the theme toggle switches the page between light and dark', async ({ page }) => {
  await page.goto('/')

  const toggle = page.getByRole('button', { name: /^Theme:/ })
  await expect(toggle).toHaveText('Theme: Light')

  const lightBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)

  await toggle.click()

  await expect(toggle).toHaveText('Theme: Dark')
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  expect(darkBg).not.toBe(lightBg)

  await toggle.click()

  await expect(toggle).toHaveText('Theme: Light')
  const backToLightBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor)
  expect(backToLightBg).toBe(lightBg)
})
