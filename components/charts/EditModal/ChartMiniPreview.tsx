"use client"

import React from "react"
import { ChartComponent } from "@/types"
import { Activity, TrendingUp, BarChart3, LineChart } from "lucide-react"

interface ChartMiniPreviewProps {
  chart: ChartComponent
  isActive: boolean
}

export function ChartMiniPreview({ chart, isActive }: ChartMiniPreviewProps) {
  // Simple icon-based representation based on chart type and parameters
  const getChartIcon = () => {
    // Check if it's time-series data
    const hasTimeAxis = chart.xAxisType === "datetime" || chart.xAxisType === "time"
    // Extract parameter count from yAxisParams
    const paramCount = chart.yAxisParams?.filter(p => p.parameter && p.parameter.trim() !== '').length || 0

    if (hasTimeAxis) {
      return <Activity className="h-5 w-5" />
    } else if (paramCount > 3) {
      return <BarChart3 className="h-5 w-5" />
    } else if (chart.type === "scatter") {
      return <TrendingUp className="h-5 w-5" />
    } else {
      return <LineChart className="h-5 w-5" />
    }
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-1">
      <div className={`transition-all duration-200 ${isActive ? "text-blue-500 scale-110" : "text-muted-foreground"}`}>
        {getChartIcon()}
      </div>
      <div className={`text-[9px] mt-1 text-center truncate w-full px-1 font-medium transition-colors ${
        isActive ? "text-foreground" : "text-muted-foreground"
      }`}>
        {chart.title}
      </div>
      {chart.yAxisParams && chart.yAxisParams.filter(p => p.parameter && p.parameter.trim() !== '').length > 0 && (
        <div className="text-[8px] text-muted-foreground">
          {chart.yAxisParams.filter(p => p.parameter && p.parameter.trim() !== '').length} param{chart.yAxisParams.filter(p => p.parameter && p.parameter.trim() !== '').length > 1 ? "s" : ""}
        </div>
      )}
    </div>
  )
}