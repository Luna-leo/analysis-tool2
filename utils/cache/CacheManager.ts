import { LRUCache } from './LRUCache'

export interface CacheStrategy {
  maxAge?: number // Max age in milliseconds
  maxSize?: number // Max size in bytes
  staleWhileRevalidate?: boolean
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  size: number
  tags?: string[]
}

/**
 * Advanced cache manager with invalidation strategies
 */
export class CacheManager<T = any> {
  private cache: LRUCache<string, CacheEntry<T>>
  private tagIndex: Map<string, Set<string>> = new Map()
  private defaultMaxAge: number
  private revalidationQueue: Set<string> = new Set()

  constructor(options: {
    maxMemoryMB?: number
    defaultMaxAge?: number // Default: 5 minutes
  }) {
    this.defaultMaxAge = options.defaultMaxAge || 5 * 60 * 1000
    
    this.cache = new LRUCache<string, CacheEntry<T>>({
      maxMemorySize: (options.maxMemoryMB || 50) * 1024 * 1024,
      sizeCalculator: (entry) => entry.size
    })
  }

  /**
   * Get data from cache
   */
  async get(
    key: string,
    fetcher?: () => Promise<T>,
    strategy: CacheStrategy = {}
  ): Promise<T | undefined> {
    const entry = this.cache.get(key)
    
    if (entry) {
      const age = Date.now() - entry.timestamp
      const maxAge = strategy.maxAge || this.defaultMaxAge
      
      // Check if cache is still valid
      if (age < maxAge) {
        return entry.data
      }
      
      // Stale while revalidate strategy
      if (strategy.staleWhileRevalidate && fetcher) {
        this.revalidateInBackground(key, fetcher, strategy)
        return entry.data // Return stale data
      }
    }
    
    // Fetch new data if fetcher provided
    if (fetcher) {
      try {
        const data = await fetcher()
        this.set(key, data, { tags: [], ...strategy })
        return data
      } catch (error) {
        // Return stale data on error if available
        if (entry && strategy.staleWhileRevalidate) {
          return entry.data
        }
        throw error
      }
    }
    
    return undefined
  }

  /**
   * Set data in cache
   */
  set(key: string, data: T, options: { tags?: string[] } & CacheStrategy = {}): void {
    const size = this.calculateSize(data)
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      size,
      tags: options.tags
    }
    
    // Update tag index
    if (options.tags) {
      for (const tag of options.tags) {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, new Set())
        }
        this.tagIndex.get(tag)!.add(key)
      }
    }
    
    this.cache.set(key, entry)
  }

  /**
   * Invalidate cache by key pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let invalidated = 0
    const keys = this.cache.keys()
    
    for (const key of keys) {
      if (pattern.test(key)) {
        this.cache.delete(key)
        invalidated++
      }
    }
    
    return invalidated
  }

  /**
   * Invalidate cache by tags
   */
  invalidateTags(tags: string[]): number {
    let invalidated = 0
    
    for (const tag of tags) {
      const keys = this.tagIndex.get(tag)
      if (keys) {
        for (const key of keys) {
          this.cache.delete(key)
          invalidated++
        }
        this.tagIndex.delete(tag)
      }
    }
    
    return invalidated
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear()
    this.tagIndex.clear()
    this.revalidationQueue.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const cacheStats = this.cache.getStats()
    const stats = {
      ...cacheStats,
      tagCount: this.tagIndex.size,
      revalidationQueueSize: this.revalidationQueue.size
    }
    
    // Store in localStorage for performance monitor
    if (typeof window !== 'undefined') {
      localStorage.setItem('cacheStats', JSON.stringify(stats))
    }
    
    return stats
  }

  /**
   * Revalidate in background
   */
  private async revalidateInBackground(
    key: string,
    fetcher: () => Promise<T>,
    strategy: CacheStrategy
  ): Promise<void> {
    // Prevent duplicate revalidations
    if (this.revalidationQueue.has(key)) {
      return
    }
    
    this.revalidationQueue.add(key)
    
    try {
      const data = await fetcher()
      const entry = this.cache.get(key)
      this.set(key, data, { tags: entry?.tags, ...strategy })
    } catch (error) {
      console.error(`Failed to revalidate cache for key: ${key}`, error)
    } finally {
      this.revalidationQueue.delete(key)
    }
  }

  /**
   * Calculate approximate size of data
   */
  private calculateSize(data: T): number {
    if (data === null || data === undefined) return 0
    
    if (typeof data === 'string') {
      return data.length * 2 // 2 bytes per character
    }
    
    if (typeof data === 'number') {
      return 8 // 8 bytes for number
    }
    
    if (typeof data === 'boolean') {
      return 4 // 4 bytes for boolean
    }
    
    if (Array.isArray(data)) {
      return data.reduce((sum, item) => sum + this.calculateSize(item), 0)
    }
    
    if (typeof data === 'object') {
      // Rough estimation using JSON
      try {
        return JSON.stringify(data).length * 2
      } catch {
        return 1024 // Default 1KB for objects that can't be stringified
      }
    }
    
    return 0
  }
}

// Global cache manager instance
let globalCacheManager: CacheManager | null = null

/**
 * Get or create global cache manager
 */
export function getGlobalCacheManager(): CacheManager {
  if (!globalCacheManager) {
    globalCacheManager = new CacheManager({
      maxMemoryMB: 100,
      defaultMaxAge: 5 * 60 * 1000 // 5 minutes
    })
  }
  return globalCacheManager
}