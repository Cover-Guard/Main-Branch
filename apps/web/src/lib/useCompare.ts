'use client'

import { useState, useCallback } from 'react'

const MAX_COMPARE = 3
const STORAGE_KEY = 'cg_compare_ids'

export function useCompare() {
  const [ids, setIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? (JSON.parse(stored) as string[]) : []
    } catch {
      return []
    }
  })

  const persist = useCallback((next: string[]) => {
    setIds(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }, [])

  const toggle = useCallback((id: string) => {
    setIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < MAX_COMPARE
        ? [...prev, id]
        : prev
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const clear = useCallback(() => persist([]), [persist])

  return {
    ids,
    toggle,
    clear,
    canAdd: ids.length < MAX_COMPARE,
    compareUrl: ids.length >= 2 ? `/compare?ids=${ids.join(',')}` : null,
  }
}
