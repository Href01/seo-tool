// Project management — each user can create projects (sites) to track.

import { getPool, ready } from './db'

export interface Project {
  id: string
  userId: string
  name: string
  domain: string
  createdAt: string
}

const NO_DB = 'Base de données requise'

export async function createProject(
  userId: string,
  name: string,
  domain: string
): Promise<string> {
  const p = getPool()
  if (!p) throw new Error(NO_DB)
  await ready()
  const id = `proj_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  await p.query(
    `INSERT INTO projects (id, user_id, name, domain) VALUES ($1, $2, $3, $4)`,
    [id, userId, name, domain]
  )
  return id
}

export async function listProjects(userId: string): Promise<Project[]> {
  const p = getPool()
  if (!p) return []
  await ready()
  const r = await p.query(
    `SELECT id, user_id, name, domain, created_at FROM projects WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  )
  return r.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    domain: row.domain,
    createdAt: row.created_at,
  }))
}

export async function listAllProjects(): Promise<Project[]> {
  const p = getPool()
  if (!p) return []
  await ready()
  const r = await p.query(
    `SELECT id, user_id, name, domain, created_at FROM projects ORDER BY created_at DESC`
  )
  return r.rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    domain: row.domain,
    createdAt: row.created_at,
  }))
}

export async function deleteProject(id: string, userId: string): Promise<void> {
  const p = getPool()
  if (!p) throw new Error(NO_DB)
  await ready()
  await p.query(`DELETE FROM projects WHERE id = $1 AND user_id = $2`, [id, userId])
}

export async function getProject(id: string): Promise<Project | null> {
  const p = getPool()
  if (!p) return null
  await ready()
  const r = await p.query(
    `SELECT id, user_id, name, domain, created_at FROM projects WHERE id = $1`,
    [id]
  )
  const row = r.rows[0]
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    domain: row.domain,
    createdAt: row.created_at,
  }
}
