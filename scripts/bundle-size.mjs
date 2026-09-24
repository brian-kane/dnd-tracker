#!/usr/bin/env node
// Gzip size budget for dist/assets/*.{js,css}. Run after `vite build`.
// Usage: node scripts/bundle-size.mjs [baseline.json]
//
// Writes current sizes to bundle-size.json, appends a markdown summary to
// $GITHUB_STEP_SUMMARY (or prints it), and exits 1 if either budget is
// exceeded. With a readable baseline.json (main's own last measurement),
// the summary also shows the size change; a missing or unreadable baseline
// (e.g. this feature's own first run, before main has one) just shows
// absolute sizes.

import { appendFileSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

// Set a little under measured sizes (24.4 kB JS, 0.39 kB CSS gzipped) so a
// regression fails the PR immediately.
const BUDGETS = { js: 30_000, css: 2_000 }

const distAssets = 'dist/assets'

function gzipTotal(extension) {
  return readdirSync(distAssets)
    .filter((file) => file.endsWith(extension))
    .reduce((total, file) => total + gzipSync(readFileSync(join(distAssets, file))).length, 0)
}

const current = { js: gzipTotal('.js'), css: gzipTotal('.css') }
writeFileSync('bundle-size.json', JSON.stringify(current, null, 2))

let baseline = null
const baselinePath = process.argv[2]
if (baselinePath) {
  try {
    baseline = JSON.parse(readFileSync(baselinePath, 'utf8'))
  } catch {
    baseline = null
  }
}

const kb = (bytes) => (bytes / 1000).toFixed(1)

function row(label, bytes, budget, baselineBytes) {
  const change =
    baselineBytes == null
      ? ''
      : ` (${bytes - baselineBytes >= 0 ? '+' : ''}${kb(bytes - baselineBytes)} kB)`
  return `| ${label} | ${kb(bytes)} kB${change} | ${kb(budget)} kB |`
}

const lines = [
  '### Bundle size (gzipped)',
  '| | Size | Budget |',
  '| --- | --- | --- |',
  row('JS', current.js, BUDGETS.js, baseline?.js),
  row('CSS', current.css, BUDGETS.css, baseline?.css),
]
if (!baseline) lines.push('', '_No main baseline yet — showing absolute size only._')

const summary = lines.join('\n') + '\n'
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary)
} else {
  console.log(summary)
}

if (current.js > BUDGETS.js || current.css > BUDGETS.css) {
  console.error('Bundle size budget exceeded.')
  process.exit(1)
}
