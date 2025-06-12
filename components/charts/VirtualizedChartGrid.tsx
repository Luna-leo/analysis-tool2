"use client"

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { FileNode, ChartSizes } from "@/types"
import { ChartCard } from "./ChartCard"
import { useLayoutStore } from "@/stores/useLayoutStore"
import { useUIStore } from "@/stores/useUIStore"
import { useFileStore } from "@/stores/useFileStore"
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver"

interface VirtualizedChartGridProps {
  file: FileNode
}

interface VirtualizedChartCardProps {
  chart: any
  isCompactLayout: boolean
  cardMinHeight: number
  chartMinHeight: number
  fileId: string
  index: number
  isVisible: boolean
  onDragStart?: (index: number) => void
  onDragOver?: (e: React.DragEvent, index: number) => void
  onDrop?: (e: React.DragEvent, index: number) => void
  onDragEnd?: () => void
  isDragging?: boolean
  dragOverIndex?: number | null
}

const VirtualizedChartCard = React.memo(({ 
  chart, 
  isCompactLayout, 
  cardMinHeight, 
  chartMinHeight, 
  fileId,
  index,
  isVisible,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  dragOverIndex
}: VirtualizedChartCardProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const [shouldRender, setShouldRender] = useState(false)
  
  useEffect(() => {
    if (isVisible && !shouldRender) {
      setShouldRender(true)
    }
  }, [isVisible, shouldRender])
  
  return (
    <div 
      ref={ref}
      style={{
        minHeight: `${cardMinHeight}px`,
      }}
    >
      {shouldRender ? (
        <ChartCard
          chart={chart}
          isCompactLayout={isCompactLayout}
          cardMinHeight={cardMinHeight}
          chartMinHeight={chartMinHeight}
          fileId={fileId}
          index={index}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onDragEnd={onDragEnd}
          isDragging={isDragging}
          dragOverIndex={dragOverIndex}
        />
      ) : (
        <div 
          className={cn(
            "bg-card border rounded-lg flex flex-col relative",
            isCompactLayout ? "p-3" : "p-4"
          )}
          style={{
            minHeight: `${cardMinHeight}px`,
          }}
        >
          <div>
            <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
            <div 
              className="bg-muted rounded"
              style={{
                minHeight: `${chartMinHeight}px`,
              }}
            ></div>
          </div>
        </div>
      )}
    </div>
  )
})

VirtualizedChartCard.displayName = "VirtualizedChartCard"

