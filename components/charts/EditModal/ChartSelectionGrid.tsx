"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { ChartComponent, EventInfo, DataSourceStyle } from "@/types"
import { SimplifiedChartPreview } from "./SimplifiedChartPreview"
import { Checkbox } from "@/components/ui/checkbox"

interface ChartSelectionGridProps {
  charts: ChartComponent[]
  columns: number
  currentChartId: string
  selectedChartIds: Set<string>
  onChartSelect: (chart: ChartComponent, index: number) => void
  onToggleSelection: (chartId: string) => void
}

export function ChartSelectionGrid({
  charts,
  columns,
  currentChartId,
  selectedChartIds,
  onChartSelect,
  onToggleSelection
}: ChartSelectionGridProps) {
  const rows = Math.ceil(charts.length / columns)
  const isCompactLayout = rows >= 3 || columns >= 3
  const cardHeight = isCompactLayout ? 70 : 90
  const [lastSelectedIndex, setLastSelectedIndex] = React.useState<number | null>(null)

  const handleCheckboxChange = (chartId: string, index: number, e: React.MouseEvent) => {
    if (e.shiftKey && lastSelectedIndex !== null) {
      // Shift+click: select range
      const start = Math.min(lastSelectedIndex, index)
      const end = Math.max(lastSelectedIndex, index)
      
      for (let i = start; i <= end; i++) {
        const chart = charts[i]
        if (chart && !selectedChartIds.has(chart.id)) {
          onToggleSelection(chart.id)
        }
      }
    } else {
      // Normal click
      onToggleSelection(chartId)
    }
    setLastSelectedIndex(index)
  }

  return (
    <div className="h-full overflow-auto">
      <div 
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
        }}
      >
        {charts.map((chart, index) => {
          const isSelected = selectedChartIds.has(chart.id)
          const isCurrent = chart.id === currentChartId
          
          return (
            <div
              key={chart.id}
              className={cn(
                "relative border rounded-lg overflow-hidden transition-all duration-200",
                "hover:shadow-md cursor-pointer",
                isCurrent && "ring-2 ring-blue-500 border-blue-500",
                isSelected && !isCurrent && "ring-2 ring-primary border-primary",
                !isSelected && !isCurrent && "border-border"
              )}
              style={{ height: `${cardHeight}px` }}
            >

              {/* Chart number with current indicator */}
              <div className={cn(
                "absolute top-1 right-1 z-10 px-1.5 py-0.5 rounded text-[10px] font-bold",
                isCurrent ? "bg-blue-500 text-white" : "bg-background/90"
              )}>
                {index + 1}
              </div>


              {/* Chart preview with integrated checkbox */}
              <div 
                className="w-full h-full bg-white cursor-pointer relative"
                onClick={() => onChartSelect(chart, index)}
              >
                {/* Integrated checkbox in content */}
                <div 
                  className="absolute top-1 left-1 z-10"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleCheckboxChange(chart.id, index, e)
                  }}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => {}}
                    className="h-3 w-3 bg-background border"
                  />
                </div>
                
                <SimplifiedChartPreview 
                  chart={chart}
                  isActive={isCurrent}
                  hasCheckbox={true}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}