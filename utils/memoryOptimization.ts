import { getGlobalCacheManager } from './cache/CacheManager'
import { performanceTracker } from './performanceTracking'

interface MemoryOptimizationResult {
  clearedCache: boolean
  clearedPerformanceData: boolean
  freedMemory: number // in MB
  suggestions: string[]
}

/**
 * Perform memory optimization
 */
export async function optimizeMemory(): Promise<MemoryOptimizationResult> {
  const result: MemoryOptimizationResult = {
    clearedCache: false,
    clearedPerformanceData: false,
    freedMemory: 0,
    suggestions: []
  }

  // Get initial memory usage
  let initialMemory = 0
  if ('memory' in performance && performance.memory) {
    initialMemory = performance.memory.usedJSHeapSize
  }

  try {
    // 1. Clear cache
    const cacheManager = getGlobalCacheManager()
    const cacheStats = cacheManager.getStats()
    if (cacheStats.memorySize > 10 * 1024 * 1024) { // If cache is using more than 10MB
      cacheManager.clear()
      result.clearedCache = true
    }

    // 2. Clear performance tracking data
    performanceTracker.clear()
    result.clearedPerformanceData = true

    // 3. Clear localStorage of old data
    if (typeof window !== 'undefined') {
      const keysToCheck = ['cacheStats', 'performanceStats']
      keysToCheck.forEach(key => {
        const data = localStorage.getItem(key)
        if (data) {
          try {
            const parsed = JSON.parse(data)
            if (parsed.timestamp && Date.now() - parsed.timestamp > 24 * 60 * 60 * 1000) {
              localStorage.removeItem(key)
            }
          } catch {
            // Remove invalid data
            localStorage.removeItem(key)
          }
        }
      })
    }

    // 4. Force garbage collection if available (Chrome DevTools)
    if (typeof window !== 'undefined' && 'gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc()
    }

    // Calculate freed memory
    if ('memory' in performance && performance.memory) {
      const finalMemory = performance.memory.usedJSHeapSize
      result.freedMemory = Math.max(0, (initialMemory - finalMemory) / 1048576) // Convert to MB
    }

    // Add suggestions based on current state
    result.suggestions = generateMemoryOptimizationSuggestions()

  } catch (error) {
    console.error('Error during memory optimization:', error)
  }

  return result
}

/**
 * Generate memory optimization suggestions based on current state
 */
function generateMemoryOptimizationSuggestions(): string[] {
  const suggestions: string[] = []

  // Check DOM elements
  if (typeof document !== 'undefined') {
    const chartCount = document.querySelectorAll('[class*="chart-"]').length
    if (chartCount > 50) {
      suggestions.push(`Consider reducing the number of visible charts (currently ${chartCount})`)
    }

    const dataPointCount = document.querySelectorAll('[class*="scatter-points"]').length
    if (dataPointCount > 10000) {
      suggestions.push(`High number of data points detected (${dataPointCount}). Consider using data aggregation`)
    }
  }

  // Check memory usage
  if ('memory' in performance && performance.memory) {
    const usagePercentage = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
    if (usagePercentage > 60) {
      suggestions.push('Consider closing unused browser tabs to free up memory')
    }
  }

  // General suggestions
  suggestions.push('Enable virtualization for large datasets')
  suggestions.push('Use pagination for data-heavy views')
  suggestions.push('Regularly save your work and refresh the page')

  return suggestions
}

/**
 * Monitor memory usage and trigger warnings
 */
export class MemoryMonitor {
  private intervalId?: NodeJS.Timeout
  private callbacks: Set<(usage: number) => void> = new Set()
  private warningThreshold: number = 80 // percentage

  start(intervalMs: number = 5000) {
    if (this.intervalId) return
    
    this.intervalId = setInterval(() => {
      if ('memory' in performance && performance.memory) {
        const usage = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
        
        // Notify all callbacks
        this.callbacks.forEach(callback => callback(usage))
        
        // Log if above threshold
        if (usage > this.warningThreshold) {
          console.warn(`High memory usage detected: ${usage.toFixed(1)}%`)
        }
      }
    }, intervalMs)
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
    }
  }

  addCallback(callback: (usage: number) => void) {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  setWarningThreshold(threshold: number) {
    this.warningThreshold = Math.max(0, Math.min(100, threshold))
  }
}

// Singleton instance
export const memoryMonitor = new MemoryMonitor()