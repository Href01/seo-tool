import crypto from 'crypto'
import { promisify } from 'util'
import { NextResponse } from 'next/server'
import { getPool, ready } from './db'

const scrypt = promisify(crypto.scrypt)

export const SESSION_COOKIE = 'seo_session'
const SESSION_DAYS = 30

export interface AuthUser {
  id: string
  email: string
  name: string | null
  role: 'user' | 'admin'
}

export class AuthError extends Error {
  status: number

  constructor(message = 'Connexion requise', status = 401) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {}
  if (!header) return out
  for (const part of header.split(';')) {
    const [rawKey, ...rest] = part.trim().split('=')
    if (!rawKey || rest.length === 0) continue
    out[rawKey] = decodeURIComponent(rest.join('='))
  }
  return out
}

function tokenHash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('base64url')
  const derived = (await scrypt(password, salt, 64)) as Buffer
  return `scrypt$${salt}$${derived.toString('base64url')}`
}

async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false
  const [kind, salt, encoded] = stored.split('$')
  if (kind !== 'scrypt' || !salt || !encoded) return false
  const actual = Buffer.from(encoded, 'base64url')
  const derived = (await scrypt(password, salt, actual.length)) as Buffer
  return actual.length === derived.length && crypto.timingSafeEqual(actual, derived)
}

function sessionExpires(): Date {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
}

export function sessionCookie(token: string, expires: Date): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; Expires=${expires.toUTCString()}; HttpOnly; SameSite=Lax${secure}`
}

export function clearSessionCookie(): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${SESSION_COOKIE}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax${secure}`
}

function toUser(row: {
  id: string
  email: string
  name: string | null
  role: string
}): AuthUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role === 'admin' ? 'admin' : 'user',
  }
}

export async function getSessionUser(req: Request): Promise<AuthUser | null> {
  const p = getPool()
  if (!p) return null
  const token = parseCookies(req.headers.get('cookie'))[SESSION_COOKIE]
  if (!token) return null

  await ready()
  const r = await p.query<{
    id: string
    email: string
    name: string | null
    role: string
  }>(
    `SELECT u.id, u.email, u.name, u.role
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.session_token = $1 AND s.expires > now()
     LIMIT 1`,
    [tokenHash(token)]
  )
  return r.rows[0] ? toUser(r.rows[0]) : null
}

export async function requireUser(req: Request): Promise<AuthUser> {
  const user = await getSessionUser(req)
  if (!user) throw new AuthError()
  return user
}

export async function requireAdmin(req: Request): Promise<AuthUser> {
  const user = await requireUser(req)
  if (user.role !== 'admin') throw new AuthError('Acces admin requis', 403)
  return user
}

export function authJsonError(error: unknown): NextResponse {
  if (error instanceof AuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status })
  }
  return NextResponse.json({ error: 'Erreur auth' }, { status: 500 })
}

export async function signupUser(input: {
  email: string
  password: string
  name?: string
}): Promise<AuthUser> {
  const p = getPool()
  if (!p) throw new AuthError('Base de donnees requise pour les comptes', 503)
  const email = normalizeEmail(input.email)
  const name = input.name?.trim() || null
  if (!email.includes('@') || email.length > 254) {
    throw new AuthError('Email invalide', 400)
  }
  if (input.password.length < 8) {
    throw new AuthError('Mot de passe trop court (8 caracteres minimum)', 400)
  }

  await ready()
  const count = await p.query<{ n: number }>(`SELECT count(*)::int AS n FROM users`)
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const role = count.rows[0]?.n === 0 || (adminEmail && email === adminEmail) ? 'admin' : 'user'
  const passwordHash = await hashPassword(input.password)
  const id = `user_${crypto.randomUUID()}`

  try {
    const r = await p.query<{
      id: string
      email: string
      name: string | null
      role: string
    }>(
      `INSERT INTO users (id, email, name, role, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, role`,
      [id, email, name, role, passwordHash]
    )
    return toUser(r.rows[0])
  } catch (e: unknown) {
    const code = typeof e === 'object' && e && 'code' in e ? String(e.code) : ''
    if (code === '23505') throw new AuthError('Compte deja existant', 409)
    throw e
  }
}

export async function loginUser(emailInput: string, password: string): Promise<AuthUser> {
  const p = getPool()
  if (!p) throw new AuthError('Base de donnees requise pour les comptes', 503)
  const email = normalizeEmail(emailInput)
  await ready()
  const r = await p.query<{
    id: string
    email: string
    name: string | null
    role: string
    password_hash: string | null
  }>(
    `SELECT id, email, name, role, password_hash FROM users WHERE email = $1 LIMIT 1`,
    [email]
  )
  const row = r.rows[0]
  if (!row || !(await verifyPassword(password, row.password_hash))) {
    throw new AuthError('Identifiants invalides', 401)
  }
  return toUser(row)
}

export async function createSession(userId: string): Promise<{ token: string; expires: Date }> {
  const p = getPool()
  if (!p) throw new AuthError('Base de donnees requise pour les comptes', 503)
  await ready()
  const token = crypto.randomBytes(32).toString('base64url')
  const expires = sessionExpires()
  await p.query(
    `INSERT INTO sessions (id, session_token, user_id, expires)
     VALUES ($1, $2, $3, $4)`,
    [`sess_${crypto.randomUUID()}`, tokenHash(token), userId, expires]
  )
  return { token, expires }
}

export async function destroySession(req: Request): Promise<void> {
  const p = getPool()
  if (!p) return
  const token = parseCookies(req.headers.get('cookie'))[SESSION_COOKIE]
  if (!token) return
  await ready()
  await p.query(`DELETE FROM sessions WHERE session_token = $1`, [tokenHash(token)])
}
