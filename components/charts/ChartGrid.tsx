"use client"

import React, { useEffect, useState, useCallback } from "react"
import { cn } from "@/lib/utils"
import { FileNode } from "@/types"
import { ChartCard } from "./ChartCard"
import { VirtualizedChartGrid } from "./VirtualizedChartGrid"
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
import { getDefaultChartSettings } from "@/utils/chart/marginCalculator"

interface ChartGridProps {
  file: FileNode
}

export const ChartGrid = React.memo(function ChartGrid({ file }: ChartGridProps) {
  const [localCharts, setLocalCharts] = useState(file.charts || [])

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

  const charts = paginatedCharts // Use paginated charts instead of all charts
  
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

  // Use virtualized grid for non-paginated mode
  if (!currentSettings.pagination) {
    return <VirtualizedChartGrid file={file} />
  }

  // For pagination mode, calculate simple grid layout
  const isCompactLayout = currentSettings.rows >= 3 || currentSettings.columns >= 3
  const gap = isCompactLayout ? 2 : 4

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="px-6 pt-2 flex-1 min-h-0 overflow-hidden">
          {/* Grid */}
          <div
            className="grid h-full"
            style={{
              gridTemplateColumns: `repeat(${currentSettings.columns}, 1fr)`,
              gridTemplateRows: `repeat(${currentSettings.rows}, 1fr)`,
              gap: `${gap}px`,
            }}
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
                const actualIndex = startIndex + index
                return (
                  <ChartCard
                    key={chart.id}
                    chart={chart}
                    index={actualIndex}
                    isCompactLayout={isCompactLayout}
                    cardMinHeight={300}
                    chartMinHeight={200}
                    fileId={file.id}
                    selectedDataSources={currentFile.selectedDataSources}
                    dataSourceStyles={currentFile.dataSourceStyles}
                    chartSettings={currentChartSettings}
                  />
                )
              })
            )}
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