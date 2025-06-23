"use client"

import React, { useCallback, useState } from "react"
import { Edit, Copy, Trash2, GripVertical, Save, Layers, Check, GitMerge, MousePointer } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { ChartComponent, EventInfo, DataSourceStyle } from "@/types"
import { useUIStore } from "@/stores/useUIStore"
import { useFileStore } from "@/stores/useFileStore"
import { ChartPreviewGraph } from "./ChartPreviewGraph"
import { useSettingsStore } from "@/stores/useSettingsStore"
import { SaveTemplateDialog, TemplateListDialog } from "./PlotStyleTemplate"
import { PlotStyleTemplate } from "@/types/plot-style-template"
import { PlotStyleApplicator } from "@/utils/plotStyleApplicator"
import { toast } from "sonner"
import { BulkApplyDialog, BulkApplySettings } from "./EditModal/BulkApplyDialog"

interface ChartCardProps {
  chart: ChartComponent
  isCompactLayout: boolean
  cardMinHeight: number
  chartMinHeight: number
  fileId: string
  index: number
  onDragStart?: (index: number) => void
  onDragOver?: (e: React.DragEvent, index: number) => void
  onDrop?: (e: React.DragEvent, index: number) => void
  onDragEnd?: () => void
  isDragging?: boolean
  dragOverIndex?: number | null
  selectedDataSources?: EventInfo[] // Grid-level data sources
  dataSourceStyles?: { [dataSourceId: string]: DataSourceStyle } // Grid-level styles
  width?: number
  height?: number
  chartSettings?: {
    showXAxis: boolean
    showYAxis: boolean
    showGrid: boolean
    showLegend?: boolean
    showChartTitle?: boolean
    margins?: {
      top: number
      right: number
      bottom: number
      left: number
    }
  }
  layoutSettings?: {
    columns: number
    rows: number
  }
}

