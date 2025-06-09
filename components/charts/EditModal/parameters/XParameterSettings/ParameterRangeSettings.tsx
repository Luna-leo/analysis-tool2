"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChartComponent } from "@/types"

interface ParameterRangeSettingsProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
  disabled: boolean
}

export function ParameterRangeSettings({ editingChart, setEditingChart, disabled }: ParameterRangeSettingsProps) {
  return (
    <div className="space-y-2">
      <div>
        <Label htmlFor="x-min" className="text-xs">Min Value</Label>
        <Input
          id="x-min"
          type="number"
          value={editingChart.xAxisRange?.min || ""}
          onChange={(e) => {
            setEditingChart({
              ...editingChart,
              xAxisRange: {
                ...editingChart.xAxisRange,
                min: parseFloat(e.target.value) || 0,
                max: editingChart.xAxisRange?.max || 100,
                auto: editingChart.xAxisRange?.auto !== false,
              }
            })
          }}
          disabled={disabled}
          placeholder="Min"
          className="h-8"
        />
      </div>
      <div>
        <Label htmlFor="x-max" className="text-xs">Max Value</Label>
        <Input
          id="x-max"
          type="number"
          value={editingChart.xAxisRange?.max || ""}
          onChange={(e) => {
            setEditingChart({
              ...editingChart,
              xAxisRange: {
                ...editingChart.xAxisRange,
                min: editingChart.xAxisRange?.min || 0,
                max: parseFloat(e.target.value) || 100,
                auto: editingChart.xAxisRange?.auto !== false,
              }
            })
          }}
          disabled={disabled}
          placeholder="Max"
          className="h-8"
        />
      </div>
    </div>
  )
}