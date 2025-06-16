"use client"

import React, { useState } from "react"
import { ChartComponent } from "@/types"
import { cn } from "@/lib/utils"

interface SimplifiedChartPreviewProps {
  chart: ChartComponent
  isActive: boolean
  hasCheckbox?: boolean
}

export function SimplifiedChartPreview({ chart, isActive, hasCheckbox = false }: SimplifiedChartPreviewProps) {
  const [isHovered, setIsHovered] = React.useState(false)
  
  // Get chart type label
  const getChartTypeLabel = () => {
    const hasTimeAxis = chart.xAxisType === "datetime" || chart.xAxisType === "time"
    if (hasTimeAxis) return "TIME"
    if (chart.type === "scatter") return "SCATTER"
    if (chart.type === "bar") return "BAR"
    return "LINE"
  }

  // Get valid Y parameters
  const validYParams = chart.yAxisParams?.filter(p => p.parameter && p.parameter.trim() !== '') || []

  return (
    <div 
      className={cn(
        "w-full h-full flex flex-col p-1.5 transition-all duration-200 relative",
        isActive && "bg-blue-50/50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Chart title - with padding for jump icon */}
      <div className={cn(
        "text-xs font-bold truncate mb-0.5",
        hasCheckbox ? "pl-5 pr-12" : "pr-16",
        isActive ? "text-blue-900" : "text-foreground"
      )}>
        {chart.title}
      </div>
      
      {/* Y Parameter display */}
      {validYParams.length > 0 ? (
        <div className={cn(
          "text-[10px] truncate",
          hasCheckbox ? "pl-5 pr-12" : "pr-16",
          isActive ? "text-blue-700" : "text-muted-foreground"
        )}>
          {validYParams[0].parameter}
          {validYParams.length > 1 && (
            <span className="text-[9px] ml-1">+{validYParams.length - 1}</span>
          )}
        </div>
      ) : (
        <div className={cn(
          "text-[10px] truncate italic",
          hasCheckbox ? "pl-5 pr-12" : "pr-16",
          "text-muted-foreground/60"
        )}>
          No parameters
        </div>
      )}
      
      {/* Metadata row */}
      <div className={cn(
        "flex items-center justify-between text-[9px] text-muted-foreground mt-auto",
        hasCheckbox ? "pl-5" : ""
      )}>
        <span className={cn(
          "font-medium",
          isActive && "text-blue-600"
        )}>
          {getChartTypeLabel()}
        </span>
        {validYParams.length > 0 && (
          <span className={cn(
            "font-bold",
            isActive && "text-blue-600"
          )}>
            {validYParams.length}p
          </span>
        )}
      </div>
      
      {/* Hover tooltip for all parameters */}
      {isHovered && validYParams.length > 1 && (
        <div className="absolute z-20 bg-popover border rounded-md shadow-lg p-2 text-xs max-w-xs"
             style={{ 
               bottom: '100%', 
               left: hasCheckbox ? '20px' : '0',
               marginBottom: '4px'
             }}>
          <div className="font-semibold mb-1">Y Parameters:</div>
          {validYParams.map((param, idx) => (
            <div key={idx} className="truncate">
              {param.parameter}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}