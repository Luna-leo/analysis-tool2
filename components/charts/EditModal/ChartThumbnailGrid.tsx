"use client"

import React, { useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ChartComponent } from "@/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChartMiniPreview } from "./ChartMiniPreview"

interface ChartThumbnailGridProps {
  charts: ChartComponent[]
  currentChartId: string
  onChartSelect: (chart: ChartComponent, index: number) => void
  columns: number
  className?: string
}

export function ChartThumbnailGrid({ 
  charts, 
  currentChartId, 
  onChartSelect,
  columns,
  className 
}: ChartThumbnailGridProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const activeButtonRef = useRef<HTMLButtonElement>(null)
  const activeIndex = charts.findIndex(chart => chart.id === currentChartId)

  // Auto-scroll to active chart
  useEffect(() => {
    if (activeButtonRef.current && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        activeButtonRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
      }
    }
  }, [currentChartId])

  return (
    <div className={cn("border rounded-lg p-3", className)}>
      <div className="text-sm font-medium mb-2 text-muted-foreground flex justify-between items-center">
        <span>Grid Overview</span>
        <span className="text-xs">
          {activeIndex + 1} / {charts.length}
        </span>
      </div>
      
      <ScrollArea className="h-[160px]" ref={scrollAreaRef}>
        <div 
          className="grid gap-1 pr-2"
          style={{
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
          }}
        >
          {charts.map((chart, index) => {
            const row = Math.floor(index / columns)
            const col = index % columns
            
            return (
              <button
                key={chart.id}
                ref={currentChartId === chart.id ? activeButtonRef : null}
                onClick={() => onChartSelect(chart, index)}
                className={cn(
                  "aspect-[3/2] rounded border transition-all duration-200",
                  "hover:border-primary/50 hover:shadow-sm",
                  "flex items-center justify-center text-[11px] font-medium",
                  "bg-muted/10 p-2",
                  "relative overflow-hidden",
                  currentChartId === chart.id 
                    ? "border-blue-500 shadow-md ring-1 ring-blue-500/30 bg-blue-50/50" 
                    : "border-border"
                )}
                title={`${chart.title} (Row ${row + 1}, Col ${col + 1})`}
              >
                {currentChartId === chart.id && (
                  <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />
                )}
                <div className={cn(
                  "absolute top-0.5 left-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded",
                  currentChartId === chart.id 
                    ? "bg-blue-500 text-white" 
                    : "bg-muted text-muted-foreground"
                )}>
                  {index + 1}
                </div>
                <div className="text-center w-full">
                  <div className="truncate px-1 font-medium">
                    {chart.title}
                  </div>
                  {chart.yParameters && chart.yParameters.length > 0 && (
                    <div className="text-[8px] text-muted-foreground mt-0.5">
                      {chart.yParameters.length}p
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}