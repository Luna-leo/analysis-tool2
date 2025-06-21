"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ChartComponent } from "@/types"

interface ChartSettingsProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

export function ChartSettings({ editingChart, setEditingChart }: ChartSettingsProps) {
  return (
    <div className="space-y-4 px-4">
      {/* Title */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium w-20">Title</Label>
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
      </div>

      {/* Chart Display Options */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium w-20">Display</Label>
        <div className="flex items-center gap-6 flex-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-title"
              checked={editingChart.showTitle ?? true}
              onCheckedChange={(checked) => {
                setEditingChart({
                  ...editingChart,
                  showTitle: checked === true,
                })
              }}
            />
            <Label htmlFor="show-title" className="text-sm cursor-pointer">Title</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-legend"
              checked={editingChart.showLegend ?? true}
              onCheckedChange={(checked) => {
                setEditingChart({
                  ...editingChart,
                  showLegend: checked === true,
                })
              }}
            />
            <Label htmlFor="show-legend" className="text-sm cursor-pointer">Legend</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-grid"
              checked={editingChart.showGrid ?? false}
              onCheckedChange={(checked) => {
                setEditingChart({
                  ...editingChart,
                  showGrid: checked === true,
                })
              }}
            />
            <Label htmlFor="show-grid" className="text-sm cursor-pointer">Grid</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-x-label"
              checked={editingChart.showXLabel ?? true}
              onCheckedChange={(checked) => {
                setEditingChart({
                  ...editingChart,
                  showXLabel: checked === true,
                })
              }}
            />
            <Label htmlFor="show-x-label" className="text-sm cursor-pointer">X Label</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-y-label"
              checked={editingChart.showYLabel ?? true}
              onCheckedChange={(checked) => {
                setEditingChart({
                  ...editingChart,
                  showYLabel: checked === true,
                })
              }}
            />
            <Label htmlFor="show-y-label" className="text-sm cursor-pointer">Y Label</Label>
          </div>
        </div>
      </div>
    </div>
  )
}