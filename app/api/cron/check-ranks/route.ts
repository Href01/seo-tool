import { NextResponse } from 'next/server'
import { checkAll } from '@/lib/tracking'
import { jsonError } from '@/lib/api'

export const runtime = 'nodejs'
export const maxDuration = 60 // Vercel Hobby cap

// Daily Vercel Cron. Each tracked keyword gets a fresh paid SERP lookup.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET non configure' }, { status: 503 })
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'non autorise' }, { status: 401 })
  }

  try {
    const summary = await checkAll()
    return NextResponse.json({ ok: true, at: new Date().toISOString(), ...summary })
  } catch (e: unknown) {
    return jsonError(e)
  }
}
