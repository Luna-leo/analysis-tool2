import { useCallback } from 'react'
import { CacheManager, CacheStrategy } from '@/utils/cache/CacheManager'
import { CSVDataPoint } from '@/stores/useCSVDataStore'

interface DataCache {
  get: (
    periodId: string,
    parameters: string[],
    fetchFn: () => Promise<CSVDataPoint[] | undefined>
  ) => Promise<CSVDataPoint[] | undefined>
  invalidate: (periodId?: string) => void
  clear: () => void
  getStats: () => any
}

// Create a shared cache manager instance
const sharedCacheManager = new CacheManager<CSVDataPoint[] | undefined>({
  maxMemoryMB: 50,
  defaultMaxAge: 5 * 60 * 1000 // 5 minutes
})

export function useAdvancedDataCache(): DataCache {
  const getCacheKey = useCallback((periodId: string, parameters: string[]): string => {
    return `${periodId}:${parameters.sort().join(',')}`
  }, [])
  
  const get = useCallback(async (
    periodId: string,
    parameters: string[],
    fetchFn: () => Promise<CSVDataPoint[] | undefined>
  ): Promise<CSVDataPoint[] | undefined> => {
    const cacheKey = getCacheKey(periodId, parameters)
    
    // Define cache strategy
    const strategy: CacheStrategy = {
      maxAge: 5 * 60 * 1000, // 5 minutes
      staleWhileRevalidate: true // Return stale data while fetching new
    }
    
    // Use cache manager with tags for better invalidation
    const result = await sharedCacheManager.get(
      cacheKey,
      fetchFn,
      strategy
    )
    
    return result
  }, [getCacheKey])
  
  const invalidate = useCallback((periodId?: string) => {
    if (periodId) {
      // Invalidate by pattern
      const pattern = new RegExp(`^${periodId}:`)
      sharedCacheManager.invalidatePattern(pattern)
    } else {
      // Clear all cache
      sharedCacheManager.clear()
    }
  }, [])
  
  const clear = useCallback(() => {
    sharedCacheManager.clear()
  }, [])
  
  const getStats = useCallback(() => {
    return sharedCacheManager.getStats()
  }, [])
  
  return { get, invalidate, clear, getStats }
}