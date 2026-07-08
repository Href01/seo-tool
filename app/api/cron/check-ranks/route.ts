import { NextResponse } from 'next/server'
import { checkAll } from '@/lib/tracking'

export const runtime = 'nodejs'
export const maxDuration = 60 // Vercel Hobby cap

// Daily Vercel Cron (see vercel.json). Each tracked keyword gets a fresh SERP
// lookup — a PAID DataForSEO call — so this endpoint MUST stay non-public.
//
// Protection: Vercel automatically sends `Authorization: Bearer <CRON_SECRET>`
// when the CRON_SECRET env var is set. We refuse to run if it isn't set, so the
// route is never triggerable by a random visitor burning credits.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET non configuré' }, { status: 503 })
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'non autorisé' }, { status: 401 })
  }

  try {
    const summary = await checkAll()
    return NextResponse.json({ ok: true, at: new Date().toISOString(), ...summary })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur' }, { status: 500 })
  }
}
