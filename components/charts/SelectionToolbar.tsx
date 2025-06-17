"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Layers, Edit, Trash2, Copy, GitMerge } from "lucide-react"
import { useUIStore } from "@/stores/useUIStore"
import { useFileStore } from "@/stores/useFileStore"
import { cn } from "@/lib/utils"
import { TemplateListDialog } from "./PlotStyleTemplate"
import { PlotStyleTemplate } from "@/types/plot-style-template"
import { PlotStyleApplicator } from "@/utils/plotStyleApplicator"
import { toast } from "sonner"
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
import { BulkApplyDialog, BulkApplySettings } from "./EditModal/BulkApplyDialog"
import { ChartComponent } from "@/types"

interface SelectionToolbarProps {
  fileId: string
}

export function SelectionToolbar({ fileId }: SelectionToolbarProps) {
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showBulkApplyDialog, setShowBulkApplyDialog] = useState(false)
  const [sourceChart, setSourceChart] = useState<ChartComponent | null>(null)
  
  const { 
    gridSelectedChartIds, 
    clearGridSelectedCharts, 
    setGridSelectionMode,
    setEditingChart,
    setEditingChartWithIndex,
    setEditModalOpen,
    startSourceSelection
  } = useUIStore()
  
  const { openTabs, updateFileCharts, deleteChart, duplicateChart } = useFileStore()
  
  const currentFile = openTabs.find(tab => tab.id === fileId)
  const selectedCharts = currentFile?.charts?.filter(chart => 
    gridSelectedChartIds.has(chart.id)
  ) || []
  
  if (gridSelectedChartIds.size === 0) return null
  
  const handleTemplateApply = (template: PlotStyleTemplate) => {
    if (!currentFile || !currentFile.charts) return
    
    const updatedCharts = currentFile.charts.map(chart => {
      if (gridSelectedChartIds.has(chart.id)) {
        const result = PlotStyleApplicator.applyTemplate(chart, template)
        return result.updatedChart || chart
      }
      return chart
    })
    
    updateFileCharts(fileId, updatedCharts)
    toast.success(`Applied template "${template.name}" to ${gridSelectedChartIds.size} charts`)
    setShowTemplateDialog(false)
  }
  
  const handleEdit = () => {
    if (selectedCharts.length === 1) {
      // Single chart - open edit modal
      const chart = selectedCharts[0]
      const index = currentFile?.charts?.findIndex(c => c.id === chart.id) || 0
      setEditingChartWithIndex(chart, index)
      setEditModalOpen(true)
      setGridSelectionMode(false)
    } else {
      // Multiple charts - could implement bulk edit modal here
      toast.info("Bulk edit for multiple charts is not yet implemented")
    }
  }
  
  const handleDuplicate = () => {
    selectedCharts.forEach(chart => {
      duplicateChart(fileId, chart.id)
    })
    toast.success(`Duplicated ${selectedCharts.length} chart(s)`)
    clearGridSelectedCharts()
    setGridSelectionMode(false)
  }
  
  const handleDelete = () => {
    setShowDeleteDialog(true)
  }
  
  const handleConfirmDelete = () => {
    selectedCharts.forEach(chart => {
      deleteChart(fileId, chart.id)
    })
    toast.success(`Deleted ${selectedCharts.length} chart(s)`)
    clearGridSelectedCharts()
    setGridSelectionMode(false)
    setShowDeleteDialog(false)
  }
  
  const handleCopySettingsFrom = () => {
    startSourceSelection(gridSelectedChartIds, (chart: ChartComponent) => {
      setSourceChart(chart)
      setShowBulkApplyDialog(true)
    })
  }
  
  const handleBulkApply = (settings: BulkApplySettings) => {
    if (!sourceChart || !currentFile) return
    
    const updatedCharts = currentFile.charts.map(chart => {
      if (!gridSelectedChartIds.has(chart.id)) {
        return chart
      }
      
      let updatedChart = { ...chart }
      
      if (settings.applyAxisSettings) {
        // Copy Y-axis settings from each parameter
        if (sourceChart.yAxisParams) {
          updatedChart.yAxisParams = chart.yAxisParams?.map((param, index) => {
            const sourceParam = sourceChart.yAxisParams?.[index]
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
        updatedChart.showGrid = sourceChart.showGrid
        updatedChart.xAxisTicks = sourceChart.xAxisTicks
        updatedChart.yAxisTicks = sourceChart.yAxisTicks
        updatedChart.xAxisTickPrecision = sourceChart.xAxisTickPrecision
        updatedChart.yAxisTickPrecision = sourceChart.yAxisTickPrecision
        updatedChart.showXLabel = sourceChart.showXLabel
        updatedChart.showYLabel = sourceChart.showYLabel
        updatedChart.xLabelOffset = sourceChart.xLabelOffset
        updatedChart.yLabelOffset = sourceChart.yLabelOffset
      }
      
      if (settings.applyDisplaySettings) {
        // Copy basic display settings
        updatedChart.type = sourceChart.type
        updatedChart.showMarkers = sourceChart.showMarkers
        updatedChart.showLines = sourceChart.showLines
        updatedChart.showTitle = sourceChart.showTitle
        updatedChart.showLegend = sourceChart.showLegend
        updatedChart.legendPosition = sourceChart.legendPosition ? { ...sourceChart.legendPosition } : undefined
        updatedChart.legendMode = sourceChart.legendMode
        updatedChart.dataSourceLegends = sourceChart.dataSourceLegends ? { ...sourceChart.dataSourceLegends } : undefined
        
        // Copy plot styles (very important for appearance)
        if (sourceChart.plotStyles) {
          updatedChart.plotStyles = {
            mode: sourceChart.plotStyles.mode,
            byDataSource: sourceChart.plotStyles.byDataSource ? { ...sourceChart.plotStyles.byDataSource } : undefined,
            byParameter: sourceChart.plotStyles.byParameter ? { ...sourceChart.plotStyles.byParameter } : undefined,
            byBoth: sourceChart.plotStyles.byBoth ? { ...sourceChart.plotStyles.byBoth } : undefined
          }
        }
        
        // Copy margins
        updatedChart.margins = sourceChart.margins ? { ...sourceChart.margins } : undefined
      }
      
      if (settings.applyReferenceLines) {
        updatedChart.referenceLines = sourceChart.referenceLines ? [...sourceChart.referenceLines] : []
      }
      
      if (settings.applyAnnotations) {
        // Note: annotations property doesn't exist in ChartComponent type
        // This might need to be handled differently or removed
      }
      
      if (settings.applyDataSources) {
        updatedChart.yAxisParams = sourceChart.yAxisParams ? 
          sourceChart.yAxisParams.map(param => ({ ...param })) : []
        updatedChart.xParameter = sourceChart.xParameter
        updatedChart.xAxisType = sourceChart.xAxisType
        updatedChart.xAxisRange = sourceChart.xAxisRange ? { ...sourceChart.xAxisRange } : undefined
      }
      
      return updatedChart
    })
    
    updateFileCharts(fileId, updatedCharts)
    toast.success(`Applied settings from "${sourceChart.title}" to ${gridSelectedChartIds.size} charts`)
    setShowBulkApplyDialog(false)
    setSourceChart(null)
  }
  
  return (
    <>
      <div className={cn(
        "fixed top-20 right-6 z-50",
        "bg-blue-50/95 dark:bg-blue-950/20 backdrop-blur-sm rounded-lg shadow-lg border border-blue-200 dark:border-blue-800 p-2",
        "flex items-center gap-2 transition-all duration-200",
        "animate-in slide-in-from-top-4 slide-in-from-right-2 fade-in"
      )}>
        <span className="text-sm font-medium px-2">
          {gridSelectedChartIds.size} chart{gridSelectedChartIds.size > 1 ? 's' : ''} selected
        </span>
        
        <div className="h-6 w-px bg-border" />
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowTemplateDialog(true)}
          className="gap-1.5"
        >
          <Layers className="h-4 w-4" />
          Apply Template
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCopySettingsFrom}
          className="gap-1.5"
        >
          <GitMerge className="h-4 w-4" />
          Copy Settings From
        </Button>
        
        {selectedCharts.length === 1 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={handleEdit}
            className="gap-1.5"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        )}
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDuplicate}
          className="gap-1.5"
        >
          <Copy className="h-4 w-4" />
          Duplicate
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDelete}
          className="gap-1.5 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
        
        <div className="h-6 w-px bg-border" />
        
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            clearGridSelectedCharts()
            setGridSelectionMode(false)
          }}
          className="gap-1.5"
        >
          <X className="h-4 w-4" />
          Cancel
        </Button>
      </div>
      
      <TemplateListDialog
        open={showTemplateDialog}
        onOpenChange={setShowTemplateDialog}
        onSelectTemplate={handleTemplateApply}
        hasMultipleCharts={true}
      />
      
      {sourceChart && currentFile && (
        <BulkApplyDialog
          open={showBulkApplyDialog}
          onOpenChange={(open) => {
            setShowBulkApplyDialog(open)
            if (!open) setSourceChart(null)
          }}
          selectedChartIds={gridSelectedChartIds}
          currentChart={sourceChart}
          allCharts={currentFile.charts || []}
          onApply={handleBulkApply}
        />
      )}
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCharts.length} chart{selectedCharts.length > 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected chart{selectedCharts.length > 1 ? 's' : ''} will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}