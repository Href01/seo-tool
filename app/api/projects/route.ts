import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { createProject, listProjects, deleteProject } from '@/lib/projects'
import { cleanDomain } from '@/lib/dataforseo'

export const runtime = 'nodejs'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  try {
    const projects = await listProjects(session.user.id)
    return NextResponse.json({ projects })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const name = (body.name || '').toString().trim()
  const domain = cleanDomain(body.domain || '')

  if (!name || !domain || !domain.includes('.')) {
    return NextResponse.json(
      { error: 'nom et domaine requis (ex : Mon Site, monsite.ma)' },
      { status: 400 }
    )
  }

  try {
    const id = await createProject(session.user.id, name, domain)
    return NextResponse.json({ id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }
  const body = await req.json().catch(() => ({}))
  const id = (body.id || '').toString().trim()
  if (!id) {
    return NextResponse.json({ error: 'id requis' }, { status: 400 })
  }
  try {
    await deleteProject(id, session.user.id)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erreur' }, { status: 500 })
  }
}
