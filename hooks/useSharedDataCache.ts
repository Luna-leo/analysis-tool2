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

  const getCacheKey = useCallback((periodId: string, parameters: string[], xAxisType?: string, yAxisParamsKey?: string): string => {
    // Include xAxisType and yAxisParamsKey in cache key to force refetch when axis type or Y parameters change
    const axisTypePrefix = xAxisType ? `${xAxisType}:` : ''
    const yAxisSuffix = yAxisParamsKey ? `:${yAxisParamsKey}` : ''
    return `${axisTypePrefix}${periodId}:${parameters.sort().join(',')}${yAxisSuffix}`
  }, [])

  const get = useCallback(
    async (
      periodId: string,
      parameters: string[],
      fetchFn: () => Promise<CSVDataPoint[] | undefined>,
      xAxisType?: string,
      yAxisParamsKey?: string
    ): Promise<CSVDataPoint[] | undefined> => {
      const key = getCacheKey(periodId, parameters, xAxisType, yAxisParamsKey)
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
      // Check if the key contains the periodId (considering xAxisType prefix)
      if (key.includes(`:${periodId}:`) || key.startsWith(`${periodId}:`)) {
        cacheRef.current.delete(key)
      }
    }
  }, [])

  const clearForDataSources = useCallback((dataSourceIds: string[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[useSharedDataCache] Clearing cache for data sources:', dataSourceIds)
    }
    
    for (const [key, _] of cacheRef.current.entries()) {
      // Check if the key contains any of the dataSourceIds
      const shouldClear = dataSourceIds.some(id => 
        key.includes(`:${id}:`) || key.startsWith(`${id}:`)
      )
      
      if (shouldClear) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[useSharedDataCache] Clearing cache entry:', key)
        }
        cacheRef.current.delete(key)
      }
    }
  }, [])

  return {
    get,
    clear,
    clearForPeriod,
    clearForDataSources
  }
}