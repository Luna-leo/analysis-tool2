/**
 * Performance tracking utilities for monitoring rendering and data processing
 */

import React from 'react'

interface PerformanceEntry {
  name: string
  startTime: number
  duration: number
  metadata?: Record<string, any>
}

class PerformanceTracker {
  private marks: Map<string, number> = new Map()
  private measures: PerformanceEntry[] = []
  private maxEntries: number = 100

  /**
   * Start timing a performance metric
   */
  mark(name: string): void {
    this.marks.set(name, performance.now())
  }

  /**
   * Measure time between mark and now, or between two marks
   */
  measure(name: string, startMark: string, endMark?: string, metadata?: Record<string, any>): number {
    const startTime = this.marks.get(startMark)
    if (!startTime) {
      console.warn(`Performance mark "${startMark}" not found`)
      return 0
    }

    const endTime = endMark ? (this.marks.get(endMark) || performance.now()) : performance.now()
    const duration = endTime - startTime

    // Store measure
    this.measures.push({
      name,
      startTime,
      duration,
      metadata
    })

    // Limit stored measures
    if (this.measures.length > this.maxEntries) {
      this.measures = this.measures.slice(-this.maxEntries)
    }

    // Also use native Performance API if available
    if (performance.measure) {
      try {
        performance.measure(name, startMark, endMark)
      } catch (e) {
        // Ignore if marks don't exist in Performance API
      }
    }

    return duration
  }

  /**
   * Get all measures for a specific metric
   */
  getMeasures(name?: string): PerformanceEntry[] {
    if (name) {
      return this.measures.filter(m => m.name === name)
    }
    return [...this.measures]
  }

  /**
   * Get average duration for a specific metric
   */
  getAverageDuration(name: string): number {
    const measures = this.getMeasures(name)
    if (measures.length === 0) return 0
    
    const sum = measures.reduce((acc, m) => acc + m.duration, 0)
    return sum / measures.length
  }

  /**
   * Clear all marks and measures
   */
  clear(): void {
    this.marks.clear()
    this.measures = []
    
    // Clear native Performance API entries
    if (performance.clearMarks) {
      performance.clearMarks()
    }
    if (performance.clearMeasures) {
      performance.clearMeasures()
    }
  }

  /**
   * Get performance statistics
   */
  getStats(): Record<string, any> {
    const stats: Record<string, any> = {}
    
    // Group measures by name
    const grouped = this.measures.reduce((acc, measure) => {
      if (!acc[measure.name]) {
        acc[measure.name] = []
      }
      acc[measure.name].push(measure.duration)
      return acc
    }, {} as Record<string, number[]>)

    // Calculate stats for each metric
    Object.entries(grouped).forEach(([name, durations]) => {
      const sorted = [...durations].sort((a, b) => a - b)
      const sum = durations.reduce((a, b) => a + b, 0)
      
      stats[name] = {
        count: durations.length,
        average: sum / durations.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        median: sorted[Math.floor(sorted.length / 2)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
      }
    })

    return stats
  }
}

// Singleton instance
export const performanceTracker = new PerformanceTracker()

/**
 * HOC to track component render performance
 */
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
): React.ComponentType<P> {
  return React.memo((props: P) => {
    React.useEffect(() => {
      performanceTracker.mark(`${componentName}-render-start`)
      
      return () => {
        performanceTracker.measure(
          `${componentName}-render`,
          `${componentName}-render-start`
        )
      }
    })

    return React.createElement(Component, props)
  })
}

/**
 * Hook to track performance within a component
 */
export function usePerformanceTracking(metricName: string) {
  const markRef = React.useRef<string | undefined>(undefined)

  const startTracking = React.useCallback((suffix?: string) => {
    const mark = `${metricName}${suffix ? `-${suffix}` : ''}-${Date.now()}`
    markRef.current = mark
    performanceTracker.mark(mark)
  }, [metricName])

  const endTracking = React.useCallback((metadata?: Record<string, any>) => {
    if (!markRef.current) return 0
    
    const duration = performanceTracker.measure(
      metricName,
      markRef.current,
      undefined,
      metadata
    )
    
    markRef.current = undefined
    return duration
  }, [metricName])

  return { startTracking, endTracking }
}

/**
 * Utility to track async operations
 */
export async function trackAsyncOperation<T>(
  name: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const startMark = `${name}-${Date.now()}`
  performanceTracker.mark(startMark)
  
  try {
    const result = await operation()
    performanceTracker.measure(name, startMark, undefined, metadata)
    return result
  } catch (error) {
    performanceTracker.measure(`${name}-error`, startMark, undefined, { ...metadata, error: true })
    throw error
  }
}