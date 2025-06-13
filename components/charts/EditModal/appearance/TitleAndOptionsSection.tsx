"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChartComponent } from "@/types"

interface TitleAndOptionsSectionProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

export function TitleAndOptionsSection({ editingChart, setEditingChart }: TitleAndOptionsSectionProps) {
  return (
    <div className="space-y-4">
      <Label htmlFor="chart-title" className="text-sm">Title</Label>
      <div className="flex items-center gap-2">
        <Input
          id="chart-title"
          value={editingChart.title}
          onChange={(e) => {
            setEditingChart({
              ...editingChart,
              title: e.target.value,
            })
          }}
          className="h-8 text-sm flex-1"
        />
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="show-title"
              checked={editingChart.showTitle ?? true}
              onChange={(e) => {
                setEditingChart({
                  ...editingChart,
                  showTitle: e.target.checked,
                })
              }}
              className="rounded"
            />
            <Label htmlFor="show-title" className="text-sm whitespace-nowrap">Show Title</Label>
          </div>
        </div>
      </div>
    </div>
  )
}