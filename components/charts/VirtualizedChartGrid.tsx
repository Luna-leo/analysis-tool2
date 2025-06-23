"use client"

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { FileNode, EventInfo } from "@/types"
import { ChartCard } from "./ChartCard"
import { ChartSkeleton } from "./ChartSkeleton"
import { useLayoutStore } from "@/stores/useLayoutStore"
import { useUIStore } from "@/stores/useUIStore"
import { useFileStore } from "@/stores/useFileStore"
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver"
import { SourceSelectionBanner } from "./SourceSelectionBanner"
import { ChartPagination } from "./ChartPagination"
import { getDefaultChartSettings } from "@/utils/chart/marginCalculator"

interface VirtualizedChartGridProps {
  file: FileNode
}

// Local type definition for chart sizes
interface ChartSizes {
  cardMinHeight: number
  chartMinHeight: number
  isCompactLayout: boolean
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
  chartSettings?: any
  layoutSettings?: {
    columns: number
    rows: number
  }
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
  height,
  chartSettings,
  layoutSettings
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
          chartSettings={chartSettings}
          layoutSettings={layoutSettings}
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
  const [dimensionsReady, setDimensionsReady] = useState(() => (file.charts || []).length === 0)
  const [hasEverMeasured, setHasEverMeasured] = useState(() => (file.charts || []).length === 0)
  
  const { layoutSettingsMap, chartSettingsMap, updateLayoutSettings } = useLayoutStore()
  const { updateFileCharts, openTabs } = useFileStore()
  const { gridSelectionMode, sourceSelectionMode, editingChart, editModalOpen } = useUIStore()
  
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
  
  const currentChartSettings = chartSettingsMap[file.id] || 
    getDefaultChartSettings(currentSettings.columns, currentSettings.rows)
  
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
  
  // Create charts array that includes editing state only when modal is open
  const chartsWithEditing = useMemo(() => {
    const baseCharts = currentFile.charts || []
    
    // Only apply editing overlay when modal is actually open
    if (!editModalOpen || !editingChart) {
      return baseCharts
    }
    
    // Check if editing chart belongs to this file
    if (editingChart.fileId && editingChart.fileId !== file.id) {
      return baseCharts
    }
    
    // If editingChart doesn't have fileId, check if it matches current file
    // This handles legacy charts without fileId
    if (!editingChart.fileId) {
      // Only apply if we're on the active file tab
      const activeFileTab = useFileStore.getState().activeTab
      if (activeFileTab !== file.id) {
        return baseCharts
      }
    }
    
    // Replace the editing chart in the array
    return baseCharts.map(chart => 
      chart.id === editingChart.id ? editingChart : chart
    )
  }, [currentFile.charts, editingChart, file.id, editModalOpen])

  // Update local charts when file.charts or editing state changes
  useEffect(() => {
    setLocalCharts(chartsWithEditing)
  }, [chartsWithEditing])

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
    
    let retryCount = 0
    const maxRetries = 5
    let retryTimeout: NodeJS.Timeout | null = null
    
