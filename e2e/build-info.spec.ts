import { test, expect } from '@playwright/test'

test('the footer shows the build commit and time', async ({ page }) => {
  await page.goto('/')

  const footer = page.locator('footer')
  const link = footer.getByRole('link')
  await expect(link).toHaveText(/^[0-9a-f]{7}$/)
  const shortSha = await link.textContent()
  await expect(link).toHaveAttribute(
    'href',
    new RegExp(`^https://github\\.com/brian-kane/dnd-tracker/commit/${shortSha}[0-9a-f]{33}$`),
  )
  await expect(footer.locator('time')).not.toBeEmpty()
})

// CI sets BUILD_SHA to the pull request's head commit, so this proves a
// preview shows the branch's commit rather than GitHub's merge commit.
test('the footer shows the commit the build was made from', async ({ page }) => {
  const buildSha = process.env.BUILD_SHA
  if (!buildSha) {
    test.skip(true, 'BUILD_SHA is only set in CI')
    return
  }

  await page.goto('/')

  const link = page.locator('footer').getByRole('link')
  await expect(link).toHaveText(buildSha.slice(0, 7))
  await expect(link).toHaveAttribute('href', new RegExp(`/commit/${buildSha}$`))
})
