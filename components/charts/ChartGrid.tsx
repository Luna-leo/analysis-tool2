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
import { calculateAutoMargins, calculateAutoLabelOffsets, getLayoutKey } from "@/utils/chart/marginCalculator"

interface ChartGridProps {
  file: FileNode
}

export const ChartGrid = React.memo(function ChartGrid({ file }: ChartGridProps) {
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
  const [availableHeight, setAvailableHeight] = useState<number | null>(null)

  const { activeTab, updateFileCharts } = useFileStore()
  const { layoutSettingsMap, chartSettingsMap, updateLayoutSettings, updateChartSettings } = useLayoutStore()
  const { gridSelectionMode, selectAllGridCharts, clearGridSelectedCharts, sourceSelectionMode } = useUIStore()

  const currentSettings = layoutSettingsMap[file.id] || {
    showFileName: true,
    showDataSources: true,
    columns: 2,
    rows: 2,
    pagination: true,
    currentPage: 0,
  }
  
  const currentChartSettings = chartSettingsMap[file.id] || {
    showXAxis: true,
    showYAxis: true,
    showGrid: true,
    showLegend: true,
    showChartTitle: true,
  }

  // Calculate pagination values
  const itemsPerPage = currentSettings.pagination ? currentSettings.columns * currentSettings.rows : localCharts.length
  const totalPages = Math.ceil(localCharts.length / itemsPerPage)
  const currentPage = Math.min(currentSettings.currentPage || 0, totalPages - 1)
  const startIndex = currentPage * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, localCharts.length)
  const paginatedCharts = currentSettings.pagination ? localCharts.slice(startIndex, endIndex) : localCharts

  useEffect(() => {
    if (contentRef.current && activeTab === file.id && file.id !== 'csv-import') {
      const updateChartSizes = () => {
        if (!contentRef.current) return

        const isCompactLayout = currentSettings.rows >= 3 || currentSettings.columns >= 3

        let cardMinHeight = isCompactLayout ? 140 : 180
        let chartMinHeight = isCompactLayout ? 60 : 80

        // If pagination is enabled, calculate dynamic heights to fit viewport
        if (currentSettings.pagination && gridRef.current) {
          const containerHeight = contentRef.current.clientHeight
          const paginationHeight = 48 // Height of pagination controls (h-8 button + py-2)
          const padding = 8 // Only pt-2 (8px) when pagination is enabled
          const gap = isCompactLayout ? 2 : 4
          const rowGaps = (currentSettings.rows - 1) * gap
          
          const availableGridHeight = containerHeight - paginationHeight - padding - rowGaps
          const calculatedCardHeight = Math.floor(availableGridHeight / currentSettings.rows)
          
          // Ensure minimum heights are respected
          cardMinHeight = Math.max(calculatedCardHeight, isCompactLayout ? 100 : 120)
          chartMinHeight = Math.max(cardMinHeight - 60, isCompactLayout ? 40 : 60)
          
          setAvailableHeight(availableGridHeight)
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
        
        // Auto-calculate margins if in auto mode
        if (currentChartSettings.marginMode === 'auto' && contentRef.current) {
          const containerWidth = contentRef.current.clientWidth
          const containerHeight = contentRef.current.clientHeight
          
          const autoMargins = calculateAutoMargins(
            currentSettings.columns,
            currentSettings.rows,
            containerWidth,
            containerHeight,
            currentChartSettings.autoMarginScale || 1.0,
            {
              top: currentChartSettings.margins?.top,
              right: currentChartSettings.margins?.right
            }
          )
          
          const autoOffsets = calculateAutoLabelOffsets(
            currentSettings.columns,
            currentSettings.rows
          )
          
          // Only update if margins have changed
          const marginsChanged = !currentChartSettings.margins ||
            autoMargins.top !== currentChartSettings.margins.top ||
            autoMargins.right !== currentChartSettings.margins.right ||
            autoMargins.bottom !== currentChartSettings.margins.bottom ||
            autoMargins.left !== currentChartSettings.margins.left
          
          const offsetsChanged = autoOffsets.xLabelOffset !== currentChartSettings.xLabelOffset ||
            autoOffsets.yLabelOffset !== currentChartSettings.yLabelOffset
          
          if (marginsChanged || offsetsChanged) {
            updateChartSettings(file.id, {
              margins: autoMargins,
              ...autoOffsets
            })
          }
        }
      }

      const resizeObserver = new ResizeObserver(() => {
        setTimeout(updateChartSizes, 100)
      })

      resizeObserver.observe(contentRef.current)
      setTimeout(updateChartSizes, 100)

      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [layoutSettingsMap, chartSettingsMap, activeTab, file.id, currentSettings.rows, currentSettings.columns, currentSettings.pagination, currentChartSettings.marginMode, currentChartSettings.autoMarginScale, updateChartSettings])

  // Update local charts when file.charts changes
  useEffect(() => {
    setLocalCharts(file.charts || [])
    
    // Reset to first page if current page is out of bounds
    if (currentSettings.pagination && file.charts) {
      const newTotalPages = Math.ceil(file.charts.length / itemsPerPage)
      if (currentPage >= newTotalPages && newTotalPages > 0) {
        updateLayoutSettings(file.id, { currentPage: newTotalPages - 1 })
      }
    }
  }, [file.charts, currentSettings.pagination, currentPage, itemsPerPage, file.id, updateLayoutSettings])
  
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

  const charts = paginatedCharts // Use paginated charts instead of all charts
  const totalItems = localCharts.length // Keep track of total for virtualization threshold

  // Use virtualized grid for large datasets - more aggressive for better performance
  // But disable virtualization when pagination is enabled
  const VIRTUALIZATION_THRESHOLD = 3  // 仮想化をより早く開始
  const PROGRESSIVE_THRESHOLD = 6
  const shouldUseVirtualization = !currentSettings.pagination && totalItems > VIRTUALIZATION_THRESHOLD
  const shouldUseProgressive = !currentSettings.pagination && totalItems > PROGRESSIVE_THRESHOLD && !shouldUseVirtualization
  

  if (shouldUseVirtualization) {
    return <VirtualizedChartGrid file={file} />
  }
  
  if (shouldUseProgressive) {
    return <ProgressiveChartGrid file={file} />
  }

  return (
    <>
      <div className={cn(
        "absolute inset-0",
        currentSettings.pagination ? "flex flex-col" : "overflow-auto"
      )} ref={contentRef}>
        <div className={cn(
          "px-6 pt-2",
          currentSettings.pagination ? "flex-1 overflow-hidden" : "pb-6"
        )}>
          
          {/* Grid */}
          <div
            ref={gridRef}
            className="grid h-full"
            style={{
              gridTemplateColumns: `repeat(${currentSettings.columns}, 1fr)`,
              gap: chartSizes.isCompactLayout ? "2px" : "4px",
              overflow: currentSettings.pagination ? "hidden" : "visible",
              ...(currentSettings.pagination && availableHeight ? { maxHeight: `${availableHeight}px` } : {})
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => e.preventDefault()}
            onDragEnd={handleDragEnd}
          >
            {charts.map((chart, index) => {
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
                  selectedDataSources={file.selectedDataSources}
                  dataSourceStyles={file.dataSourceStyles}
                  width={currentSettings.width}
                  height={currentSettings.pagination && availableHeight 
                    ? Math.floor(availableHeight / currentSettings.rows) - (chartSizes.isCompactLayout ? 2 : 4)
                    : currentSettings.height}
                  chartSettings={currentChartSettings}
                />
              )
            })}
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