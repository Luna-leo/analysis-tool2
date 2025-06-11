"use client"

import React, { useCallback } from "react"
import { LineChart, Edit } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChartComponent } from "@/types"
import { useUIStore } from "@/stores/useUIStore"
import { ChartPreviewGraph } from "./ChartPreviewGraph"

interface ChartCardProps {
  chart: ChartComponent
  isCompactLayout: boolean
  cardMinHeight: number
  chartMinHeight: number
}

export const ChartCard = React.memo(({ chart, isCompactLayout, cardMinHeight, chartMinHeight }: ChartCardProps) => {
  const { hoveredChart, setHoveredChart, setEditingChart, setEditModalOpen } = useUIStore()
  
  const handleMouseEnter = useCallback(() => setHoveredChart(chart.id), [setHoveredChart, chart.id])
  const handleMouseLeave = useCallback(() => setHoveredChart(null), [setHoveredChart])
  
  const handleEdit = useCallback(() => {
    setEditingChart(chart)
    setEditModalOpen(true)
  }, [setEditingChart, setEditModalOpen, chart])

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
      {/* Edit Button - appears on hover */}
      {hoveredChart === chart.id && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md"
          onClick={handleEdit}
        >
          <Edit className="h-4 w-4" />
        </Button>
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
        />
      </div>
    </div>
  )
})