const ChartCardComponent = ({ 
  chart, 
  isCompactLayout, 
  cardMinHeight, 
  chartMinHeight, 
  fileId,
  index,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  dragOverIndex,
  selectedDataSources = [],
  dataSourceStyles = {},
  width,
  height,
  chartSettings,
  layoutSettings
}: ChartCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false)
  const [showTemplateListDialog, setShowTemplateListDialog] = useState(false)
  
  const { 
    setEditingChart, 
    setEditingChartWithIndex, 
    setEditModalOpen, 
    editingChart,
    gridSelectionMode,
    gridSelectedChartIds,
    toggleGridChartSelection,
    sourceSelectionMode,
    pendingSourceSelection,
    selectSourceChart
  } = useUIStore()
  const { duplicateChart, deleteChart, updateFileCharts, openTabs } = useFileStore()
  const { settings } = useSettingsStore()
  const [showBulkApplyDialog, setShowBulkApplyDialog] = useState(false)
  
  // Handler for updating chart when legend is dragged
  const handleChartUpdate = useCallback((updatedChart: ChartComponent) => {
    const currentFile = openTabs.find(tab => tab.id === fileId)
    if (currentFile && currentFile.charts) {
      const updatedCharts = currentFile.charts.map(c => 
        c.id === chart.id ? updatedChart : c
      )
      updateFileCharts(fileId, updatedCharts)
    }
  }, [chart.id, fileId, openTabs, updateFileCharts])
  
  const handleMouseEnter = useCallback(() => setIsHovered(true), [])
  const handleMouseLeave = useCallback(() => setIsHovered(false), [])
  
  const isSelected = gridSelectedChartIds.has(chart.id)
  const isSourceCandidate = sourceSelectionMode && pendingSourceSelection && !pendingSourceSelection.targetChartIds.has(chart.id)
  const isDisabledInSourceMode = sourceSelectionMode && pendingSourceSelection && pendingSourceSelection.targetChartIds.has(chart.id)
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (sourceSelectionMode) {
      e.preventDefault()
      e.stopPropagation()
      
      if (isSourceCandidate) {
        selectSourceChart(chart)
      }
      return
    }
    
    if (gridSelectionMode) {
      e.preventDefault()
      e.stopPropagation()
      
      // Get all chart IDs for shift+click range selection
      const currentFile = openTabs.find(tab => tab.id === fileId)
      const allChartIds = currentFile?.charts?.map(c => c.id) || []
      
      toggleGridChartSelection(chart.id, e.shiftKey, allChartIds)
    }
  }, [gridSelectionMode, sourceSelectionMode, chart, isSourceCandidate, toggleGridChartSelection, selectSourceChart, openTabs, fileId])
  
  const handleEdit = useCallback(() => {
    // Ensure chart has fileId before editing
    const chartWithFileId = {
      ...chart,
      fileId: chart.fileId || fileId
    }
    setEditingChartWithIndex(chartWithFileId, index)
    setEditModalOpen(true)
  }, [setEditingChartWithIndex, setEditModalOpen, chart, index, fileId])

  const handleDuplicate = useCallback(() => {
    // Always use props fileId to ensure chart is duplicated in the current page
    duplicateChart(fileId, chart.id)
  }, [duplicateChart, fileId, chart.id])

  const handleDelete = useCallback(() => {
    setShowDeleteDialog(true)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    deleteChart(fileId, chart.id)
    setShowDeleteDialog(false)
  }, [deleteChart, fileId, chart.id])

  const handleDragStart = useCallback((e: React.DragEvent) => {
    if (gridSelectionMode) {
      e.preventDefault()
      return
    }
    
    // Check if drag started on legend
    const target = e.target as HTMLElement
    const legendElement = target.closest('[data-legend="true"]')
    if (legendElement) {
      e.preventDefault()
      return
    }
    
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
    if (onDragStart) {
      onDragStart(index)
    }
  }, [index, onDragStart, gridSelectionMode])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    onDragOver?.(e, index)
  }, [index, onDragOver])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    onDrop?.(e, index)
  }, [index, onDrop])

  const isDropTarget = dragOverIndex === index
  const isEditing = editingChart?.id === chart.id

  const handleTemplateSelect = useCallback((template: PlotStyleTemplate) => {
    const result = PlotStyleApplicator.applyTemplate(chart, template)
    if (result.applied && result.updatedChart) {
      const currentFile = openTabs.find(tab => tab.id === fileId)
      if (currentFile && currentFile.charts) {
        const updatedCharts = currentFile.charts.map(c => 
          c.id === chart.id ? result.updatedChart : c
        ).filter((c): c is ChartComponent => c !== undefined)
        updateFileCharts(fileId, updatedCharts)
        toast.success(`Applied template "${template.name}"`)
      }
    } else {
      toast.error("Failed to apply template")
    }
    setShowTemplateListDialog(false)
  }, [chart, fileId, openTabs, updateFileCharts])
  
  const handleBulkApply = useCallback((settings: BulkApplySettings) => {
    const currentFile = openTabs.find(tab => tab.id === fileId)
    if (!currentFile || !currentFile.charts) return
    
    let appliedCount = 0
    const updatedCharts = currentFile.charts.map(targetChart => {
      if (!gridSelectedChartIds.has(targetChart.id) || targetChart.id === chart.id) {
        return targetChart
      }
      
      appliedCount++
      let updatedChart = { ...targetChart }
      
      if (settings.applyAxisSettings) {
        // Copy Y-axis settings from each parameter
        if (chart.yAxisParams) {
          updatedChart.yAxisParams = targetChart.yAxisParams?.map((param, index) => {
            const sourceParam = chart.yAxisParams?.[index]
            if (sourceParam) {
              return {
                ...param,
                range: sourceParam.range ? { ...sourceParam.range } : param.range
              }
            }
            return param
          }) || []
        }
        
        // Copy grid and axis settings
        updatedChart.showGrid = chart.showGrid
        updatedChart.xAxisTicks = chart.xAxisTicks
        updatedChart.yAxisTicks = chart.yAxisTicks
        updatedChart.xAxisTickPrecision = chart.xAxisTickPrecision
        updatedChart.yAxisTickPrecision = chart.yAxisTickPrecision
        updatedChart.showXLabel = chart.showXLabel
        updatedChart.showYLabel = chart.showYLabel
        updatedChart.xLabelOffset = chart.xLabelOffset
        updatedChart.yLabelOffset = chart.yLabelOffset
      }
      
      if (settings.applyDisplaySettings) {
        // Copy basic display settings
        updatedChart.type = chart.type
        updatedChart.showMarkers = chart.showMarkers
        updatedChart.showLines = chart.showLines
        updatedChart.showTitle = chart.showTitle
        updatedChart.showLegend = chart.showLegend
        updatedChart.legendPosition = chart.legendPosition ? { ...chart.legendPosition } : undefined
        updatedChart.legendMode = chart.legendMode
        updatedChart.dataSourceLegends = chart.dataSourceLegends ? { ...chart.dataSourceLegends } : undefined
        
        // Copy plot styles (very important for appearance)
        if (chart.plotStyles) {
          updatedChart.plotStyles = {
            mode: chart.plotStyles.mode,
            byDataSource: chart.plotStyles.byDataSource ? { ...chart.plotStyles.byDataSource } : undefined,
            byParameter: chart.plotStyles.byParameter ? { ...chart.plotStyles.byParameter } : undefined,
            byBoth: chart.plotStyles.byBoth ? { ...chart.plotStyles.byBoth } : undefined
          }
        }
        
        // Copy margins
        updatedChart.margins = chart.margins ? { ...chart.margins } : undefined
      }
      
      if (settings.applyReferenceLines) {
        updatedChart.referenceLines = chart.referenceLines ? [...chart.referenceLines] : []
      }
      
      if (settings.applyAnnotations) {
        // Note: annotations property doesn't exist in ChartComponent type
        // This might need to be handled differently or removed
      }
      
      if (settings.applyDataSources) {
        updatedChart.yAxisParams = chart.yAxisParams ? 
          chart.yAxisParams.map(param => ({ ...param })) : []
        updatedChart.xParameter = chart.xParameter
        updatedChart.xAxisType = chart.xAxisType
        updatedChart.xAxisRange = chart.xAxisRange ? { ...chart.xAxisRange } : undefined
      }
      
      return updatedChart
    })
    
    updateFileCharts(fileId, updatedCharts)
    toast.success(`Applied settings from "${chart.title}" to ${appliedCount} charts`)
    setShowBulkApplyDialog(false)
  }, [chart, fileId, openTabs, updateFileCharts, gridSelectedChartIds])

  return (
    <>
    <ContextMenu>
      <ContextMenuTrigger asChild>
    <div
      className={cn(
        "bg-card border border-gray-400 rounded-sm flex flex-col relative group h-full transition-all duration-200 select-none",
        !gridSelectionMode && !sourceSelectionMode && "cursor-move",
        gridSelectionMode && "cursor-pointer",
        sourceSelectionMode && isSourceCandidate && "cursor-pointer border-2 border-dashed border-blue-400 hover:border-blue-500 hover:bg-blue-50/50",
        sourceSelectionMode && isDisabledInSourceMode && "opacity-50 cursor-not-allowed",
        isDragging && "opacity-50 scale-105",
        isDropTarget && "ring-2 ring-primary ring-offset-2 bg-primary/5",
        isEditing && "ring-2 ring-blue-500 shadow-lg border-blue-500",
        isSelected && gridSelectionMode && !sourceSelectionMode && "ring-2 ring-blue-500 bg-blue-50 border-blue-500"
      )}
      style={{
        width: width ? `${width}px` : undefined,
        height: height ? `${height}px` : `${cardMinHeight}px`,
        minHeight: `${cardMinHeight}px`,
        overflow: 'hidden', // Changed to prevent chart overflow
        contain: 'layout'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      draggable={!gridSelectionMode}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={(e) => {
        e.preventDefault()
        onDragEnd?.()
      }}
    >
      {/* Selection Indicator or Drag Handle */}
      {sourceSelectionMode ? (
        isSourceCandidate ? (
          <div className="absolute top-2 left-2 animate-pulse">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
              <MousePointer className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
        ) : (
          <div className={cn(
            "absolute top-2 left-2 w-6 h-6 rounded-full border-2 transition-all z-10",
            "bg-gray-300 border-gray-400"
          )}>
            <Check className="h-3.5 w-3.5 text-gray-600 absolute top-0.5 left-0.5" strokeWidth={3} />
          </div>
        )
      ) : gridSelectionMode ? (
        <div className={cn(
          "absolute top-2 left-2 w-6 h-6 rounded-full border-2 transition-all z-10",
          isSelected 
            ? "bg-blue-500 border-blue-500" 
            : "bg-white border-gray-400"
        )}>
          {isSelected && (
            <Check className="h-3.5 w-3.5 text-white absolute top-0.5 left-0.5" strokeWidth={3} />
          )}
        </div>
      ) : (
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
          <GripVertical className="h-5 w-5 text-muted-foreground" strokeWidth={2} />
        </div>
      )}

      {/* Edit, Duplicate and Delete Buttons - appear on hover (not in selection mode) */}
      {!gridSelectionMode && !sourceSelectionMode && (
        <div 
          className={cn(
            "absolute -top-3 right-2 flex gap-1 transition-all duration-200 z-50",
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
          )}
          onMouseDown={(e) => e.stopPropagation()}
        >
        <div className="flex gap-1 bg-background/95 backdrop-blur-sm rounded-full p-1 shadow-lg border border-border">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full hover:bg-secondary"
            onClick={handleEdit}
            title="編集"
            draggable={false}
          >
            <Edit className="h-3.5 w-3.5" strokeWidth={2} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full hover:bg-secondary"
            onClick={handleDuplicate}
            title="複製"
            draggable={false}
          >
            <Copy className="h-3.5 w-3.5" strokeWidth={2} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleDelete}
            title="削除"
            draggable={false}
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
          </Button>
        </div>
      </div>
      )}

      <div
        className="bg-white flex items-center justify-center flex-1 min-h-0 rounded-sm overflow-hidden relative"
        draggable={false}
        style={{ contain: 'layout' }} // Add CSS containment
      >
        <ChartPreviewGraph 
          editingChart={(() => {
            if (process.env.NODE_ENV === 'development' && chart.referenceLines) {
              console.log(`[ChartCard ${chart.id}] Reference Lines:`, chart.referenceLines)
            }
            return chart
          })()} 
          selectedDataSourceItems={selectedDataSources} 
          setEditingChart={handleChartUpdate}
          maxDataPoints={
            settings.performanceSettings.dataProcessing.enableSampling 
              ? settings.performanceSettings.dataProcessing.defaultSamplingPoints
              : undefined
          }
          dataSourceStyles={dataSourceStyles}
          chartSettings={chartSettings}
          gridLayout={layoutSettings}
          enableZoom={true}
          enablePan={true}
          showZoomControls={true}
          isCompactLayout={isCompactLayout}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>チャートを削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{chart.title}」を削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              削除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Chart
        </ContextMenuItem>
        <ContextMenuItem onClick={handleDuplicate}>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => setShowSaveTemplateDialog(true)}>
          <Save className="mr-2 h-4 w-4" />
          Save Style as Template
        </ContextMenuItem>
        <ContextMenuItem onClick={() => setShowTemplateListDialog(true)}>
          <Layers className="mr-2 h-4 w-4" />
          Apply Template
        </ContextMenuItem>
        {gridSelectionMode && gridSelectedChartIds.size > 1 && gridSelectedChartIds.has(chart.id) && (
          <ContextMenuItem onClick={() => setShowBulkApplyDialog(true)}>
            <GitMerge className="mr-2 h-4 w-4" />
            Copy Settings to Selected Charts
          </ContextMenuItem>
        )}
        <ContextMenuSeparator />
        <ContextMenuItem 
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
    
    {/* Template Dialogs */}
    <SaveTemplateDialog
      open={showSaveTemplateDialog}
      onOpenChange={setShowSaveTemplateDialog}
      chart={chart}
    />
    
    <TemplateListDialog
      open={showTemplateListDialog}
      onOpenChange={setShowTemplateListDialog}
      onSelectTemplate={handleTemplateSelect}
      hasMultipleCharts={false}
    />
    
    {gridSelectionMode && gridSelectedChartIds.size > 1 && (
      <BulkApplyDialog
        open={showBulkApplyDialog}
        onOpenChange={setShowBulkApplyDialog}
        selectedChartIds={new Set(Array.from(gridSelectedChartIds).filter(id => id !== chart.id))}
        currentChart={chart}
        allCharts={openTabs.find(tab => tab.id === fileId)?.charts || []}
        onApply={handleBulkApply}
      />
    )}
  </>
  )
}

export const ChartCard = React.memo(ChartCardComponent, (prevProps, nextProps) => {
  
  // Default memo comparison
  return (
    prevProps.chart === nextProps.chart &&
    prevProps.isCompactLayout === nextProps.isCompactLayout &&
    prevProps.cardMinHeight === nextProps.cardMinHeight &&
    prevProps.chartMinHeight === nextProps.chartMinHeight &&
    prevProps.fileId === nextProps.fileId &&
    prevProps.index === nextProps.index &&
    prevProps.isDragging === nextProps.isDragging &&
    prevProps.dragOverIndex === nextProps.dragOverIndex &&
    prevProps.selectedDataSources === nextProps.selectedDataSources &&
    prevProps.dataSourceStyles === nextProps.dataSourceStyles &&
    prevProps.width === nextProps.width &&
    prevProps.height === nextProps.height &&
    prevProps.chartSettings === nextProps.chartSettings
  )
})