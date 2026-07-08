import { NextResponse } from 'next/server'
import { createProject, listProjects, deleteProject } from '@/lib/projects'
import { cleanDomain } from '@/lib/dataforseo'
import { guard } from '@/lib/guard'
import { jsonError, readJson, stringParam } from '@/lib/api'
import { authJsonError, requireUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const blocked = await guard(req)
  if (blocked) return blocked
  try {
    const user = await requireUser(req)
    const projects = await listProjects(user.id)
    return NextResponse.json({ projects })
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AuthError') return authJsonError(e)
    return jsonError(e)
  }
}

export async function POST(req: Request) {
  const blocked = await guard(req)
  if (blocked) return blocked
  try {
    const user = await requireUser(req)
    const body = await readJson(req)
    const name = stringParam(body, 'name')
    const domain = cleanDomain(stringParam(body, 'domain'))

    if (!name || !domain || !domain.includes('.')) {
      return NextResponse.json(
        { error: 'nom et domaine requis (ex : Mon Site, monsite.ma)' },
        { status: 400 }
      )
    }

    const id = await createProject(user.id, name, domain)
    return NextResponse.json({ id })
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AuthError') return authJsonError(e)
    return jsonError(e)
  }
}

export async function DELETE(req: Request) {
  const blocked = await guard(req)
  if (blocked) return blocked
  try {
    const user = await requireUser(req)
    const body = await readJson(req)
    const id = stringParam(body, 'id')
    if (!id) {
      return NextResponse.json({ error: 'id requis' }, { status: 400 })
    }
    await deleteProject(id, user.id)
    return NextResponse.json({ ok: true })
  } catch (e: unknown) {
    if (e instanceof Error && e.name === 'AuthError') return authJsonError(e)
    return jsonError(e)
  }
}
