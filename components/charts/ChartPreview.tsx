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
}

export const ChartPreview = React.memo(({ editingChart, selectedDataSourceItems, setEditingChart, dataSourceStyles }: ChartPreviewProps) => {
  return (
    <div className="w-full h-full flex flex-col">
      <ChartPreviewGraph
        editingChart={editingChart}
        selectedDataSourceItems={selectedDataSourceItems}
        setEditingChart={setEditingChart}
        dataSourceStyles={dataSourceStyles}
      />
      <ChartPreviewInfo
        editingChart={editingChart}
        selectedDataSourceItems={selectedDataSourceItems}
      />
    </div>
  )
})
