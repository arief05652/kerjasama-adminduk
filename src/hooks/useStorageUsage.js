import { useCallback, useEffect, useState } from 'react'
import { fetchUsage, subscribe } from '../lib/api'

export function useStorageUsage(intervalMs = 15000) {
  const [usage, setUsage] = useState(null)

  const refresh = useCallback(async () => {
    try {
      setUsage(await fetchUsage())
    } catch {
      // biarkan data lama; error usage tidak menghalangi explorer
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, intervalMs)
    const unsubscribe = subscribe((type) => {
      if (type === 'fs') refresh()
    })
    return () => {
      clearInterval(id)
      unsubscribe()
    }
  }, [refresh, intervalMs])

  return { usage, refresh }
}
