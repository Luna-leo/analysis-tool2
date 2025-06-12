import React, { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MemoryWarningProps {
  threshold?: number // Percentage threshold (0-100)
  onOptimize?: () => void
}

export function MemoryWarning({ threshold = 80, onOptimize }: MemoryWarningProps) {
  const [isWarningVisible, setIsWarningVisible] = useState(false)
  const [memoryUsage, setMemoryUsage] = useState(0)
  const [memoryLimit, setMemoryLimit] = useState(0)

  useEffect(() => {
    if (!('memory' in performance) || !performance.memory) {
      return // Memory API not available
    }

    const checkMemory = () => {
      const used = performance.memory!.usedJSHeapSize
      const limit = performance.memory!.jsHeapSizeLimit
      const usagePercentage = (used / limit) * 100

      setMemoryUsage(Math.round(used / 1048576)) // Convert to MB
      setMemoryLimit(Math.round(limit / 1048576))

      // Show warning if above threshold
      if (usagePercentage >= threshold && !isWarningVisible) {
        setIsWarningVisible(true)
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
          setIsWarningVisible(false)
        }, 10000)
      }
    }

    // Check memory every 5 seconds
    const interval = setInterval(checkMemory, 5000)
    
    // Initial check
    checkMemory()

    return () => clearInterval(interval)
  }, [threshold, isWarningVisible])

  if (!isWarningVisible || !('memory' in performance)) return null

  const usagePercentage = (memoryUsage / memoryLimit) * 100

  return (
    <div
      className={cn(
        "fixed top-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 w-80",
        "border-2 transition-all duration-300 z-50",
        usagePercentage >= 90 ? "border-red-500" : "border-yellow-500"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <AlertTriangle 
            className={cn(
              "w-5 h-5 mt-0.5",
              usagePercentage >= 90 ? "text-red-500" : "text-yellow-500"
            )} 
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              High Memory Usage
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Your application is using {memoryUsage} MB of {memoryLimit} MB 
              ({usagePercentage.toFixed(1)}%)
            </p>
            
            <div className="mt-3 space-y-2">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-300",
                    usagePercentage >= 90 ? "bg-red-500" : "bg-yellow-500"
                  )}
                  style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                />
              </div>
              
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Recommendations:
                <ul className="mt-1 ml-4 list-disc">
                  <li>Close unused tabs</li>
                  <li>Reduce chart complexity</li>
                  <li>Clear cache data</li>
                </ul>
              </div>
              
              {onOptimize && (
                <button
                  onClick={onOptimize}
                  className="mt-2 px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
                >
                  Optimize Performance
                </button>
              )}
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setIsWarningVisible(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}