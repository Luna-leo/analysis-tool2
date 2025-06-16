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
  className?: string
}

export function ChartThumbnailGrid({ 
  charts, 
  currentChartId, 
  onChartSelect,
  className 
}: ChartThumbnailGridProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const activeButtonRef = useRef<HTMLButtonElement>(null)

  // Auto-scroll to active chart when it changes
  useEffect(() => {
    if (activeButtonRef.current && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        const buttonRect = activeButtonRef.current.getBoundingClientRect()
        const containerRect = scrollContainer.getBoundingClientRect()
        
        const scrollLeft = activeButtonRef.current.offsetLeft - (containerRect.width / 2) + (buttonRect.width / 2)
        scrollContainer.scrollTo({ left: scrollLeft, behavior: 'smooth' })
      }
    }
  }, [currentChartId])

  return (
    <div className={cn("border rounded-lg p-2", className)}>
      <div className="text-sm font-medium mb-2 text-muted-foreground">
        Charts Overview ({charts.length})
      </div>
      
      <ScrollArea className="h-24" ref={scrollAreaRef}>
        <div className="flex gap-2 pb-2">
          {charts.map((chart, index) => (
            <button
              key={chart.id}
              ref={currentChartId === chart.id ? activeButtonRef : null}
              onClick={() => onChartSelect(chart, index)}
              className={cn(
                "flex-shrink-0 w-24 h-20 rounded-lg border-2 transition-all duration-200",
                "hover:scale-105 hover:border-primary/50",
                "flex items-center justify-center text-xs font-medium",
                "bg-background",
                "relative overflow-hidden",
                currentChartId === chart.id 
                  ? "border-blue-500 shadow-lg ring-2 ring-blue-500/20 scale-105" 
                  : "border-border hover:border-primary/30"
              )}
              title={chart.title}
            >
              {currentChartId === chart.id && (
                <div className="absolute top-0 right-0 bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-bl-md">
                  {index + 1}
                </div>
              )}
              {currentChartId !== chart.id && (
                <div className="absolute top-0 left-0 text-[9px] text-muted-foreground px-1 py-0.5">
                  {index + 1}
                </div>
              )}
              <ChartMiniPreview chart={chart} isActive={currentChartId === chart.id} />
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}