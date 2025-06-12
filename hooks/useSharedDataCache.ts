import { useRef, useCallback } from 'react'
import { CSVDataPoint } from '@/stores/useCSVDataStore'

interface CacheEntry {
  promise: Promise<CSVDataPoint[] | undefined>
  timestamp: number
  key: string
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function useSharedDataCache() {
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map())

  const getCacheKey = useCallback((periodId: string, parameters: string[]): string => {
    return `${periodId}:${parameters.sort().join(',')}`
  }, [])

  const get = useCallback(
    async (
      periodId: string,
      parameters: string[],
      fetchFn: () => Promise<CSVDataPoint[] | undefined>
    ): Promise<CSVDataPoint[] | undefined> => {
      const key = getCacheKey(periodId, parameters)
      const now = Date.now()
      
      // Check if we have a valid cache entry
      const existingEntry = cacheRef.current.get(key)
      if (existingEntry && now - existingEntry.timestamp < CACHE_TTL) {
        return existingEntry.promise
      }

      // Create new promise for this request
      const promise = fetchFn()
      
      // Store in cache
      cacheRef.current.set(key, {
        promise,
        timestamp: now,
        key
      })

      // Clean up old entries
      for (const [cacheKey, entry] of cacheRef.current.entries()) {
        if (now - entry.timestamp > CACHE_TTL) {
          cacheRef.current.delete(cacheKey)
        }
      }

      return promise
    },
    [getCacheKey]
  )

  const clear = useCallback(() => {
    cacheRef.current.clear()
  }, [])

  const clearForPeriod = useCallback((periodId: string) => {
    for (const [key, _] of cacheRef.current.entries()) {
      if (key.startsWith(`${periodId}:`)) {
        cacheRef.current.delete(key)
      }
    }
  }, [])

  return {
    get,
    clear,
    clearForPeriod
  }
}