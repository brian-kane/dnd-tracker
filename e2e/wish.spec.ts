import { test, expect } from '@playwright/test'

test('the send-a-wish link opens a pre-filled mailto', async ({ page }) => {
  await page.goto('/')

  const link = page.getByRole('link', { name: 'Send a wish' })
  await expect(link).toHaveAttribute('href', /^mailto:[^?]+\?subject=Wish%3A%20$/)
})

// CI sets VITE_WISH_EMAIL to the Requests list's real address, so this
// proves the link targets it rather than some placeholder.
test('the send-a-wish link targets the configured address', async ({ page }) => {
  const wishEmail = process.env.VITE_WISH_EMAIL
  if (!wishEmail) {
    test.skip(true, 'VITE_WISH_EMAIL is only set in CI')
    return
  }

  await page.goto('/')

  const link = page.getByRole('link', { name: 'Send a wish' })
  await expect(link).toHaveAttribute(
    'href',
    `mailto:${wishEmail}?subject=${encodeURIComponent('Wish: ')}`,
  )
})
