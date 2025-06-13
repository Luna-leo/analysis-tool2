"use client"

import React, { useCallback, useState } from "react"
import { LineChart, Edit, Copy, Trash2, GripVertical } from "lucide-react"
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
import { ChartComponent, EventInfo } from "@/types"
import { useUIStore } from "@/stores/useUIStore"
import { useFileStore } from "@/stores/useFileStore"
import { ChartPreviewGraph } from "./ChartPreviewGraph"

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
  selectedDataSources = []
}: ChartCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const { setEditingChart, setEditModalOpen } = useUIStore()
  const { duplicateChart, deleteChart } = useFileStore()
  
  const handleMouseEnter = useCallback(() => setIsHovered(true), [])
  const handleMouseLeave = useCallback(() => setIsHovered(false), [])
  
  const handleEdit = useCallback(() => {
    setEditingChart(chart)
    setEditModalOpen(true)
  }, [setEditingChart, setEditModalOpen, chart])

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

  return (
    <div
      className={cn(
        "bg-card border rounded-lg flex flex-col relative group overflow-hidden h-full transition-all duration-200 cursor-move select-none",
        isDragging && "opacity-50 scale-105",
        isDropTarget && "ring-2 ring-primary ring-offset-2 bg-primary/5"
      )}
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
          "absolute top-2 right-2 flex gap-1 transition-opacity z-10",
          isHovered ? "opacity-100" : "opacity-0"
        )}
        onMouseDown={(e) => e.stopPropagation()}
      >
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full shadow-md"
            onClick={handleEdit}
            title="編集"
            draggable={false}
          >
            <Edit className="h-4 w-4" strokeWidth={2} />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full shadow-md"
            onClick={handleDuplicate}
            title="複製"
            draggable={false}
          >
            <Copy className="h-4 w-4" strokeWidth={2} />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full shadow-md hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleDelete}
            title="削除"
            draggable={false}
          >
            <Trash2 className="h-4 w-4" strokeWidth={2} />
          </Button>
        </div>

      <div
        className="bg-white flex items-center justify-center flex-1 overflow-hidden min-h-0 pointer-events-none"
        draggable={false}
      >
        <ChartPreviewGraph 
          editingChart={chart} 
          selectedDataSourceItems={selectedDataSources} 
          maxDataPoints={isCompactLayout ? 100 : 200}
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
  )
}

export const ChartCard = React.memo(ChartCardComponent)