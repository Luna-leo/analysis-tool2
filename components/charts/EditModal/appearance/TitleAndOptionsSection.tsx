"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartComponent } from "@/types"

interface TitleAndOptionsSectionProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

export function TitleAndOptionsSection({ editingChart, setEditingChart }: TitleAndOptionsSectionProps) {
  return (
    <div className="space-y-4">
      {/* Display Options */}
      <div className="space-y-2">
        <Label className="text-sm">Display Options</Label>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="show-markers"
              checked={editingChart.showMarkers ?? true}
              onChange={(e) => {
                setEditingChart({
                  ...editingChart,
                  showMarkers: e.target.checked,
                })
              }}
              className="rounded"
            />
            <Label htmlFor="show-markers" className="text-sm whitespace-nowrap">Show Markers</Label>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="show-lines"
              checked={editingChart.showLines ?? false}
              onChange={(e) => {
                setEditingChart({
                  ...editingChart,
                  showLines: e.target.checked,
                })
              }}
              className="rounded"
            />
            <Label htmlFor="show-lines" className="text-sm whitespace-nowrap">Show Lines</Label>
          </div>
        </div>
      </div>
      
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
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="show-legend"
              checked={editingChart.showLegend ?? true}
              onChange={(e) => {
                setEditingChart({
                  ...editingChart,
                  showLegend: e.target.checked,
                })
              }}
              className="rounded"
            />
            <Label htmlFor="show-legend" className="text-sm whitespace-nowrap">Show Legend</Label>
          </div>
        </div>
      </div>
    </div>
  )
}