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
  enableZoom?: boolean
  enablePan?: boolean
  zoomMode?: 'x' | 'xy' | 'auto'
}

export const ChartPreview = React.memo(({ editingChart, selectedDataSourceItems, setEditingChart, dataSourceStyles, enableZoom = true, enablePan = true, zoomMode = 'auto' }: ChartPreviewProps) => {
  return (
    <div className="w-full h-full flex flex-col">
      <ChartPreviewGraph
        editingChart={editingChart}
        selectedDataSourceItems={selectedDataSourceItems}
        setEditingChart={setEditingChart}
        dataSourceStyles={dataSourceStyles}
        enableZoom={enableZoom}
        enablePan={enablePan}
        zoomMode={zoomMode}
        showZoomControls={true}
      />
      <ChartPreviewInfo
        editingChart={editingChart}
        selectedDataSourceItems={selectedDataSourceItems}
      />
    </div>
  )
})
