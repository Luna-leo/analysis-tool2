"use client"

import React, { useCallback, useState } from "react"
import { Edit, Copy, Trash2, GripVertical, Save, Layers } from "lucide-react"
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
  height
}: ChartCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false)
  const [showTemplateListDialog, setShowTemplateListDialog] = useState(false)
  const { setEditingChart, setEditingChartWithIndex, setEditModalOpen, editingChart } = useUIStore()
  const { duplicateChart, deleteChart, updateFileCharts, openTabs } = useFileStore()
  const { settings } = useSettingsStore()
  
  const handleMouseEnter = useCallback(() => setIsHovered(true), [])
  const handleMouseLeave = useCallback(() => setIsHovered(false), [])
  
  const handleEdit = useCallback(() => {
    setEditingChartWithIndex(chart, index)
    setEditModalOpen(true)
  }, [setEditingChartWithIndex, setEditModalOpen, chart, index])

  const handleDuplicate = useCallback(() => {
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
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
    if (onDragStart) {
      onDragStart(index)
    }
  }, [index, onDragStart])

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
        )
        updateFileCharts(fileId, updatedCharts)
        toast.success(`Applied template "${template.name}"`)
      }
    } else {
      toast.error("Failed to apply template")
    }
    setShowTemplateListDialog(false)
  }, [chart, fileId, openTabs, updateFileCharts])

  return (
    <>
    <ContextMenu>
      <ContextMenuTrigger asChild>
    <div
      className={cn(
        "bg-card border border-gray-400 rounded-sm flex flex-col relative group h-full transition-all duration-200 cursor-move select-none",
        isDragging && "opacity-50 scale-105",
        isDropTarget && "ring-2 ring-primary ring-offset-2 bg-primary/5",
        isEditing && "ring-2 ring-blue-500 shadow-lg border-blue-500"
      )}
      style={{
        width: width ? `${width}px` : undefined,
        height: height ? `${height}px` : undefined,
        minHeight: height ? undefined : `${cardMinHeight}px`,
        overflow: 'visible'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      draggable={true}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={(e) => {
        e.preventDefault()
        onDragEnd?.()
      }}
    >
      {/* Drag Handle */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
        <GripVertical className="h-5 w-5 text-muted-foreground" strokeWidth={2} />
      </div>

      {/* Edit, Duplicate and Delete Buttons - appear on hover */}
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

      <div
        className="bg-white flex items-center justify-center flex-1 min-h-0 pointer-events-none rounded-sm overflow-hidden"
        draggable={false}
      >
        <ChartPreviewGraph 
          editingChart={chart} 
          selectedDataSourceItems={selectedDataSources} 
          maxDataPoints={
            settings.performanceSettings.dataProcessing.enableSampling 
              ? settings.performanceSettings.dataProcessing.defaultSamplingPoints
              : undefined
          }
          dataSourceStyles={dataSourceStyles}
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
  </>
  )
}

export const ChartCard = React.memo(ChartCardComponent)