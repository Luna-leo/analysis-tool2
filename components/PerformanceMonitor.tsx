import React, { useEffect, useState, useRef } from 'react'
import { X } from 'lucide-react'

interface PerformanceMetrics {
  fps: number
  memoryUsage: number
  memoryLimit: number
  renderTime: number
  cacheHitRate: number
  dataPoints: number
}

interface PerformanceMonitorProps {
  isVisible?: boolean
  onClose?: () => void
}

export function PerformanceMonitor({ isVisible = true, onClose }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    memoryLimit: 0,
    renderTime: 0,
    cacheHitRate: 0,
    dataPoints: 0
  })
  
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())
  const animationIdRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (!isVisible) return

    // FPS calculation
    const calculateFPS = () => {
      const now = performance.now()
      const delta = now - lastTimeRef.current
      frameCountRef.current++

      if (delta >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / delta)
        frameCountRef.current = 0
        lastTimeRef.current = now

        // Memory usage (if available)
        let memoryUsage = 0
        let memoryLimit = 0
        if ('memory' in performance && performance.memory) {
          memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1048576) // Convert to MB
          memoryLimit = Math.round(performance.memory.jsHeapSizeLimit / 1048576)
        }

        // Get performance marks
        const renderMarks = performance.getEntriesByType('measure')
          .filter(entry => entry.name.startsWith('render-'))
        
        const avgRenderTime = renderMarks.length > 0
          ? renderMarks.reduce((sum, mark) => sum + mark.duration, 0) / renderMarks.length
          : 0

        // Get cache stats from localStorage (would be better from actual cache)
        const cacheStats = localStorage.getItem('cacheStats')
        const cacheHitRate = cacheStats ? JSON.parse(cacheStats).hitRate || 0 : 0

        // Get data points count from DOM
        const dataPoints = document.querySelectorAll('[class*="scatter-points"]').length

        setMetrics({
          fps,
          memoryUsage,
          memoryLimit,
          renderTime: Math.round(avgRenderTime),
          cacheHitRate,
          dataPoints
        })

        // Clear old performance marks
        performance.clearMeasures()
      }

      animationIdRef.current = requestAnimationFrame(calculateFPS)
    }

    animationIdRef.current = requestAnimationFrame(calculateFPS)

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [isVisible])

  if (!isVisible) return null

  const getColorForMetric = (value: number, thresholds: { good: number; warning: number }) => {
    if (value >= thresholds.good) return 'text-green-600'
    if (value >= thresholds.warning) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getFPSColor = () => getColorForMetric(metrics.fps, { good: 50, warning: 30 })
  const getMemoryColor = () => {
    const usage = (metrics.memoryUsage / metrics.memoryLimit) * 100
    if (usage < 50) return 'text-green-600'
    if (usage < 80) return 'text-yellow-600'
    return 'text-red-600'
  }
  const getRenderTimeColor = () => {
    if (metrics.renderTime < 16) return 'text-green-600'
    if (metrics.renderTime < 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 w-72 border border-gray-200 dark:border-gray-700 z-50">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Performance Monitor</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">FPS:</span>
          <span className={`font-mono ${getFPSColor()}`}>{metrics.fps}</span>
        </div>
        
        {metrics.memoryLimit > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Memory:</span>
            <span className={`font-mono ${getMemoryColor()}`}>
              {metrics.memoryUsage} / {metrics.memoryLimit} MB
            </span>
          </div>
        )}
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Render Time:</span>
          <span className={`font-mono ${getRenderTimeColor()}`}>{metrics.renderTime}ms</span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Cache Hit Rate:</span>
          <span className="font-mono text-gray-700 dark:text-gray-300">
            {(metrics.cacheHitRate * 100).toFixed(1)}%
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-600 dark:text-gray-400">Data Points:</span>
          <span className="font-mono text-gray-700 dark:text-gray-300">{metrics.dataPoints}</span>
        </div>
      </div>
      
      {/* Memory usage bar */}
      {metrics.memoryLimit > 0 && (
        <div className="mt-3">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                (metrics.memoryUsage / metrics.memoryLimit) * 100 < 50
                  ? 'bg-green-500'
                  : (metrics.memoryUsage / metrics.memoryLimit) * 100 < 80
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${(metrics.memoryUsage / metrics.memoryLimit) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}