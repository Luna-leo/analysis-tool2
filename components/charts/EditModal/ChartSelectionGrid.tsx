"use client"

import React from "react"
import { cn } from "@/lib/utils"
import { ChartComponent, EventInfo, DataSourceStyle } from "@/types"
import { SimplifiedChartPreview } from "./SimplifiedChartPreview"
import { ExternalLink } from "lucide-react"

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
        className="grid gap-1.5"
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
                "cursor-pointer",
                isCurrent && "border-blue-500 bg-blue-50 shadow-sm shadow-blue-200",
                isSelected && !isCurrent && "border-primary/60 bg-primary/5",
                !isSelected && !isCurrent && "border-border bg-white hover:border-gray-300 hover:shadow-sm"
              )}
              style={{ height: `${cardHeight}px` }}
            >

              {/* Chart number and jump icon */}
              <div className="absolute top-1 right-1 z-10 flex items-center gap-1">
                {/* Jump icon */}
                <button
                  className={cn(
                    "p-1 rounded transition-all",
                    "bg-white/80 hover:bg-white shadow-sm",
                    "hover:shadow-md"
                  )}
                  onClick={(e) => {
                    e.stopPropagation()
                    onChartSelect(chart, index)
                  }}
                  title="View this chart"
                >
                  <ExternalLink className="h-3 w-3" />
                </button>
                
                {/* Chart number with current indicator */}
                <div className={cn(
                  "px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm",
                  isCurrent ? "bg-blue-500 text-white" : isSelected ? "bg-primary text-primary-foreground" : "bg-white/90 text-gray-700"
                )}>
                  {index + 1}
                </div>
              </div>


              {/* Chart preview with integrated checkbox */}
              <div 
                className="w-full h-full cursor-pointer relative"
                onClick={(e) => handleCheckboxChange(chart.id, index, e)}
                title="Click to select"
              >
                {/* Selection indicator - more prominent */}
                {isSelected && (
                  <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    {/* Corner triangle indicator */}
                    <div className="absolute top-0 left-0 w-6 h-6">
                      <div className="absolute top-0 left-0 w-0 h-0 border-t-[20px] border-t-primary border-r-[20px] border-r-transparent" />
                      <svg className="absolute top-0.5 left-0.5 w-2.5 h-2.5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
                
                <SimplifiedChartPreview 
                  chart={chart}
                  isActive={isCurrent}
                  hasCheckbox={false}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}