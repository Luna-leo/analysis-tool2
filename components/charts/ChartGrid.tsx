"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { FileNode, ChartSizes } from "@/types"
import { ChartCard } from "./ChartCard"
import { VirtualizedChartGrid } from "./VirtualizedChartGrid"
import { ProgressiveChartGrid } from "./ProgressiveChartGrid"
import { CSVImportPage } from "@/components/csv-import"
import { EventMasterPage } from "@/components/event-master"
import { InterlockMasterPageWrapper } from "@/components/interlock-master/InterlockMasterPageWrapper"
import { FormulaMasterPage } from "@/components/formula-master"
import { TriggerConditionMasterPage } from "@/components/trigger-condition-master"
import { UnitConverterFormulaMasterPage } from "@/components/unit-converter-formula"
import { SettingsPage } from "@/components/settings"
import { useFileStore } from "@/stores/useFileStore"
import { useLayoutStore } from "@/stores/useLayoutStore"
import { useUIStore } from "@/stores/useUIStore"
import { SourceSelectionBanner } from "./SourceSelectionBanner"
import { ChartPagination } from "./ChartPagination"
import { getLayoutMargins, getLayoutLabelOffsets, getDefaultChartSettings } from "@/utils/chart/marginCalculator"

interface ChartGridProps {
  file: FileNode
}

