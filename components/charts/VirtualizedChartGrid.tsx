"use client"

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { FileNode, ChartSizes, EventInfo } from "@/types"
import { ChartCard } from "./ChartCard"
import { ChartSkeleton } from "./ChartSkeleton"
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
  selectedDataSources?: EventInfo[]
  dataSourceStyles?: { [dataSourceId: string]: any }
  width?: number
  height?: number
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
  dragOverIndex,
  selectedDataSources,
  dataSourceStyles,
  width,
  height
}: VirtualizedChartCardProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const [shouldRender, setShouldRender] = useState(isVisible)
  const hasRenderedRef = useRef(false)
  
  useEffect(() => {
    if (isVisible && !hasRenderedRef.current) {
      hasRenderedRef.current = true
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setShouldRender(true)
      }, 10)
      return () => clearTimeout(timer)
    }
  }, [isVisible])
  
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
          selectedDataSources={selectedDataSources}
          dataSourceStyles={dataSourceStyles}
          width={width}
          height={height}
        />
      ) : (
        <ChartSkeleton
          isCompactLayout={isCompactLayout}
          cardMinHeight={cardMinHeight}
          chartMinHeight={chartMinHeight}
        />
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
  
  // Track visible charts - calculate initial range based on viewport
  const [visibleRange, setVisibleRange] = useState(() => {
    const itemsPerRow = currentSettings.columns
    const rowsInViewport = Math.ceil(600 / (currentSettings.rows >= 3 ? 140 : 180)) // Estimate based on typical viewport
    return { start: 0, end: Math.min(itemsPerRow * rowsInViewport, 12) } // Cap at 12 items initially
  })
  
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
    const itemHeight = chartSizes.cardMinHeight + (chartSizes.isCompactLayout ? 2 : 4)
    const totalRows = Math.ceil((localCharts.length || 0) / currentSettings.columns)
    
    // Calculate visible range with smaller buffer for better performance
    const visibleStart = Math.floor(scrollTop / itemHeight) * currentSettings.columns
    const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight) * currentSettings.columns
    
    // Increase buffer size for smoother scrolling
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
  
  // Handle scroll with throttle for better performance
  useEffect(() => {
    if (!contentRef.current) return
    
    let lastScrollTime = 0
    let rafId: number | null = null
    
    const handleScroll = () => {
      const now = Date.now()
      const timeSinceLastScroll = now - lastScrollTime
      
      // Throttle to 60fps (16ms) for smoother scrolling
      if (timeSinceLastScroll < 16) {
        if (rafId) cancelAnimationFrame(rafId)
        rafId = requestAnimationFrame(() => {
          updateVisibleRange()
          lastScrollTime = Date.now()
        })
      } else {
        updateVisibleRange()
        lastScrollTime = now
      }
    }
    
    const container = contentRef.current
    container.addEventListener('scroll', handleScroll, { passive: true })
    
    // Initial range calculation with small delay to ensure DOM is ready
    requestAnimationFrame(() => {
      updateVisibleRange()
    })
    
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
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
  const estimatedTotalHeight = totalRows * (chartSizes.cardMinHeight + (chartSizes.isCompactLayout ? 2 : 4))
  
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
        <div className="px-6 pt-1 pb-6">
          
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
                gap: chartSizes.isCompactLayout ? "2px" : "4px",
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
                    selectedDataSources={file.selectedDataSources}
                    dataSourceStyles={file.dataSourceStyles}
                    width={currentSettings.width}
                    height={currentSettings.height}
                  />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})