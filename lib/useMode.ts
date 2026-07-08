'use client'

import { useCallback, useSyncExternalStore } from 'react'

export type Mode = 'user' | 'admin'

function normalizeMode(value: string | null): Mode {
  return value === 'admin' ? 'admin' : 'user'
}

function getModeSnapshot(): Mode {
  return typeof window === 'undefined'
    ? 'user'
    : normalizeMode(window.localStorage.getItem('seo-mode'))
}

function subscribeMode(callback: () => void): () => void {
  window.addEventListener('modechange', callback)
  window.addEventListener('storage', callback)
  return () => {
    window.removeEventListener('modechange', callback)
    window.removeEventListener('storage', callback)
  }
}

function getServerModeSnapshot(): Mode {
  return 'user'
}

export function useMode(): [Mode, (m: Mode) => void] {
  const mode = useSyncExternalStore(subscribeMode, getModeSnapshot, getServerModeSnapshot)

  const setMode = useCallback((m: Mode) => {
    window.localStorage.setItem('seo-mode', m)
    window.dispatchEvent(new Event('modechange'))
  }, [])

  return [mode, setMode]
}
