"use client"

import { ChartComponent } from "@/types"
import { ChartSettings } from "./ChartSettings"
import { PlotStyleTable } from "./PlotStyleSettings"
import { LayoutSettings } from "./LayoutSettings"
import { Separator } from "@/components/ui/separator"

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
      {/* Chart General Settings */}
      <ChartSettings editingChart={editingChart} setEditingChart={setEditingChart} />
      
      <Separator />
      
      {/* Layout Settings */}
      <LayoutSettings editingChart={editingChart} setEditingChart={setEditingChart} />
      
      <Separator />
      
      {/* Plot Style Settings */}
      <PlotStyleTable
        editingChart={editingChart}
        setEditingChart={setEditingChart}
        selectedDataSourceItems={selectedDataSourceItems}
      />
    </div>
  )
}
