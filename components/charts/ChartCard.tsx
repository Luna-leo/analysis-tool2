"use client"

import React from "react"
import { LineChart, Edit } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChartComponent } from "@/types"
import { useUIStore } from "@/stores/useUIStore"

interface ChartCardProps {
  chart: ChartComponent
  isCompactLayout: boolean
  cardMinHeight: number
  chartMinHeight: number
}

export function ChartCard({ chart, isCompactLayout, cardMinHeight, chartMinHeight }: ChartCardProps) {
  const { hoveredChart, setHoveredChart, setEditingChart, setEditModalOpen } = useUIStore()

  return (
    <div
      className={cn(
        "bg-card border rounded-lg flex flex-col relative group",
        isCompactLayout ? "p-3" : "p-4"
      )}
      style={{
        minHeight: `${cardMinHeight}px`,
      }}
      onMouseEnter={() => setHoveredChart(chart.id)}
      onMouseLeave={() => setHoveredChart(null)}
    >
      {/* Edit Button - appears on hover */}
      {hoveredChart === chart.id && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md"
          onClick={() => {
            setEditingChart(chart)
            setEditModalOpen(true)
          }}
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
        className="bg-muted rounded flex items-center justify-center flex-1"
        style={{
          minHeight: `${chartMinHeight}px`,
        }}
      >
        <div className="text-center">
          <div className={cn(isCompactLayout ? "text-2xl mb-1" : "text-4xl mb-2")}>📊</div>
          <p className={cn("text-muted-foreground", isCompactLayout ? "text-xs" : "text-sm")}>
            Chart Preview
          </p>
          <p className={cn("text-muted-foreground mt-1", isCompactLayout ? "text-xs" : "text-sm")}>
            {chart.data.length} data points
          </p>
        </div>
      </div>
    </div>
  )
}