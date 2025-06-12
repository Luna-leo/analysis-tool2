/**
 * LRU (Least Recently Used) Cache implementation
 * Automatically evicts least recently used items when capacity is reached
 */
export class LRUCache<K, V> {
  private capacity: number
  private cache: Map<K, V>
  private accessOrder: Map<K, number>
  private accessCounter: number
  private sizeCalculator?: (value: V) => number
  private maxMemorySize?: number
  private currentMemorySize: number

  constructor(options: {
    capacity?: number
    maxMemorySize?: number
    sizeCalculator?: (value: V) => number
  }) {
    this.capacity = options.capacity || 100
    this.maxMemorySize = options.maxMemorySize
    this.sizeCalculator = options.sizeCalculator
    this.cache = new Map()
    this.accessOrder = new Map()
    this.accessCounter = 0
    this.currentMemorySize = 0
  }

  /**
   * Get a value from the cache
   */
  get(key: K): V | undefined {
    const value = this.cache.get(key)
    if (value !== undefined) {
      // Update access order
      this.accessOrder.set(key, this.accessCounter++)
    }
    return value
  }

  /**
   * Set a value in the cache
   */
  set(key: K, value: V): void {
    // If key already exists, remove old size
    if (this.cache.has(key) && this.sizeCalculator) {
      const oldValue = this.cache.get(key)!
      this.currentMemorySize -= this.sizeCalculator(oldValue)
    }

    // Calculate size of new value
    const valueSize = this.sizeCalculator ? this.sizeCalculator(value) : 1

    // Check if we need to evict items
    if (this.maxMemorySize) {
      while (this.currentMemorySize + valueSize > this.maxMemorySize && this.cache.size > 0) {
        this.evictLRU()
      }
    } else {
      while (this.cache.size >= this.capacity && !this.cache.has(key)) {
        this.evictLRU()
      }
    }

    // Add new value
    this.cache.set(key, value)
    this.accessOrder.set(key, this.accessCounter++)
    this.currentMemorySize += valueSize
  }

  /**
   * Check if a key exists in the cache
   */
  has(key: K): boolean {
    return this.cache.has(key)
  }

  /**
   * Delete a specific key from the cache
   */
  delete(key: K): boolean {
    const value = this.cache.get(key)
    if (value !== undefined && this.sizeCalculator) {
      this.currentMemorySize -= this.sizeCalculator(value)
    }
    this.accessOrder.delete(key)
    return this.cache.delete(key)
  }

  /**
   * Clear all items from the cache
   */
  clear(): void {
    this.cache.clear()
    this.accessOrder.clear()
    this.currentMemorySize = 0
    this.accessCounter = 0
  }

  /**
   * Get the current size of the cache
   */
  get size(): number {
    return this.cache.size
  }

  /**
   * Get the current memory usage
   */
  get memorySize(): number {
    return this.currentMemorySize
  }

  /**
   * Get all keys in the cache (ordered by most recent access)
   */
  keys(): K[] {
    return Array.from(this.accessOrder.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number
    capacity: number
    memorySize: number
    maxMemorySize?: number
    hitRate: number
  } {
    return {
      size: this.cache.size,
      capacity: this.capacity,
      memorySize: this.currentMemorySize,
      maxMemorySize: this.maxMemorySize,
      hitRate: this.calculateHitRate()
    }
  }

  /**
   * Evict the least recently used item
   */
  private evictLRU(): void {
    let lruKey: K | undefined
    let lruAccessTime = Infinity

    // Find the least recently used key
    for (const [key, accessTime] of this.accessOrder.entries()) {
      if (accessTime < lruAccessTime) {
        lruAccessTime = accessTime
        lruKey = key
      }
    }

    if (lruKey !== undefined) {
      this.delete(lruKey)
    }
  }

  // Statistics tracking
  private hits = 0
  private misses = 0

  private calculateHitRate(): number {
    const total = this.hits + this.misses
    return total === 0 ? 0 : this.hits / total
  }

  /**
   * Get with statistics tracking
   */
  getWithStats(key: K): V | undefined {
    const value = this.get(key)
    if (value !== undefined) {
      this.hits++
    } else {
      this.misses++
    }
    return value
  }
}

/**
 * Create a memory-aware LRU cache for chart data
 */
export function createChartDataCache(maxMemoryMB: number = 100) {
  return new LRUCache<string, any[]>({
    maxMemorySize: maxMemoryMB * 1024 * 1024, // Convert MB to bytes
    sizeCalculator: (data: any[]) => {
      // Rough estimation: 8 bytes per number, 2 bytes per character for strings
      let size = 0
      for (const item of data) {
        if (typeof item === 'object') {
          size += JSON.stringify(item).length * 2
        } else if (typeof item === 'number') {
          size += 8
        } else if (typeof item === 'string') {
          size += item.length * 2
        }
      }
      return size
    }
  })
}