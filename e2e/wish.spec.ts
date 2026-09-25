import { test, expect } from '@playwright/test'

// Whether the link renders depends on VITE_WISH_EMAIL at build time. Locally
// that comes from .env.local, which Vite reads directly — this Node process
// never sees it via process.env, so these key off the rendered DOM instead
// of guessing from the environment.
test('the send-a-wish link opens a pre-filled mailto when a wish email is configured', async ({
  page,
}) => {
  await page.goto('/')

  const link = page.getByRole('link', { name: 'Send a wish' })
  if ((await link.count()) === 0) {
    test.skip(true, 'no VITE_WISH_EMAIL was baked into this build')
    return
  }

  await expect(link).toHaveAttribute('href', /^mailto:[^?]+\?subject=Wish%3A%20$/)
})

// CI sets VITE_WISH_EMAIL as a real process env var for both the build and
// this test process, so it's the one place this can check the exact
// address, not just its shape.
test('the send-a-wish link targets the configured address', async ({ page }) => {
  const wishEmail = process.env.VITE_WISH_EMAIL
  if (!wishEmail) {
    test.skip(true, 'VITE_WISH_EMAIL is not set for this process')
    return
  }

  await page.goto('/')

  const link = page.getByRole('link', { name: 'Send a wish' })
  await expect(link).toHaveAttribute(
    'href',
    `mailto:${wishEmail}?subject=${encodeURIComponent('Wish: ')}`,
  )
})

test('the app still loads when no wish email is configured', async ({ page }) => {
  const pageErrors: Error[] = []
  page.on('pageerror', (error) => pageErrors.push(error))

  await page.goto('/')

  const link = page.getByRole('link', { name: 'Send a wish' })
  if ((await link.count()) > 0) {
    test.skip(true, 'a wish email is configured for this build')
    return
  }

  expect(pageErrors).toEqual([])
})
