"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ChartComponent } from "@/types"

interface TitleAndOptionsSectionProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

export function TitleAndOptionsSection({ editingChart, setEditingChart }: TitleAndOptionsSectionProps) {
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

      {/* Display Options - 1行で表示 */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium w-20">Display</Label>
        <div className="flex items-center gap-6 flex-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-markers"
              checked={editingChart.showMarkers ?? true}
              onCheckedChange={(checked) => {
                setEditingChart({
                  ...editingChart,
                  showMarkers: checked === true,
                })
              }}
            />
            <Label htmlFor="show-markers" className="text-sm cursor-pointer">Markers</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-lines"
              checked={editingChart.showLines ?? false}
              onCheckedChange={(checked) => {
                setEditingChart({
                  ...editingChart,
                  showLines: checked === true,
                })
              }}
            />
            <Label htmlFor="show-lines" className="text-sm cursor-pointer">Lines</Label>
          </div>
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
        </div>
      </div>
    </div>
  )
}