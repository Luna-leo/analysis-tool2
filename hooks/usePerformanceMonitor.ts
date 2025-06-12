import { useState, useEffect } from 'react'

export function usePerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if performance monitoring is enabled
    const isEnabled = localStorage.getItem('performanceMonitorEnabled') === 'true'
    setIsVisible(isEnabled)

    // Keyboard shortcut to toggle performance monitor (Ctrl/Cmd + Shift + P)
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault()
        setIsVisible(prev => {
          const newValue = !prev
          localStorage.setItem('performanceMonitorEnabled', String(newValue))
          return newValue
        })
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  return {
    isVisible,
    setIsVisible: (value: boolean) => {
      setIsVisible(value)
      localStorage.setItem('performanceMonitorEnabled', String(value))
    }
  }
}