export const ChartGrid = React.memo(function ChartGrid({ file }: ChartGridProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [chartSizes, setChartSizes] = useState<ChartSizes>({
    cardMinHeight: 300,
    chartMinHeight: 200,
    isCompactLayout: false,
  })
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [localCharts, setLocalCharts] = useState(file.charts || [])
  const [availableHeight, setAvailableHeight] = useState<number | null>(null)
  // Start with true if no charts - no need to wait for measurements
  const [dimensionsReady, setDimensionsReady] = useState(() => (file.charts || []).length === 0)
  const [hasEverMeasured, setHasEverMeasured] = useState(() => (file.charts || []).length === 0)

  const { activeTab, updateFileCharts, openTabs } = useFileStore()
  const { layoutSettingsMap, chartSettingsMap, updateLayoutSettings, updateChartSettings } = useLayoutStore()
  const { gridSelectionMode, selectAllGridCharts, clearGridSelectedCharts, sourceSelectionMode } = useUIStore()
  
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

  // Initialize settings if they don't exist
  useEffect(() => {
    const layoutStore = useLayoutStore.getState()
    if (!layoutSettingsMap[file.id] && file.id !== 'csv-import') {
      layoutStore.initializeSettings(file.id)
    }
  }, [file.id, layoutSettingsMap])

  // Calculate pagination values
  const itemsPerPage = currentSettings.pagination ? currentSettings.columns * currentSettings.rows : localCharts.length
  const totalPages = Math.ceil(localCharts.length / itemsPerPage)
  const currentPage = Math.min(currentSettings.currentPage || 0, totalPages - 1)
  const startIndex = currentPage * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, localCharts.length)
  const paginatedCharts = currentSettings.pagination ? localCharts.slice(startIndex, endIndex) : localCharts

  // Allow dimension measurement to proceed naturally without forced resets

  useEffect(() => {
    if (contentRef.current && activeTab === file.id && file.id !== 'csv-import') {
      let retryCount = 0
      const maxRetries = 5
      let retryTimeout: NodeJS.Timeout | null = null
      let isMounted = true
      
      const updateChartSizes = () => {
        if (!contentRef.current || !isMounted) return

        // Ensure row count has a valid default
        const rows = currentSettings.rows || 2
        const columns = currentSettings.columns || 2
        
        const isCompactLayout = rows >= 3 || columns >= 3

        let cardMinHeight = isCompactLayout ? 250 : 300
        let chartMinHeight = isCompactLayout ? 150 : 200

        // If pagination is enabled, calculate dynamic heights to fit viewport
        if (currentSettings.pagination && gridRef.current) {
          const containerHeight = contentRef.current.clientHeight
          const containerOffsetHeight = contentRef.current.offsetHeight
          
          // Retry if container height is 0 (DOM not ready)
          if ((containerHeight === 0 || containerOffsetHeight === 0) && retryCount < maxRetries) {
            retryCount++
            // Only set dimensionsReady to false if we've never measured successfully
            if (!hasEverMeasured) {
              setDimensionsReady(false)
            }
            // Exponential backoff: 50ms, 100ms, 200ms, 400ms, 800ms
            const delay = Math.min(50 * Math.pow(2, retryCount - 1), 800)
            console.log(`[ChartGrid] Container not ready, retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`)
            retryTimeout = setTimeout(updateChartSizes, delay)
            return
          }
          
          // If we've exhausted retries, use fallback dimensions
          if (containerHeight === 0 && retryCount >= maxRetries) {
            console.warn('[ChartGrid] Failed to measure container after max retries, using fallback dimensions')
            // Use sensible defaults based on typical viewport
            const fallbackHeight = 600 // Reasonable default height
            const paginationHeight = 49
            const padding = 8
            const gap = isCompactLayout ? 2 : 4
            const totalGaps = (rows - 1) * gap
            
            const availableGridHeight = fallbackHeight - paginationHeight - padding
            const calculatedCardHeight = Math.floor((availableGridHeight - totalGaps) / rows)
            
            cardMinHeight = Math.max(calculatedCardHeight, 150)
            chartMinHeight = Math.max(cardMinHeight - 60, isCompactLayout ? 80 : 100)
            
            setAvailableHeight(availableGridHeight)
            setHasEverMeasured(true)
          } else if (containerHeight > 0) {
            // Normal calculation when container is measured
            const paginationHeight = 49 // Height of pagination controls (h-8 button + py-2 + border-t)
            const padding = 8 // pt-2 from the container
            const gap = isCompactLayout ? 2 : 4
            const totalGaps = (rows - 1) * gap
            
            const availableGridHeight = containerHeight - paginationHeight - padding
            const calculatedCardHeight = Math.floor((availableGridHeight - totalGaps) / rows)
            
            // Use calculated height with minimum to ensure usability
            cardMinHeight = Math.max(calculatedCardHeight, 150) // Minimum 150px for usability
            chartMinHeight = Math.max(cardMinHeight - 60, isCompactLayout ? 80 : 100)
            
            setAvailableHeight(availableGridHeight)
            setHasEverMeasured(true)
          }
        } else if (!currentSettings.pagination) {
          // When pagination is disabled, use the full container height
          const containerHeight = contentRef.current.clientHeight
          const containerOffsetHeight = contentRef.current.offsetHeight
          
          // Retry if container height is 0 (DOM not ready)
          if ((containerHeight === 0 || containerOffsetHeight === 0) && retryCount < maxRetries) {
            retryCount++
            // Only set dimensionsReady to false if we've never measured successfully
            if (!hasEverMeasured) {
              setDimensionsReady(false)
            }
            // Exponential backoff
            const delay = Math.min(50 * Math.pow(2, retryCount - 1), 800)
            console.log(`[ChartGrid] Container not ready (non-paginated), retrying in ${delay}ms (attempt ${retryCount}/${maxRetries})`)
            retryTimeout = setTimeout(updateChartSizes, delay)
            return
          }
          
          // If we've exhausted retries, use fallback dimensions
          if (containerHeight === 0 && retryCount >= maxRetries) {
            console.warn('[ChartGrid] Failed to measure container after max retries, using fallback dimensions')
            // Use viewport-based fallback for better default sizing
            const viewportHeight = window.innerHeight || 800
            const estimatedContainerHeight = viewportHeight - 200 // Account for header, toolbar, etc.
            const padding = 32
            const gap = isCompactLayout ? 2 : 4
            const totalGaps = (rows - 1) * gap
            
            const availableGridHeight = estimatedContainerHeight - padding
            const calculatedCardHeight = Math.floor((availableGridHeight - totalGaps) / rows)
            
            // Ensure reasonable minimum heights
            cardMinHeight = Math.max(calculatedCardHeight, isCompactLayout ? 200 : 250)
            chartMinHeight = Math.max(cardMinHeight - 60, isCompactLayout ? 120 : 150)
            
            setAvailableHeight(availableGridHeight)
            setHasEverMeasured(true)
          } else if (containerHeight > 0) {
            // Calculate based on available space
            const padding = 32 // pt-2 + pb-6 = 8 + 24 = 32px
            const gap = isCompactLayout ? 2 : 4
            const totalGaps = (rows - 1) * gap
            
            const availableGridHeight = containerHeight - padding
            
            // Use the same calculation as pagination mode - always use configured rows
            const calculatedCardHeight = Math.floor((availableGridHeight - totalGaps) / rows)
            
            // Use calculated height with minimum to ensure usability
            cardMinHeight = Math.max(calculatedCardHeight, 150) // Minimum 150px for usability
            chartMinHeight = Math.max(cardMinHeight - 60, isCompactLayout ? 80 : 100)
            
            // Set available height for non-paginated layout to limit display area
            setAvailableHeight(availableGridHeight)
            setHasEverMeasured(true)
          }
        } else {
          setAvailableHeight(null)
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
        
        // Always mark dimensions as ready after processing (even with fallback)
        setDimensionsReady(true)
        
        // Mark that we've successfully measured at least once
        if (contentRef.current && contentRef.current.clientHeight > 0) {
          setHasEverMeasured(true)
          retryCount = 0
        } else if (retryCount >= maxRetries) {
          // Even with fallback, mark as measured to prevent infinite retries
          setHasEverMeasured(true)
        }
      }

      const resizeObserver = new ResizeObserver((entries) => {
        // Only update if we get valid dimensions
        const entry = entries[0]
        if (entry && entry.contentRect.height > 0) {
          setTimeout(updateChartSizes, 50)
        }
      })

      resizeObserver.observe(contentRef.current)
      
      // Also use IntersectionObserver for better visibility detection
      const intersectionObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0]
          if (entry && entry.isIntersecting && entry.intersectionRatio > 0) {
            // Component is visible, try to update sizes
            updateChartSizes()
          }
        },
        { threshold: 0.1 } // Trigger when 10% visible
      )
      
      intersectionObserver.observe(contentRef.current)
      
      // Wait for settings to be loaded before initial calculation
      let settingsRetryCount = 0
      const maxSettingsRetries = 10  // Maximum 10 retries (500ms total)
      
      const checkSettingsAndUpdate = () => {
        const layoutStore = useLayoutStore.getState()
        if (layoutStore.layoutSettingsMap[file.id]) {
          console.log('[ChartGrid] Layout settings ready, updating chart sizes')
          updateChartSizes()
        } else if (settingsRetryCount < maxSettingsRetries) {
          // Retry if settings not ready
          settingsRetryCount++
          console.log(`[ChartGrid] Waiting for layout settings (attempt ${settingsRetryCount}/${maxSettingsRetries})`)
          setTimeout(checkSettingsAndUpdate, 50)
        } else {
          // Proceed anyway after max retries to prevent infinite wait
          console.warn('[ChartGrid] Layout settings not ready after max retries, using defaults')
          updateChartSizes()
        }
      }
      
      checkSettingsAndUpdate()
      
      // Force another update after mount to ensure dimensions are calculated
      const initialTimer = setTimeout(() => {
        if (isMounted) {
          updateChartSizes()
        }
      }, 200)
      
      // Fallback timer to ensure dimensionsReady is eventually set
      const fallbackTimer = setTimeout(() => {
        if (isMounted && !dimensionsReady) {
          console.warn('[ChartGrid] Forcing dimensionsReady after timeout')
          setDimensionsReady(true)
          setHasEverMeasured(true)
        }
      }, 1500)  // 1.5 seconds should be more than enough

      return () => {
        isMounted = false
        clearTimeout(initialTimer)
        clearTimeout(fallbackTimer)
        if (retryTimeout) {
          clearTimeout(retryTimeout)
        }
        resizeObserver.disconnect()
        intersectionObserver.disconnect()
      }
    }
  }, [layoutSettingsMap, chartSettingsMap, activeTab, file.id, currentSettings.rows, currentSettings.columns, currentSettings.pagination, hasEverMeasured])

  // Update local charts when file.charts changes
  useEffect(() => {
    // Use currentFile to ensure we have the latest charts
    const charts = currentFile.charts || []
    setLocalCharts(charts)
    
    // Reset to first page if current page is out of bounds
    if (currentSettings.pagination && charts.length > 0) {
      const newTotalPages = Math.ceil(charts.length / itemsPerPage)
      if (currentPage >= newTotalPages && newTotalPages > 0) {
        updateLayoutSettings(file.id, { currentPage: newTotalPages - 1 })
      }
    }
  }, [currentFile.charts, currentSettings.pagination, currentPage, itemsPerPage, file.id, updateLayoutSettings, currentFile])
  
  // Keyboard shortcuts for selection mode
  useEffect(() => {
    if (!gridSelectionMode) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + A: Select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        const allChartIds = localCharts.map(chart => chart.id)
        selectAllGridCharts(allChartIds)
      }
      // Escape: Clear selection
      else if (e.key === 'Escape') {
        e.preventDefault()
        clearGridSelectedCharts()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gridSelectionMode, localCharts, selectAllGridCharts, clearGridSelectedCharts])

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    updateLayoutSettings(file.id, { currentPage: newPage })
  }, [file.id, updateLayoutSettings])

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
      
      // If pagination is enabled and we're moving between pages, adjust the current page
      if (currentSettings.pagination) {
        const newItemPage = Math.floor(insertIndex / itemsPerPage)
        if (newItemPage !== currentPage) {
          updateLayoutSettings(file.id, { currentPage: newItemPage })
        }
      }
    } catch (error) {
      console.error('Error during drop operation:', error)
    } finally {
      // Always reset drag state
      setDraggedIndex(null)
      setDragOverIndex(null)
    }
  }, [draggedIndex, localCharts, file.id, updateFileCharts, currentSettings.pagination, itemsPerPage, currentPage, updateLayoutSettings])

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [])

  const charts = paginatedCharts // Use paginated charts instead of all charts
  const totalItems = localCharts.length // Keep track of total for virtualization threshold
  
  // Use virtualized grid for large datasets - more aggressive for better performance
  // But disable virtualization when pagination is enabled
  const VIRTUALIZATION_THRESHOLD = 3  // 仮想化をより早く開始
  const PROGRESSIVE_THRESHOLD = 6
  const shouldUseVirtualization = !currentSettings.pagination && totalItems > VIRTUALIZATION_THRESHOLD
  const shouldUseProgressive = !currentSettings.pagination && totalItems > PROGRESSIVE_THRESHOLD && !shouldUseVirtualization
  
  // Check if this is a CSV Import tab
  if (file.id === 'csv-import') {
    return <CSVImportPage fileId={file.id} />
  }

  // Check if this is an Event Master tab
  if (file.id === 'event-master') {
    return <EventMasterPage />
  }

  // Check if this is an Interlock Master tab
  if (file.id === 'interlock-master') {
    return <InterlockMasterPageWrapper fileId={file.id} />
  }

  // Check if this is a Formula Master tab
  if (file.id === 'formula-master') {
    return <FormulaMasterPage />
  }

  // Check if this is a Trigger Condition Master tab
  if (file.id === 'trigger-condition-master') {
    return <TriggerConditionMasterPage />
  }

  // Check if this is a Unit Converter Formula Master tab
  if (file.id === 'unit-converter-formula-master') {
    return <UnitConverterFormulaMasterPage />
  }

  // Check if this is a Settings tab
  if (file.id === 'settings') {
    return <SettingsPage />
  }

  // Remove early return - always render the grid container to allow dimension measurement

  if (shouldUseVirtualization) {
    return <VirtualizedChartGrid file={file} />
  }
  
  if (shouldUseProgressive) {
    return <ProgressiveChartGrid file={file} />
  }

  return (
    <>
      <div className={cn(
        "flex flex-col h-full",
        !currentSettings.pagination && "overflow-auto"
      )} ref={contentRef}>
        <div className={cn(
          "px-6 pt-2",
          currentSettings.pagination ? "flex-1 min-h-0 overflow-hidden" : "pb-6"
        )}>
          {/* Grid */}
          {!dimensionsReady && !hasEverMeasured ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-muted-foreground">Loading chart layout...</div>
            </div>
          ) : (
          <div
            ref={gridRef}
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${currentSettings.columns}, 1fr)`,
              gridTemplateRows: currentSettings.pagination 
                ? `repeat(${currentSettings.rows}, 1fr)`
                : `repeat(${currentSettings.rows}, ${chartSizes.cardMinHeight}px)`,
              gridAutoRows: `${chartSizes.cardMinHeight}px`,
              gap: chartSizes.isCompactLayout ? "2px" : "4px",
              ...(currentSettings.pagination && availableHeight ? { 
                height: `${availableHeight}px`,
                maxHeight: `${availableHeight}px` 
              } : {})
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            onDragEnd={handleDragEnd}
          >
            {charts.length === 0 ? (
              <div className="col-span-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <div className="text-4xl mb-2">📊</div>
                  <p>No charts available for this file</p>
                  <p className="text-sm mt-2">Click the + button in the toolbar to add a chart</p>
                </div>
              </div>
            ) : (
              charts.map((chart, index) => {
                // Calculate actual index for drag operations when paginated
                const actualIndex = currentSettings.pagination ? startIndex + index : index
                return (
                  <ChartCard
                    key={chart.id}
                    chart={chart}
                    index={actualIndex}
                    isCompactLayout={chartSizes.isCompactLayout}
                    cardMinHeight={chartSizes.cardMinHeight}
                    chartMinHeight={chartSizes.chartMinHeight}
                    fileId={file.id}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedIndex === actualIndex}
                    dragOverIndex={dragOverIndex}
                    selectedDataSources={currentFile.selectedDataSources}
                    dataSourceStyles={currentFile.dataSourceStyles}
                    width={currentSettings.width}
                    height={chartSizes.cardMinHeight}
                    chartSettings={currentChartSettings}
                  />
                )
              })
            )}
          </div>
          )}
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