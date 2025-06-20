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
import { SourceSelectionBanner } from "./SourceSelectionBanner"
import { ChartPagination } from "./ChartPagination"

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
  
  const { layoutSettingsMap, updateLayoutSettings } = useLayoutStore()
  const { updateFileCharts, openTabs } = useFileStore()
  const { gridSelectionMode, sourceSelectionMode } = useUIStore()
  
  // Get the current file from openTabs to ensure we have the latest version
  const currentFile = openTabs.find(tab => tab.id === file.id) || file
  const currentSettings = layoutSettingsMap[file.id] || {
    showFileName: true,
    showDataSources: true,
    columns: 2,
    rows: 2,
    pagination: true,
    currentPage: 0,
  }
  
  // Calculate pagination values
  const itemsPerPage = currentSettings.pagination ? currentSettings.columns * currentSettings.rows : localCharts.length
  const totalPages = Math.ceil(localCharts.length / itemsPerPage)
  const currentPage = Math.min(currentSettings.currentPage || 0, totalPages - 1)
  const startIndex = currentPage * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, localCharts.length)
  const paginatedCharts = currentSettings.pagination ? localCharts.slice(startIndex, endIndex) : localCharts
  
  // Track visible charts - calculate initial range based on viewport
  const [visibleRange, setVisibleRange] = useState(() => {
    const itemsPerRow = currentSettings.columns
    const rowsInViewport = Math.ceil(600 / (currentSettings.rows >= 3 ? 140 : 180)) // Estimate based on typical viewport
    return { start: 0, end: Math.min(itemsPerRow * rowsInViewport, 12) } // Cap at 12 items initially
  })
  
  // Update local charts when file.charts changes
  useEffect(() => {
    // Use currentFile to ensure we have the latest charts
    setLocalCharts(currentFile.charts || [])
  }, [currentFile.charts])

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

  const handlePageChange = useCallback((newPage: number) => {
    updateLayoutSettings(file.id, { currentPage: newPage })
  }, [file.id, updateLayoutSettings])

  const updateVisibleRange = useCallback(() => {
    if (!gridRef.current || !contentRef.current) return
    
    const container = contentRef.current
    const scrollTop = container.scrollTop
    const containerHeight = container.clientHeight
    
    // Calculate rough item height based on layout settings
    const isCompactLayout = currentSettings.rows >= 3 || currentSettings.columns >= 3
    const cardMinHeight = isCompactLayout ? 140 : 180
    const gap = isCompactLayout ? 2 : 4
    const itemHeight = cardMinHeight + gap
    
    // Calculate visible range with smaller buffer for better performance
    const visibleStart = Math.floor(scrollTop / itemHeight) * currentSettings.columns
    const visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight) * currentSettings.columns
    
    // Increase buffer size for smoother scrolling
    const bufferSize = currentSettings.columns * 2
    const start = Math.max(0, visibleStart - bufferSize)
    const end = Math.min(localCharts.length || 0, visibleEnd + bufferSize)
    
    setVisibleRange({ start, end })
  }, [localCharts.length, currentSettings.columns, currentSettings.rows])
  
  // Update chart sizes with dynamic calculation similar to ChartGrid
  useEffect(() => {
    if (!contentRef.current) return
    
    const updateChartSizes = () => {
      if (!contentRef.current) return
      
      const isCompactLayout = currentSettings.rows >= 3 || currentSettings.columns >= 3
      const containerHeight = contentRef.current.clientHeight
      
      let cardMinHeight = isCompactLayout ? 140 : 180
      let chartMinHeight = isCompactLayout ? 60 : 80
      
      // Dynamic height calculation based on container
      if (containerHeight > 0) {
        const padding = 32 // pt-2 + pb-6
        const gap = isCompactLayout ? 2 : 4
        const totalGaps = (currentSettings.rows - 1) * gap
        
        const availableGridHeight = containerHeight - padding
        const calculatedCardHeight = Math.floor((availableGridHeight - totalGaps) / currentSettings.rows)
        
        // Use calculated height with minimum to ensure usability
        cardMinHeight = Math.max(calculatedCardHeight, 150)
        chartMinHeight = Math.max(cardMinHeight - 60, isCompactLayout ? 80 : 100)
      }
      
      setChartSizes(prev => {
        // Only update if values actually changed
        if (prev.cardMinHeight === cardMinHeight && 
            prev.chartMinHeight === chartMinHeight && 
            prev.isCompactLayout === isCompactLayout) {
          return prev
        }
        return {
          cardMinHeight,
          chartMinHeight,
          isCompactLayout,
        }
      })
    }
    
    // Initial calculation
    updateChartSizes()
    
    // Observe container size changes
    const resizeObserver = new ResizeObserver(() => {
      updateChartSizes()
    })
    
    resizeObserver.observe(contentRef.current)
    
    return () => {
      resizeObserver.disconnect()
    }
  }, [currentSettings.rows, currentSettings.columns])
  
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
    
    // Initial range calculation
    updateVisibleRange()
    
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      container.removeEventListener('scroll', handleScroll)
    }
  }, [updateVisibleRange])
  
  if (!currentFile.charts || currentFile.charts.length === 0) {
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
  
  const charts = paginatedCharts
  const totalRows = currentSettings.pagination 
    ? currentSettings.rows 
    : Math.ceil(localCharts.length / currentSettings.columns)
  const estimatedTotalHeight = currentSettings.pagination
    ? chartSizes.cardMinHeight * currentSettings.rows + (currentSettings.rows - 1) * (chartSizes.isCompactLayout ? 2 : 4)
    : totalRows * (chartSizes.cardMinHeight + (chartSizes.isCompactLayout ? 2 : 4))
  
  // Create placeholder array for virtualization
  const visibleCharts = useMemo(() => {
    const result = []
    for (let i = 0; i < charts.length; i++) {
      // For pagination mode, all charts are visible (no virtualization needed)
      const isInRange = currentSettings.pagination 
        ? true 
        : i >= visibleRange.start && i < visibleRange.end
      result.push({
        chart: charts[i],
        index: i,
        isVisible: isInRange
      })
    }
    return result
  }, [charts, visibleRange, currentSettings.pagination])
  
  // Memoize dataSourceStyles to prevent unnecessary re-renders
  const memoizedDataSourceStyles = useMemo(() => {
    return currentFile.dataSourceStyles || {}
  }, [JSON.stringify(currentFile.dataSourceStyles)])
  
  // Memoize selectedDataSources to prevent unnecessary re-renders
  const memoizedSelectedDataSources = useMemo(() => {
    return currentFile.selectedDataSources || []
  }, [JSON.stringify(currentFile.selectedDataSources)])
  
  return (
    <>
      <div className="h-full flex flex-col" ref={contentRef}>
        <div className={cn(
          currentSettings.pagination ? "flex-1 overflow-hidden" : "flex-1 overflow-auto"
        )}>
          <div className={cn(
            "px-6 relative",
            currentSettings.pagination ? "pt-2 h-full" : "pt-2 pb-6"
          )}>
            
            {/* Virtualized Grid */}
            <div 
              ref={gridRef}
              className={cn(
                "relative",
                currentSettings.pagination && "h-full"
              )}
              style={currentSettings.pagination ? {} : { minHeight: `${estimatedTotalHeight}px` }}
            >
              <div
                className={cn(
                  "grid",
                  currentSettings.pagination && "h-full"
                )}
                style={{
                  gridTemplateColumns: `repeat(${currentSettings.columns}, 1fr)`,
                  gridTemplateRows: currentSettings.pagination
                    ? `repeat(${currentSettings.rows}, 1fr)`
                    : `repeat(${currentSettings.rows}, ${chartSizes.cardMinHeight}px)`,
                  gridAutoRows: currentSettings.pagination ? undefined : `${chartSizes.cardMinHeight}px`,
                  gap: chartSizes.isCompactLayout ? "2px" : "4px",
                  ...(currentSettings.pagination ? {} : {
                    maxHeight: `${chartSizes.cardMinHeight * currentSettings.rows + (currentSettings.rows - 1) * (chartSizes.isCompactLayout ? 2 : 4)}px`
                  }),
                  overflow: "visible",
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
                      selectedDataSources={memoizedSelectedDataSources}
                      dataSourceStyles={memoizedDataSourceStyles}
                      width={currentSettings.width}
                      height={chartSizes.cardMinHeight}
                    />
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Pagination controls */}
        {currentSettings.pagination && totalPages > 1 && (
          <ChartPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            className="border-t bg-background"
          />
        )}
      </div>
      
      {sourceSelectionMode && (
        <SourceSelectionBanner />
      )}
    </>
  )
})