export const VirtualizedChartGrid = React.memo(function VirtualizedChartGrid({ file }: VirtualizedChartGridProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [chartSizes, setChartSizes] = useState<ChartSizes>({
    cardMinHeight: 180,
    chartMinHeight: 80,
    isCompactLayout: false,
  })
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [localCharts, setLocalCharts] = useState(file.charts || [])
  
  const { layoutSettingsMap } = useLayoutStore()
  const { updateFileCharts } = useFileStore()
  const currentSettings = layoutSettingsMap[file.id] || {
    showFileName: true,
    showDataSources: true,
    columns: 2,
    rows: 2,
    pagination: false, // Disable pagination for virtualized grid
  }
  
  // Track visible charts
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 })
  
  // Update local charts when file.charts changes
  useEffect(() => {
    setLocalCharts(file.charts || [])
  }, [file.charts])

  // Drag and drop handlers
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(prevIndex => {
      if (draggedIndex !== null && draggedIndex !== index) {
        return index
      }
      return prevIndex
    })
  }, [draggedIndex])

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    try {
      if (draggedIndex === null || draggedIndex === dropIndex) {
        return
      }

      const newCharts = [...localCharts]
      const draggedChart = newCharts[draggedIndex]
      
      // Remove dragged item
      newCharts.splice(draggedIndex, 1)
      
      // Insert at new position
      const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex
      newCharts.splice(insertIndex, 0, draggedChart)
      
      // Update both local state and store
      setLocalCharts(newCharts)
      updateFileCharts(file.id, newCharts)
    } catch (error) {
      console.error('Error during drop operation:', error)
    } finally {
      // Always reset drag state
      setDraggedIndex(null)
      setDragOverIndex(null)
    }
  }, [draggedIndex, localCharts, file.id, updateFileCharts])

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [])

  const updateVisibleRange = useCallback(() => {
    if (!gridRef.current || !contentRef.current) return
    
    const container = contentRef.current
    const scrollTop = container.scrollTop
    const containerHeight = container.clientHeight
    
    // Calculate rough item height based on chart sizes
    const itemHeight = chartSizes.cardMinHeight + (chartSizes.isCompactLayout ? 12 : 24)
    const totalRows = Math.ceil((localCharts.length || 0) / currentSettings.columns)
    
    // Calculate visible range with buffer
    const visibleStart = Math.floor(scrollTop / itemHeight) * currentSettings.columns
    const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight) * currentSettings.columns
    
    // Add buffer for smoother scrolling
    const bufferSize = currentSettings.columns * 2
    const start = Math.max(0, visibleStart - bufferSize)
    const end = Math.min(localCharts.length || 0, visibleEnd + bufferSize)
    
    setVisibleRange({ start, end })
  }, [localCharts.length, currentSettings.columns, chartSizes])
  
  // Update chart sizes
  useEffect(() => {
    const isCompactLayout = currentSettings.rows >= 3 || currentSettings.columns >= 3
    const cardMinHeight = isCompactLayout ? 140 : 180
    const chartMinHeight = isCompactLayout ? 60 : 80
    
    setChartSizes({
      cardMinHeight,
      chartMinHeight,
      isCompactLayout,
    })
  }, [currentSettings])
  
  // Handle scroll with debounce
  useEffect(() => {
    if (!contentRef.current) return
    
    let timeoutId: NodeJS.Timeout
    const handleScroll = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(updateVisibleRange, 100)
    }
    
    const container = contentRef.current
    container.addEventListener('scroll', handleScroll, { passive: true })
    
    // Initial range calculation
    updateVisibleRange()
    
    return () => {
      clearTimeout(timeoutId)
      container.removeEventListener('scroll', handleScroll)
    }
  }, [updateVisibleRange])
  
  if (!file.charts || file.charts.length === 0) {
    return (
      <div className="p-6">
        <div className="h-full flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>No charts available for this file</p>
          </div>
        </div>
      </div>
    )
  }
  
  const charts = localCharts
  const totalRows = Math.ceil(charts.length / currentSettings.columns)
  const estimatedTotalHeight = totalRows * (chartSizes.cardMinHeight + (chartSizes.isCompactLayout ? 12 : 24))
  
  // Create placeholder array for virtualization
  const visibleCharts = useMemo(() => {
    const result = []
    for (let i = 0; i < charts.length; i++) {
      const isInRange = i >= visibleRange.start && i < visibleRange.end
      result.push({
        chart: charts[i],
        index: i,
        isVisible: isInRange
      })
    }
    return result
  }, [charts, visibleRange])
  
  return (
    <div className="h-full flex flex-col" ref={contentRef}>
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {currentSettings.showFileName && <h2 className="text-2xl font-bold mb-2">{file.name}</h2>}
                
                {currentSettings.showDataSources && file.dataSources && file.dataSources.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {file.dataSources.map((source, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {source}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Virtualized Grid */}
          <div 
            ref={gridRef}
            className="relative"
            style={{ minHeight: `${estimatedTotalHeight}px` }}
          >
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(${currentSettings.columns}, 1fr)`,
                gap: chartSizes.isCompactLayout ? "12px" : "24px",
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => e.preventDefault()}
              onDragEnd={handleDragEnd}
            >
              {visibleCharts.map(({ chart, index, isVisible }) => (
                  <VirtualizedChartCard
                    key={chart.id}
                    chart={chart}
                    isCompactLayout={chartSizes.isCompactLayout}
                    cardMinHeight={chartSizes.cardMinHeight}
                    chartMinHeight={chartSizes.chartMinHeight}
                    fileId={file.id}
                    index={index}
                    isVisible={isVisible}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedIndex === index}
                    dragOverIndex={dragOverIndex}
                  />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})