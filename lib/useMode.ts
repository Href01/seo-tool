'use client'

import { useState, useEffect } from 'react'

export type Mode = 'user' | 'admin'

export function useMode(): [Mode, (m: Mode) => void] {
  const [mode, setModeState] = useState<Mode>('user')

  useEffect(() => {
    const stored = localStorage.getItem('seo-mode') as Mode | null
    if (stored === 'admin' || stored === 'user') {
      setModeState(stored)
    }
  }, [])

  function setMode(m: Mode) {
    setModeState(m)
    localStorage.setItem('seo-mode', m)
  }

  return [mode, setMode]
}
