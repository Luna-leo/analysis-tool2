"use client"

import React from "react"
import { ChartComponent, EventInfo } from "@/types"
import { ChartPreviewGraph } from "./ChartPreviewGraph"
import { ChartPreviewInfo } from "./ChartPreviewInfo"

interface ChartPreviewProps {
  editingChart: ChartComponent
  selectedDataSourceItems: EventInfo[]
  setEditingChart?: (chart: ChartComponent) => void
  dataSourceStyles?: { [dataSourceId: string]: any }
  chartSettings?: {
    showXAxis: boolean
    showYAxis: boolean
    showGrid: boolean
    showLegend?: boolean
    showChartTitle?: boolean
    margins?: {
      top: number
      right: number
      bottom: number
      left: number
    }
    xLabelOffset?: number
    yLabelOffset?: number
  }
  enableZoom?: boolean
  enablePan?: boolean
  zoomMode?: 'x' | 'xy' | 'auto'
  onScalesUpdate?: (scales: {
    xDomain: [any, any]
    yDomain: [number, number]
    xAxisType: string
  }) => void
}

export const ChartPreview = ({ editingChart, selectedDataSourceItems, setEditingChart, dataSourceStyles, chartSettings, enableZoom = true, enablePan = true, zoomMode = 'auto', onScalesUpdate }: ChartPreviewProps) => {
  
  
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-shrink-0" style={{ height: '60%' }}>
        <ChartPreviewGraph
          editingChart={editingChart}
          selectedDataSourceItems={selectedDataSourceItems}
          setEditingChart={setEditingChart}
          dataSourceStyles={dataSourceStyles}
          chartSettings={chartSettings}
          enableZoom={enableZoom}
          enablePan={enablePan}
          zoomMode={zoomMode}
          showZoomControls={true}
          onScalesUpdate={onScalesUpdate}
        />
      </div>
      <div className="flex-1 overflow-y-auto">
        <ChartPreviewInfo
          editingChart={editingChart}
          selectedDataSourceItems={selectedDataSourceItems}
        />
      </div>
    </div>
  )
}
