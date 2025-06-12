import { useEffect, useRef, useState } from 'react'

interface UseIntersectionObserverOptions {
  threshold?: number | number[]
  root?: Element | null
  rootMargin?: string
  triggerOnce?: boolean
}

export function useIntersectionObserver<T extends Element>(
  options: UseIntersectionObserverOptions = {}
): [React.RefObject<T>, boolean] {
  const {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    triggerOnce = false
  } = options

  const targetRef = useRef<T>(null)
  const [isIntersecting, setIsIntersecting] = useState(false)
  const hasTriggeredRef = useRef(false)

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    // If already triggered and triggerOnce is true, don't observe
    if (triggerOnce && hasTriggeredRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const intersecting = entry.isIntersecting
        
        if (intersecting && triggerOnce) {
          hasTriggeredRef.current = true
        }
        
        setIsIntersecting(intersecting)
      },
      {
        threshold,
        root,
        rootMargin
      }
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [threshold, root, rootMargin, triggerOnce])

  return [targetRef, isIntersecting]
}