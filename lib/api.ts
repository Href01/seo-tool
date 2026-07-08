import { NextResponse } from 'next/server'
import { errorMessage } from './errors'

export { errorMessage } from './errors'

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const json: unknown = await req.json()
    return isRecord(json) ? json : {}
  } catch {
    return {}
  }
}

export function stringParam(
  body: Record<string, unknown>,
  key: string,
  fallback = ''
): string {
  const value = body[key]
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim()
  return fallback
}

export function numberParam(
  body: Record<string, unknown>,
  key: string,
  fallback: number
): number {
  const value = body[key]
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed !== 0 ? parsed : fallback
}

export function positiveIntParam(body: Record<string, unknown>, key: string): number | null {
  const parsed = Number(body[key])
  if (!Number.isInteger(parsed) || parsed <= 0) return null
  return parsed
}

export function jsonError(error: unknown, status = 500, fallback = 'Erreur') {
  return NextResponse.json({ error: errorMessage(error, fallback) }, { status })
}
