import { NextResponse } from 'next/server'
import { listBank, bankCount } from '@/lib/bank'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const search = new URL(req.url).searchParams.get('search') ?? ''
  try {
    const [items, count] = await Promise.all([listBank({ search }), bankCount()])
    return NextResponse.json({ count, items })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur' }, { status: 500 })
  }
}
