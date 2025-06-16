"use client"

import { ChartComponent } from "@/types"
import { TitleAndOptionsSection } from "./TitleAndOptionsSection"
import { PlotStyleTable } from "./PlotStyleSettings"

interface AppearanceTabProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
  selectedDataSourceItems: {
    id: string
    plant: string
    machineNo: string
    label: string
    labelDescription?: string
  }[]
}

export function AppearanceTab({
  editingChart,
  setEditingChart,
  selectedDataSourceItems,
}: AppearanceTabProps) {
  return (
    <div className="space-y-4">
      <TitleAndOptionsSection editingChart={editingChart} setEditingChart={setEditingChart} />
      <PlotStyleTable
        editingChart={editingChart}
        setEditingChart={setEditingChart}
        selectedDataSourceItems={selectedDataSourceItems}
      />
    </div>
  )
}