    const updateChartSizes = () => {
      if (!contentRef.current) return
      
      const isCompactLayout = currentSettings.rows >= 3 || currentSettings.columns >= 3
      const containerHeight = contentRef.current.clientHeight
      const containerOffsetHeight = contentRef.current.offsetHeight
      
      // Retry if container height is 0 (DOM not ready)
      if ((containerHeight === 0 || containerOffsetHeight === 0) && retryCount < maxRetries) {
        retryCount++
        // Only set dimensionsReady to false if we've never measured successfully
        if (!hasEverMeasured) {
          setDimensionsReady(false)
        }
        const delay = Math.min(50 * Math.pow(2, retryCount - 1), 800)
        console.log(`[VirtualizedChartGrid] Container not ready, retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`)
        retryTimeout = setTimeout(updateChartSizes, delay)
        return
      }
      
      let cardMinHeight = isCompactLayout ? 140 : 180
      let chartMinHeight = isCompactLayout ? 60 : 80
      
      // Dynamic height calculation based on container
      if (containerHeight > 0) {
        const padding = currentSettings.pagination ? 8 : 32 // Different padding for pagination mode
        const paginationHeight = currentSettings.pagination ? 49 : 0 // Height of pagination controls
        const gap = isCompactLayout ? 2 : 4
        const totalGaps = (currentSettings.rows - 1) * gap
        
        const availableGridHeight = containerHeight - padding - paginationHeight
        const calculatedCardHeight = Math.floor((availableGridHeight - totalGaps) / currentSettings.rows)
        
        // Use calculated height with minimum to ensure usability
        // Add extra margin to prevent overflow (reduced for ultra-compact layouts)
        const is4x4 = currentSettings.columns === 4 && currentSettings.rows === 4
        const is4Column = currentSettings.columns >= 4
        const overflowSafetyMargin = is4x4 ? 2 : (isCompactLayout ? 5 : 10)
        cardMinHeight = Math.max(calculatedCardHeight - overflowSafetyMargin, is4x4 ? 120 : 150)
        
        // Reduced padding for 4-column layouts to maximize chart area
        let chartPadding = 70 // Default padding
        if (is4Column) {
          if (currentSettings.rows === 1) chartPadding = 30  // 1x4: Minimal padding
          else if (currentSettings.rows === 2) chartPadding = 40  // 2x4: Small padding
          else if (currentSettings.rows === 3) chartPadding = 35  // 3x4: Small padding
          else chartPadding = 15  // 4x4: Ultra-minimal padding (reduced from 30)
        }
        
        chartMinHeight = Math.max(cardMinHeight - chartPadding, is4x4 ? 80 : (isCompactLayout ? 80 : 100)) // Increased 4x4 minimum from 50 to 80
      } else if (retryCount >= maxRetries) {
        // Fallback calculation when container measurement fails
        console.warn('[VirtualizedChartGrid] Failed to measure container after max retries, using fallback dimensions')
        const viewportHeight = window.innerHeight || 800
        const estimatedContainerHeight = viewportHeight - 200 // Account for header, toolbar, etc.
        const padding = currentSettings.pagination ? 8 : 32
        const paginationHeight = currentSettings.pagination ? 49 : 0
        const gap = isCompactLayout ? 2 : 4
        const totalGaps = (currentSettings.rows - 1) * gap
        
        const availableGridHeight = estimatedContainerHeight - padding - paginationHeight
        const calculatedCardHeight = Math.floor((availableGridHeight - totalGaps) / currentSettings.rows)
        
        cardMinHeight = Math.max(calculatedCardHeight, 150)
        
        // Use same padding logic for fallback calculation
        const is4Column = currentSettings.columns >= 4
        let chartPadding = 60 // Default fallback padding
        if (is4Column) {
          if (currentSettings.rows === 1) chartPadding = 30
          else if (currentSettings.rows === 2) chartPadding = 40
          else if (currentSettings.rows === 3) chartPadding = 35
          else chartPadding = 15  // 4x4: Ultra-minimal padding (reduced from 30)
        }
        
        chartMinHeight = Math.max(cardMinHeight - chartPadding, isCompactLayout ? 80 : 100)
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
      
      // Always mark dimensions as ready after processing
      setDimensionsReady(true)
      
      // Reset retry count and mark as measured on successful measurement
      if (containerHeight > 0) {
        retryCount = 0
        setHasEverMeasured(true)
      } else if (retryCount >= maxRetries) {
        // Even with fallback, mark as measured to prevent infinite retries
        setHasEverMeasured(true)
      }
    }
    
    // Wait for settings to be loaded before initial calculation
    let settingsRetryCount = 0
    const maxSettingsRetries = 10
    
    const checkSettingsAndUpdate = () => {
      const layoutStore = useLayoutStore.getState()
      if (layoutStore.layoutSettingsMap[file.id]) {
        console.log('[VirtualizedChartGrid] Layout settings ready, updating chart sizes')
        updateChartSizes()
      } else if (settingsRetryCount < maxSettingsRetries) {
        // Retry if settings not ready
        settingsRetryCount++
        console.log(`[VirtualizedChartGrid] Waiting for layout settings (attempt ${settingsRetryCount}/${maxSettingsRetries})`)
        setTimeout(checkSettingsAndUpdate, 50)
      } else {
        // Proceed anyway after max retries to prevent infinite wait
        console.warn('[VirtualizedChartGrid] Layout settings not ready after max retries, using defaults')
        updateChartSizes()
      }
    }
    
    checkSettingsAndUpdate()
    
    // Observe container size changes
    const resizeObserver = new ResizeObserver(() => {
      updateChartSizes()
    })
    
    resizeObserver.observe(contentRef.current)
    
    // Force another update after mount to ensure dimensions are calculated
    const initialTimer = setTimeout(() => {
      updateChartSizes()
    }, 200)
    
    return () => {
      clearTimeout(initialTimer)
      if (retryTimeout) {
        clearTimeout(retryTimeout)
      }
      resizeObserver.disconnect()
    }
  }, [currentSettings.rows, currentSettings.columns, currentSettings.pagination, hasEverMeasured, file.id])
  
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
                  overflow: "hidden", // Changed from visible to prevent overflow
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => e.preventDefault()}
                onDragEnd={handleDragEnd}
              >
                {charts.length === 0 ? (
                  <div className="col-span-full flex items-center justify-center text-muted-foreground h-full">
                    <div className="text-center">
                      <div className="text-4xl mb-2">📊</div>
                      <p>No charts available for this file</p>
                      <p className="text-sm mt-2">Click the + button in the toolbar to add a chart</p>
                    </div>
                  </div>
                ) : (
                  visibleCharts.map(({ chart, index, isVisible }) => (
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
                      chartSettings={currentChartSettings}
                      layoutSettings={{
                        columns: currentSettings.columns,
                        rows: currentSettings.rows
                      }}
                    />
                  ))
                )}
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