"use client"

import React from "react"
import { ChartComponent, EventInfo } from "@/types"
import { ChartPreviewGraph } from "./ChartPreviewGraph"
import { ChartPreviewInfo } from "./ChartPreviewInfo"

interface ChartPreviewProps {
  editingChart: ChartComponent
  selectedDataSourceItems: EventInfo[]
  setEditingChart?: (chart: ChartComponent) => void
}

export function ChartPreview({ editingChart, selectedDataSourceItems, setEditingChart }: ChartPreviewProps) {
  return (
    <div className="w-full h-full flex flex-col">
      <ChartPreviewGraph
        editingChart={editingChart}
        selectedDataSourceItems={selectedDataSourceItems}
        setEditingChart={setEditingChart}
      />
      <ChartPreviewInfo
        editingChart={editingChart}
        selectedDataSourceItems={selectedDataSourceItems}
      />
    </div>
  )
}
