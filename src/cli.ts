#!/usr/bin/env node
// @mostajs/qrpanel — CLI
// Author: Dr Hamid MADANI <drmdh@msn.com>
//
// Commandes disponibles :
//   qrpanel init        → écrit .qrconfig.json à cwd avec les defaults
//   qrpanel themes      → liste les 12 thèmes natifs
//   qrpanel --version   → version du package

import { ensureQrConfig, DEFAULT_CONFIG } from './config.js'
import { listThemes, THEMES } from './themes.js'

const args = process.argv.slice(2)
const cmd = args[0] ?? 'help'

function help() {
  console.log(`@mostajs/qrpanel — CLI

Usage:
  qrpanel init [path]      Generate .qrconfig.json at cwd (or [path]).
                           Idempotent — does not overwrite existing config.
  qrpanel themes           List built-in theme keys.
  qrpanel --version | -v   Print version.
  qrpanel help | -h        This help.

Config file (.qrconfig.json) drives all generators. Master toggle:
  "genimage": false  → bypass theme pipeline, QR-only output.
  "theme": "random"  → randomize from themePool at each generation.
`)
}

async function main() {
  switch (cmd) {
    case 'init': {
      const cwd = args[1] ?? process.cwd()
      const path = ensureQrConfig(cwd)
      console.log(`✓ qrpanel config ready at: ${path}`)
      console.log(`  Edit it to customize defaults — master toggle "genimage" toggles the whole pipeline.`)
      break
    }
    case 'themes': {
      console.log(`Built-in themes (${listThemes().length}):`)
      for (const key of listThemes()) {
        console.log(`  - ${key.padEnd(10)} (${THEMES[key].label})`)
      }
      console.log(`\nDefaults config :`)
      console.log(`  themePool : ${DEFAULT_CONFIG.default.themePool.join(', ')}`)
      break
    }
    case '--version':
    case '-v': {
      // Lecture programmatique du package.json sans import JSON (cross-runtime safe)
      const { readFileSync } = await import('node:fs')
      const { fileURLToPath } = await import('node:url')
      const { dirname, join } = await import('node:path')
      const here = dirname(fileURLToPath(import.meta.url))
      const pkgPath = join(here, '..', 'package.json')
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string }
      console.log(pkg.version)
      break
    }
    case 'help':
    case '--help':
    case '-h':
    default:
      help()
      break
  }
}

main().catch((e) => {
  console.error('[qrpanel] error:', (e as Error).message)
  process.exit(1)
})
