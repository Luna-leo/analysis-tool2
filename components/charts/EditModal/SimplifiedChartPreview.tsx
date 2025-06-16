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

  return (
    <div 
      className={cn(
        "w-full h-full flex flex-col p-1.5 transition-all duration-200 relative",
        isActive && "bg-blue-50/50"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Chart title - with padding for checkbox */}
      <div className={cn(
        "text-xs font-bold truncate mb-0.5",
        hasCheckbox ? "pl-5" : "",
        isActive ? "text-blue-900" : "text-foreground"
      )}>
        {chart.title}
      </div>
      
      {/* Y Parameter display */}
      {chart.yParameters && chart.yParameters.length > 0 && (
        <div className={cn(
          "text-[10px] truncate",
          hasCheckbox ? "pl-5" : "",
          isActive ? "text-blue-700" : "text-muted-foreground"
        )}>
          {chart.yParameters[0].name}
          {chart.yParameters.length > 1 && (
            <span className="text-[9px] ml-1">+{chart.yParameters.length - 1}</span>
          )}
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
        {chart.yParameters && chart.yParameters.length > 0 && (
          <span className={cn(
            "font-bold",
            isActive && "text-blue-600"
          )}>
            {chart.yParameters.length}p
          </span>
        )}
      </div>
      
      {/* Hover tooltip for all parameters */}
      {isHovered && chart.yParameters && chart.yParameters.length > 1 && (
        <div className="absolute z-20 bg-popover border rounded-md shadow-lg p-2 text-xs max-w-xs"
             style={{ 
               bottom: '100%', 
               left: hasCheckbox ? '20px' : '0',
               marginBottom: '4px'
             }}>
          <div className="font-semibold mb-1">Y Parameters:</div>
          {chart.yParameters.map((param, idx) => (
            <div key={idx} className="truncate">
              {param.name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}