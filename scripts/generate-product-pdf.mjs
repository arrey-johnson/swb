#!/usr/bin/env node
/**
 * Generates SaveWithBanks Product Guide PDF from markdown.
 * Usage: node scripts/generate-product-pdf.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const mdPath = join(root, 'docs/product-owner-guide.md')
const cssPath = join(root, 'docs/pdf-styles.css')
const outPath = join(root, 'docs/SaveWithBanks-Product-Guide.pdf')

// Install md-to-pdf locally if needed via npx
const result = spawnSync(
  'npx',
  [
    '--yes',
    'md-to-pdf',
    mdPath,
    '--stylesheet',
    cssPath,
    '--dest',
    outPath,
    '--pdf-options',
    JSON.stringify({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    }),
  ],
  { cwd: root, stdio: 'inherit', shell: true }
)

if (result.status !== 0) {
  console.error('PDF generation failed')
  process.exit(1)
}

console.log(`\n✓ PDF saved to: ${outPath}`)
