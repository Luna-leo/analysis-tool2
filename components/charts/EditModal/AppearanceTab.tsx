"use client"

import { ChartComponent } from "@/types"
import { ChartTypeSelector } from "./ChartTypeSelector"
import { TitleAndOptionsSection } from "./TitleAndOptionsSection"
import { XAxisSettings } from "./XAxisSettings"
import { YAxisSettings } from "./YAxisSettings"
import { PlotStyleTable } from "./PlotStyleTable"

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
      <ChartTypeSelector editingChart={editingChart} setEditingChart={setEditingChart} />
      <TitleAndOptionsSection editingChart={editingChart} setEditingChart={setEditingChart} />
      <XAxisSettings editingChart={editingChart} setEditingChart={setEditingChart} />
      <YAxisSettings editingChart={editingChart} setEditingChart={setEditingChart} />
      <PlotStyleTable
        editingChart={editingChart}
        setEditingChart={setEditingChart}
        selectedDataSourceItems={selectedDataSourceItems}
      />
    </div>
  )
}
