import { NextResponse } from 'next/server'
import { getProject } from '@/lib/projects'
import { guard } from '@/lib/guard'
import { jsonError } from '@/lib/api'
import { authJsonError, requireUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await guard(req)
  if (blocked) return blocked
  const { id } = await params
  try {
    const user = await requireUser(req)
    const project = await getProject(id, user.id)
    if (!project) {
      return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })
    }
    return NextResponse.json({ project })
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AuthError') return authJsonError(e)
    return jsonError(e)
  }
}
