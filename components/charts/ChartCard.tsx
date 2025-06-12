"use client"

import React, { useCallback, useState } from "react"
import { LineChart, Edit, Copy, Trash2 } from "lucide-react"
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
import { ChartComponent } from "@/types"
import { useUIStore } from "@/stores/useUIStore"
import { useFileStore } from "@/stores/useFileStore"
import { ChartPreviewGraph } from "./ChartPreviewGraph"

interface ChartCardProps {
  chart: ChartComponent
  isCompactLayout: boolean
  cardMinHeight: number
  chartMinHeight: number
  fileId: string
}

export const ChartCard = React.memo(({ chart, isCompactLayout, cardMinHeight, chartMinHeight, fileId }: ChartCardProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { hoveredChart, setHoveredChart, setEditingChart, setEditModalOpen } = useUIStore()
  const { duplicateChart, deleteChart } = useFileStore()
  
  const handleMouseEnter = useCallback(() => setHoveredChart(chart.id), [setHoveredChart, chart.id])
  const handleMouseLeave = useCallback(() => setHoveredChart(null), [setHoveredChart])
  
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

  return (
    <div
      className={cn(
        "bg-card border rounded-lg flex flex-col relative group",
        isCompactLayout ? "p-3" : "p-4"
      )}
      style={{
        minHeight: `${cardMinHeight}px`,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Edit, Duplicate and Delete Buttons - appear on hover */}
      {hoveredChart === chart.id && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full shadow-md"
            onClick={handleDuplicate}
            title="複製"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full shadow-md"
            onClick={handleEdit}
            title="編集"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full shadow-md hover:bg-destructive hover:text-destructive-foreground"
            onClick={handleDelete}
            title="削除"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      <h3
        className={cn(
          "font-semibold flex items-center gap-2 flex-shrink-0",
          isCompactLayout ? "text-sm mb-2" : "text-lg mb-4"
        )}
      >
        <LineChart className={cn(isCompactLayout ? "h-4 w-4" : "h-5 w-5")} />
        <span className="truncate">{chart.title}</span>
      </h3>
      <div
        className="bg-muted rounded flex items-center justify-center flex-1 overflow-hidden"
        style={{
          minHeight: `${chartMinHeight}px`,
        }}
      >
        <ChartPreviewGraph 
          editingChart={chart} 
          selectedDataSourceItems={chart.selectedDataSources || []} 
          maxDataPoints={isCompactLayout ? 500 : 1000}
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
})