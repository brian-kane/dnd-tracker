import { execFileSync } from 'node:child_process'

import { test, expect } from '@playwright/test'

import { CHANGELOG_GIT_ARGS, parseChangelog } from '../scripts/changelog.ts'

// The build under test was made from this same checkout, so git log here is
// the source of truth for what the changelog should show.
const gitEntries = parseChangelog(execFileSync('git', CHANGELOG_GIT_ARGS, { encoding: 'utf8' }))

test('the changelog lists the latest commit first', async ({ page }) => {
  const latest = gitEntries[0]
  if (!latest) throw new Error('git log has no changelog entries')

  await page.goto('/')
  await page.getByText('Changelog').click()

  const first = page.locator('.changelog li').first()
  await expect(first).toContainText(latest.type)
  await expect(first).toContainText(`${latest.scope}: ${latest.outcome}`)
  await expect(first.locator('time')).toHaveText(latest.date)
  await expect(page.locator('.changelog li')).toHaveCount(gitEntries.length)
})

test('each changelog entry links to its commit on GitHub', async ({ page }) => {
  await page.goto('/')
  await page.getByText('Changelog').click()

  const hrefs = await page.locator('.changelog li a').evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')),
  )
  expect(hrefs).toEqual(
    gitEntries.map((entry) => `https://github.com/brian-kane/dnd-tracker/commit/${entry.sha}`),
  )
})
