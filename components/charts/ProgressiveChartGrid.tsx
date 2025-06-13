"use client"

import React, { useEffect, useState, useCallback, useMemo } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { FileNode, ChartSizes } from "@/types"
import { ChartCard } from "./ChartCard"
import { DataSourceModal } from "./DataSourceModal"
import { ChartSkeleton } from "./ChartSkeleton"
import { useLayoutStore } from "@/stores/useLayoutStore"
import { useFileStore } from "@/stores/useFileStore"

interface ProgressiveChartGridProps {
  file: FileNode
}

const BATCH_SIZE = 2 // Number of charts to render at a time
const BATCH_DELAY = 100 // Delay between batches in ms

export const ProgressiveChartGrid = React.memo(function ProgressiveChartGrid({ 
  file 
}: ProgressiveChartGridProps) {
  const [chartSizes, setChartSizes] = useState<ChartSizes>({
    cardMinHeight: 180,
    chartMinHeight: 80,
    isCompactLayout: false,
  })
  const [renderedCount, setRenderedCount] = useState(0)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [localCharts, setLocalCharts] = useState(file.charts || [])
  const [dataSourceModalOpen, setDataSourceModalOpen] = useState(false)
  
  const { layoutSettingsMap } = useLayoutStore()
  const { updateFileCharts } = useFileStore()
  
  const currentSettings = layoutSettingsMap[file.id] || {
    showFileName: true,
    showDataSources: true,
    columns: 2,
    rows: 2,
    pagination: false,
  }
  
  // Update local charts when file.charts changes
  useEffect(() => {
    setLocalCharts(file.charts || [])
    setRenderedCount(0) // Reset rendered count
  }, [file.charts])
  
  // Progressive rendering effect
  useEffect(() => {
    if (renderedCount >= localCharts.length) return
    
    const timer = setTimeout(() => {
      setRenderedCount(prev => Math.min(prev + BATCH_SIZE, localCharts.length))
    }, BATCH_DELAY)
    
    return () => clearTimeout(timer)
  }, [renderedCount, localCharts.length])
  
  // Update chart sizes based on layout settings
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
  
  // Calculate grid items with progressive rendering
  const gridItems = useMemo(() => {
    return charts.map((chart, index) => {
      const isRendered = index < renderedCount
      
      return {
        chart,
        index,
        isRendered
      }
    })
  }, [charts, renderedCount])
  
  return (
    <div className="absolute inset-0 overflow-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {currentSettings.showFileName && (
                <h2 className="text-2xl font-bold mb-2">{file.name}</h2>
              )}
              
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
            <div className="flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDataSourceModalOpen(true)}
              >
                <Settings className="h-4 w-4 mr-2" />
                Data Sources
              </Button>
            </div>
          </div>
        </div>
        
        {/* Grid with progressive rendering */}
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
          {gridItems.map(({ chart, index, isRendered }) => (
            <div key={chart.id}>
              {isRendered ? (
                <ChartCard
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
                />
              ) : (
                <ChartSkeleton
                  isCompactLayout={chartSizes.isCompactLayout}
                  cardMinHeight={chartSizes.cardMinHeight}
                  chartMinHeight={chartSizes.chartMinHeight}
                />
              )}
            </div>
          ))}
        </div>
        
        {/* Loading indicator */}
        {renderedCount < charts.length && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Loading charts... ({renderedCount}/{charts.length})
          </div>
        )}
      </div>
      
      <DataSourceModal
        open={dataSourceModalOpen}
        onOpenChange={setDataSourceModalOpen}
        file={file}
      />
    </div>
  )
})