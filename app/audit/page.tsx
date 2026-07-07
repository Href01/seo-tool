'use client'

import { useState } from 'react'
import { useSeoQuery, timeAgo } from '@/lib/useSeoQuery'

interface PageAudit {
  url: string
  onpageScore: number | null
  title: string | null
  titleLength: number | null
  description: string | null
  descriptionLength: number | null
  h1: string[]
  wordCount: number | null
  internalLinks: number | null
  externalLinks: number | null
  issues: string[]
}

const fmt = (n: number | null) => (n != null ? n.toLocaleString('fr') : '—')

export default function AuditPage() {
  const [url, setUrl] = useState('')
  const { loading, error, cached, fetchedAt, data, run } = useSeoQuery<PageAudit>('/api/audit')

  function search(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    run({ url })
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight">Audit de page</h1>
      <p className="mt-2 text-sm text-neutral-500">
        Diagnostic on-page instantané d&apos;une URL : score, meta, et problèmes détectés. Cache partagé.
      </p>

      <form onSubmit={search} className="mt-8 flex gap-2">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="ex : https://monsite.ma/produit"
          className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-neutral-900 px-5 py-2.5 font-medium text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {loading ? '…' : 'Auditer'}
        </button>
      </form>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {cached !== null && !error && data && (
        <p className="mt-6 text-xs text-neutral-500">
          {data.url} · {cached ? '⚡ depuis le cache (0 $)' : '💳 requête DataForSEO'}
          {cached && fetchedAt ? ` · maj ${timeAgo(fetchedAt)}` : ''}
        </p>
      )}

      {data && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <div className="text-xs uppercase text-neutral-500">Score on-page</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">
                {data.onpageScore != null ? Math.round(data.onpageScore) : '—'}
              </div>
            </div>
            <div className="rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <div className="text-xs uppercase text-neutral-500">Mots</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{fmt(data.wordCount)}</div>
            </div>
            <div className="rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <div className="text-xs uppercase text-neutral-500">Liens internes</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{fmt(data.internalLinks)}</div>
            </div>
            <div className="rounded-lg border border-neutral-200 px-4 py-3 dark:border-neutral-800">
              <div className="text-xs uppercase text-neutral-500">Liens externes</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">{fmt(data.externalLinks)}</div>
            </div>
          </div>

          <div className="mt-3 space-y-3 rounded-lg border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800">
            <div>
              <span className="text-xs uppercase text-neutral-500">
                Titre {data.titleLength != null && `(${data.titleLength})`}
              </span>
              <p className="mt-0.5">{data.title || '— manquant —'}</p>
            </div>
            <div>
              <span className="text-xs uppercase text-neutral-500">
                Meta description {data.descriptionLength != null && `(${data.descriptionLength})`}
              </span>
              <p className="mt-0.5">{data.description || '— manquante —'}</p>
            </div>
            <div>
              <span className="text-xs uppercase text-neutral-500">H1</span>
              <p className="mt-0.5">{data.h1.length > 0 ? data.h1.join(' · ') : '— manquant —'}</p>
            </div>
          </div>

          <div className="mt-3">
            <div className="mb-2 text-xs uppercase text-neutral-500">
              Problèmes détectés ({data.issues.length})
            </div>
            {data.issues.length === 0 ? (
              <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                ✓ Aucun problème majeur détecté.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {data.issues.map((issue) => (
                  <li
                    key={issue}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
                  >
                    ⚠ {issue}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </main>
  )
}
