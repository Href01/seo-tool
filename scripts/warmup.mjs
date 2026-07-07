#!/usr/bin/env node
// Warm up the keyword bank with e-commerce seeds for Morocco. Run once locally:
//   VERCEL_URL=https://seo-tool-ten-sooty.vercel.app node scripts/warmup.mjs
// or point it at localhost:3000 if running `npm run dev`.

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = process.env.VERCEL_URL || 'http://localhost:3000'

const seeds = readFileSync(join(__dirname, 'warmup-seeds.txt'), 'utf-8')
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean)

console.log(`[warmup] ${seeds.length} seeds → calling /api/keywords (Morocco, fr) for each\n`)

let done = 0
for (const seed of seeds) {
  try {
    const res = await fetch(`${BASE}/api/keywords`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword: seed, location: 2504, language: 'fr' }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    const count = data.results?.length ?? 0
    done++
    console.log(`[${done}/${seeds.length}] "${seed}" → ${count} suggestions (${data.cached ? 'cache' : 'fresh'})`)
  } catch (e) {
    console.error(`[${done + 1}/${seeds.length}] "${seed}" → ERROR:`, e.message)
  }
}

console.log(`\n[warmup] Done. Check /database to see the bank.`)
