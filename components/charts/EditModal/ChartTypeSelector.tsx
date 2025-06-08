"use client"

import { Label } from "@/components/ui/label"
import { ChartComponent } from "@/types"

interface ChartTypeSelectorProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

export function ChartTypeSelector({ editingChart, setEditingChart }: ChartTypeSelectorProps) {
  return (
    <div>
      <Label htmlFor="chart-type" className="text-sm">Chart Type</Label>
      <select
        id="chart-type"
        value={editingChart.chartType || "line"}
        onChange={(e) => {
          setEditingChart({
            ...editingChart,
            chartType: e.target.value as "line" | "bar" | "pie",
          })
        }}
        className="w-full h-8 px-2 py-1 border rounded-md text-sm"
      >
        <option value="line">Line Chart</option>
        <option value="bar">Bar Chart</option>
        <option value="pie">Pie Chart</option>
      </select>
    </div>
  )
}