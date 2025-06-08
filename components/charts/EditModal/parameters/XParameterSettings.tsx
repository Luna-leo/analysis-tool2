"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChartComponent } from "@/types"

interface XParameterSettingsProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

export function XParameterSettings({ editingChart, setEditingChart }: XParameterSettingsProps) {
  return (
    <div className="border rounded-lg p-3 bg-muted/30">
      <h4 className="font-medium text-sm mb-2">X Parameter Settings</h4>
      <div className="flex gap-2">
        <div className="w-38">
          <Label htmlFor="x-axis-type" className="text-sm mb-1 block">Parameter Type</Label>
          <select
            id="x-axis-type"
            className="w-full h-8 px-2 py-1 border rounded-md text-sm"
            value={editingChart.xAxisType || "datetime"}
            onChange={(e) => {
              setEditingChart({
                ...editingChart,
                xAxisType: e.target.value as "datetime" | "time" | "parameter",
                ...(e.target.value !== "parameter" && { xParameter: "" }),
              })
            }}
          >
            <option value="datetime">Datetime</option>
            <option value="time">Time (elapsed)</option>
            <option value="parameter">Parameter</option>
          </select>
        </div>

        <div className="flex-1">
          <Label htmlFor="x-parameter" className="text-sm mb-1 block">Parameter</Label>
          <Input
            id="x-parameter"
            value={editingChart.xParameter || ""}
            onChange={(e) => {
              setEditingChart({
                ...editingChart,
                xParameter: e.target.value,
              })
            }}
            placeholder="Enter parameter"
            disabled={editingChart.xAxisType !== "parameter"}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </div>
  )
}