import { test, expect } from '@playwright/test'

// Only meaningful against a deployed Firebase Hosting preview: `vite preview`
// (what the rest of e2e/ runs against) doesn't send Firebase's headers, and
// firebase.json's CSP applies only to a Firebase-served page.
const previewUrl = process.env.PREVIEW_URL

test('the preview sends the expected security headers', async ({ request }) => {
  if (!previewUrl) {
    test.skip(true, 'PREVIEW_URL is only set for the Firebase preview deploy')
    return
  }

  const response = await request.get(previewUrl)
  const headers = response.headers()

  expect(headers['content-security-policy']).toBe(
    "default-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'",
  )
  // Firebase Hosting sends its own HSTS header unconditionally and ignores
  // any value set in firebase.json, so this checks what it actually sends
  // rather than a value we don't control.
  expect(headers['strict-transport-security']).toMatch(/^max-age=\d+; includeSubDomains/)
  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
})

test('the app still renders under the CSP', async ({ page }) => {
  if (!previewUrl) {
    test.skip(true, 'PREVIEW_URL is only set for the Firebase preview deploy')
    return
  }

  const pageErrors: Error[] = []
  const consoleErrors: string[] = []
  page.on('pageerror', (error) => pageErrors.push(error))
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  await page.goto(previewUrl)

  // A blocked script or stylesheet would leave the footer (rendered from
  // build-time data by JS that the CSP must allow to run) missing, and a CSP
  // violation shows up as a console error, so this fails if the policy is
  // too strict for the app itself, not just too loose.
  const footer = page.locator('footer')
  await expect(footer.getByRole('link')).toHaveText(/^[0-9a-f]{7}$/)
  expect(consoleErrors).toEqual([])
  expect(pageErrors).toEqual([])
})
