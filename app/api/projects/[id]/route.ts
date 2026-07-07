import { NextResponse } from 'next/server'
import { getProject } from '@/lib/projects'

export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const project = await getProject(id)
    if (!project) {
      return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })
    }
    return NextResponse.json({ project })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur' }, { status: 500 })
  }
}
