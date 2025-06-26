import React from 'react'

/**
 * Wrap component updates in startTransition for non-urgent updates
 */
export function useDeferredUpdate<T>(value: T, delay = 100): T {
  const [deferredValue, setDeferredValue] = React.useState(value)
  
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      React.startTransition(() => {
        setDeferredValue(value)
      })
    }, delay)
    
    return () => clearTimeout(timeoutId)
  }, [value, delay])
  
  return deferredValue
}

/**
 * Use passive event listeners for better scroll performance
 */
export function usePassiveEventListener(
  element: HTMLElement | null,
  event: string,
  handler: EventListener,
  deps: React.DependencyList = []
) {
  React.useEffect(() => {
    if (!element) return
    
    element.addEventListener(event, handler, { passive: true })
    
    return () => {
      element.removeEventListener(event, handler)
    }
  }, [element, event, ...deps])
}

/**
 * Batch DOM updates using requestIdleCallback
 */
export function useBatchedUpdates<T>(
  updates: T[],
  updateHandler: (update: T) => void,
  priority: 'high' | 'low' = 'low'
) {
  const pendingUpdates = React.useRef<T[]>([])
  const idleCallbackId = React.useRef<number | null>(null)
  
  const processBatch = React.useCallback(() => {
    const batch = pendingUpdates.current.splice(0, 10) // Process 10 items at a time
    
    batch.forEach(updateHandler)
    
    if (pendingUpdates.current.length > 0) {
      if (priority === 'high') {
        requestAnimationFrame(() => processBatch())
      } else if ('requestIdleCallback' in window) {
        idleCallbackId.current = requestIdleCallback(processBatch, { timeout: 100 })
      } else {
        setTimeout(processBatch, 16)
      }
    }
  }, [updateHandler, priority])
  
  React.useEffect(() => {
    pendingUpdates.current = [...updates]
    
    if (updates.length > 0) {
      processBatch()
    }
    
    return () => {
      if (idleCallbackId.current && 'cancelIdleCallback' in window) {
        cancelIdleCallback(idleCallbackId.current)
      }
    }
  }, [updates, processBatch])
}

/**
 * Optimize chart rendering with frame budget
 */
export function useFrameBudget(targetFPS = 30) {
  const frameTime = 1000 / targetFPS
  const lastFrameTime = React.useRef(0)
  const [canRender, setCanRender] = React.useState(true)
  
  const checkFrameBudget = React.useCallback(() => {
    const now = performance.now()
    const elapsed = now - lastFrameTime.current
    
    if (elapsed >= frameTime) {
      lastFrameTime.current = now
      setCanRender(true)
      return true
    }
    
    setCanRender(false)
    return false
  }, [frameTime])
  
  return { canRender, checkFrameBudget }
}

/**
 * Memoize expensive computations with size limit
 */
export function useLimitedMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  maxSize = 100
): T {
  const cache = React.useRef<Map<string, T>>(new Map())
  const key = JSON.stringify(deps)
  
  if (cache.current.has(key)) {
    return cache.current.get(key)!
  }
  
  const value = factory()
  
  // Limit cache size
  if (cache.current.size >= maxSize) {
    const firstKey = cache.current.keys().next().value
    if (firstKey !== undefined) {
      cache.current.delete(firstKey)
    }
  }
  
  cache.current.set(key, value)
  return value
}

/**
 * Lazy load heavy components
 */
export function lazyWithPreload<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  preloadDelay = 1000
) {
  const Component = React.lazy(factory)
  
  // Preload after delay
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      factory()
    }, preloadDelay)
  }
  
  return Component
}

/**
 * Virtualization helper for large lists
 */
export function useVirtualization(
  itemCount: number,
  itemHeight: number,
  containerHeight: number,
  overscan = 2
) {
  const [scrollTop, setScrollTop] = React.useState(0)
  
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )
  
  const visibleItems = endIndex - startIndex + 1
  const totalHeight = itemCount * itemHeight
  const offsetY = startIndex * itemHeight
  
  return {
    startIndex,
    endIndex,
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop
  }
}