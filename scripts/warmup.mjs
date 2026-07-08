#!/usr/bin/env node
// Warm up the keyword bank with e-commerce seeds for Morocco. Run once locally:
//   VERCEL_URL=https://seo-tool-ten-sooty.vercel.app node scripts/warmup.mjs
// or point it at localhost:3000 if running `npm run dev`.

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = process.env.VERCEL_URL || 'http://localhost:3000'
// Stay under the abuse guard's 25 req/min/IP limit (see lib/guard.ts) so every
// seed actually lands. 3s between calls => 20/min. Override with WARMUP_DELAY_MS.
const DELAY_MS = Number(process.env.WARMUP_DELAY_MS) || 3000
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const seeds = readFileSync(join(__dirname, 'warmup-seeds.txt'), 'utf-8')
  .split('\n')
  .map((l) => l.trim())
  .filter(Boolean)

console.log(`[warmup] ${seeds.length} seeds → calling /api/keywords (Morocco, fr) for each`)
console.log(`[warmup] target ${BASE} · ${DELAY_MS}ms between calls\n`)

let done = 0
let fresh = 0
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
    if (!data.cached) fresh++
    console.log(`[${done}/${seeds.length}] "${seed}" → ${count} suggestions (${data.cached ? 'cache' : 'fresh'})`)
  } catch (e) {
    console.error(`[${done + 1}/${seeds.length}] "${seed}" → ERROR:`, e.message)
  }
  await sleep(DELAY_MS)
}

console.log(`\n[warmup] Done. ${done}/${seeds.length} ok, ${fresh} paid (fresh), ${done - fresh} from cache.`)
console.log(`[warmup] Check /database to see the bank.`)
