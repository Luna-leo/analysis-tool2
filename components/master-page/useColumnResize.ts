import { useState, useCallback, useEffect } from 'react'

interface UseColumnResizeOptions {
  defaultWidths: Record<string, number>
  minWidth?: number
  onWidthChange?: (columnWidths: Record<string, number>) => void
}

export function useColumnResize({
  defaultWidths,
  minWidth = 50,
  onWidthChange
}: UseColumnResizeOptions) {
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(defaultWidths)
  const [resizing, setResizing] = useState<string | null>(null)
  const [startX, setStartX] = useState(0)
  const [startWidth, setStartWidth] = useState(0)

  const handleMouseDown = useCallback((column: string, e: React.MouseEvent) => {
    e.preventDefault()
    setResizing(column)
    setStartX(e.clientX)
    setStartWidth(columnWidths[column] || defaultWidths[column] || 100)
  }, [columnWidths, defaultWidths])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizing) return
    
    const diff = e.clientX - startX
    const newWidth = Math.max(minWidth, startWidth + diff)
    
    setColumnWidths(prev => {
      const updated = {
        ...prev,
        [resizing]: newWidth
      }
      onWidthChange?.(updated)
      return updated
    })
  }, [resizing, startX, startWidth, minWidth, onWidthChange])

  const handleMouseUp = useCallback(() => {
    setResizing(null)
  }, [])

  // Add global mouse event listeners
  useEffect(() => {
    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
      }
    }
  }, [resizing, handleMouseMove, handleMouseUp])

  const getColumnWidth = useCallback((column: string) => {
    return columnWidths[column] || defaultWidths[column] || 100
  }, [columnWidths, defaultWidths])

  const resetWidths = useCallback(() => {
    setColumnWidths(defaultWidths)
    onWidthChange?.(defaultWidths)
  }, [defaultWidths, onWidthChange])

  return {
    columnWidths,
    resizing,
    handleMouseDown,
    getColumnWidth,
    resetWidths
  }
}