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

interface ChartGridProps {
  file: FileNode
}

export const ChartGrid = React.memo(function ChartGrid({ file }: ChartGridProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [chartSizes, setChartSizes] = useState<ChartSizes>({
    cardMinHeight: 180,
    chartMinHeight: 80,
    isCompactLayout: false,
  })
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [localCharts, setLocalCharts] = useState(file.charts || [])

  const { activeTab, updateFileCharts } = useFileStore()
  const { layoutSettingsMap } = useLayoutStore()

  const currentSettings = layoutSettingsMap[file.id] || {
    showFileName: true,
    showDataSources: true,
    columns: 2,
    rows: 2,
    pagination: true,
  }

  useEffect(() => {
    if (contentRef.current && activeTab === file.id && file.id !== 'csv-import') {
      const updateChartSizes = () => {
        if (!contentRef.current) return

        const isCompactLayout = currentSettings.rows >= 3 || currentSettings.columns >= 3

        const cardMinHeight = isCompactLayout ? 140 : 180
        const chartMinHeight = isCompactLayout ? 60 : 80

        setChartSizes({
          cardMinHeight,
          chartMinHeight,
          isCompactLayout,
        })
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
  }, [layoutSettingsMap, activeTab, file.id, currentSettings])

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

  const charts = localCharts
  const totalItems = charts.length

  // Use virtualized grid for large datasets - more aggressive for better performance
  const VIRTUALIZATION_THRESHOLD = 3  // 仮想化をより早く開始
  const PROGRESSIVE_THRESHOLD = 6
  const shouldUseVirtualization = totalItems > VIRTUALIZATION_THRESHOLD
  const shouldUseProgressive = totalItems > PROGRESSIVE_THRESHOLD && !shouldUseVirtualization
  

  if (shouldUseVirtualization) {
    return <VirtualizedChartGrid file={file} />
  }
  
  if (shouldUseProgressive) {
    return <ProgressiveChartGrid file={file} />
  }

  return (
    <div className="absolute inset-0 overflow-auto" ref={contentRef}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {currentSettings.showFileName && <h2 className="text-2xl font-bold mb-2">{file.name}</h2>}

              {currentSettings.showDataSources && file.selectedDataSources && file.selectedDataSources.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {file.selectedDataSources.map((source) => (
                    <Badge key={source.id} variant="secondary" className="text-xs">
                      {source.label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grid */}
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
          {charts.map((chart, index) => (
              <ChartCard
                key={chart.id}
                chart={chart}
                index={index}
                isCompactLayout={chartSizes.isCompactLayout}
                cardMinHeight={chartSizes.cardMinHeight}
                chartMinHeight={chartSizes.chartMinHeight}
                fileId={file.id}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                isDragging={draggedIndex === index}
                dragOverIndex={dragOverIndex}
                selectedDataSources={file.selectedDataSources}
                dataSourceStyles={file.dataSourceStyles}
              />
          ))}
        </div>
      </div>
    </div>
  )
})