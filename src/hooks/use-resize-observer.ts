import { useCallback, useLayoutEffect, useRef, useState } from 'react'

interface ResizeObserverEntry {
  target: Element
  contentRect: {
    width: number
    height: number
  }
}

export function useResizeObserver<T extends HTMLElement>(
  elementRef?: React.RefObject<T>
) {
  const [size, setSize] = useState({ width: 0, height: 0 })
  const observerRef = useRef<ResizeObserver | undefined>(undefined)

  const handleResize = useCallback((entries: ResizeObserverEntry[]) => {
    if (!entries[0]) return

    const { width, height } = entries[0].contentRect
    setSize({ width, height })
  }, [])

  useLayoutEffect(() => {
    const element = elementRef?.current
    if (!element) return

    // Create ResizeObserver if available
    if (typeof ResizeObserver !== 'undefined') {
      observerRef.current = new ResizeObserver(handleResize)
      observerRef.current.observe(element)
    } else {
      // Fallback for browsers without ResizeObserver
      const updateSize = () => {
        const rect = element.getBoundingClientRect()
        setSize({ width: rect.width, height: rect.height })
      }

      updateSize()
      window.addEventListener('resize', updateSize)

      return () => {
        window.removeEventListener('resize', updateSize)
      }
    }

    return () => {
      observerRef.current?.disconnect()
    }
  }, [elementRef, handleResize])

  return size
}