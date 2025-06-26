"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChartComponent, TimeUnit } from "@/types"

interface TimeRangeSettingsProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
  disabled: boolean
}

export function TimeRangeSettings({ editingChart, setEditingChart, disabled }: TimeRangeSettingsProps) {
  return (
    <>
      <div>
        <Label className="text-xs">Time Unit</Label>
        <select
          value={editingChart.xAxisRange?.unit || "sec"}
          onChange={(e) => {
            setEditingChart({
              ...editingChart,
              xAxisRange: {
                ...editingChart.xAxisRange,
                unit: e.target.value as TimeUnit,
                auto: editingChart.xAxisRange?.auto !== false,
                min: editingChart.xAxisRange?.min || 0,
                max: editingChart.xAxisRange?.max || 100,
              }
            })
          }}
          className="w-full h-8 px-2 py-1 border rounded-md text-sm mt-1"
        >
          <option value="sec">Seconds</option>
          <option value="min">Minutes</option>
          <option value="hr">Hours</option>
        </select>
      </div>
      
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
            placeholder={`Start (${editingChart.xAxisRange?.unit || "sec"})`}
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
            placeholder={`End (${editingChart.xAxisRange?.unit || "sec"})`}
            className="h-8"
          />
        </div>
      </div>
    </>
  )
}