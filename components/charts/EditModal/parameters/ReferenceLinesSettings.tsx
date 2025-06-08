"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { ChartComponent } from "@/types"

interface ReferenceLineConfig {
  id: string
  type: "vertical" | "horizontal"
  label: string
  xValue?: string
  yValue?: string
  yRangeMin?: string
  yRangeMax?: string
  xRangeMin?: string
  xRangeMax?: string
}

interface ReferenceLinesSettingsProps {
  editingChart: ChartComponent
  referenceLines: ReferenceLineConfig[]
  onUpdateReferenceLines: (lines: ReferenceLineConfig[]) => void
}

export function ReferenceLinesSettings({ editingChart, referenceLines, onUpdateReferenceLines }: ReferenceLinesSettingsProps) {
  const handleAddReferenceLine = () => {
    const newReferenceLine: ReferenceLineConfig = {
      id: Date.now().toString(),
      type: "vertical",
      label: "",
      xValue: "",
      yValue: "",
      yRangeMin: "",
      yRangeMax: "",
      xRangeMin: "",
      xRangeMax: "",
    }
    onUpdateReferenceLines([...referenceLines, newReferenceLine])
  }

  const handleUpdateReferenceLine = (id: string, field: keyof ReferenceLineConfig, value: string) => {
    onUpdateReferenceLines(referenceLines.map(line => 
      line.id === id ? { ...line, [field]: value } : line
    ))
  }

  const handleRemoveReferenceLine = (id: string) => {
    onUpdateReferenceLines(referenceLines.filter(line => line.id !== id))
  }

  return (
    <div className="border rounded-lg p-3 bg-muted/30">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-medium text-sm">Reference Lines Settings</h4>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={handleAddReferenceLine}
        >
          Add Reference Line
        </Button>
      </div>

      <div className="flex gap-2 mb-2 px-1 pb-1 border-b">
        <div className="w-20 text-xs font-medium text-muted-foreground">Type</div>
        <div className="flex-1 text-xs font-medium text-muted-foreground">Label</div>
        <div className="w-24 text-xs font-medium text-muted-foreground">Value</div>
        <div className="w-24 text-xs font-medium text-muted-foreground">Range Min</div>
        <div className="w-24 text-xs font-medium text-muted-foreground">Range Max</div>
        <div className="w-7"></div>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {referenceLines.map((line) => (
          <div key={line.id} className="flex gap-2 p-1">
            <div className="w-20">
              <select
                value={line.type}
                onChange={(e) => handleUpdateReferenceLine(line.id, "type", e.target.value)}
                className="w-full h-7 px-2 py-1 border rounded-md text-xs"
              >
                <option value="vertical">Vertical</option>
                <option value="horizontal">Horizontal</option>
              </select>
            </div>
            <div className="flex-1">
              <Input
                value={line.label}
                onChange={(e) => handleUpdateReferenceLine(line.id, "label", e.target.value)}
                placeholder="Label"
                className="h-7 text-xs"
              />
            </div>
            <div className="w-24">
              {line.type === "vertical" ? (
                <Input
                  value={line.xValue || ""}
                  onChange={(e) => handleUpdateReferenceLine(line.id, "xValue", e.target.value)}
                  placeholder="X value"
                  className="h-7 text-xs"
                />
              ) : (
                <Input
                  type="number"
                  value={line.yValue || ""}
                  onChange={(e) => handleUpdateReferenceLine(line.id, "yValue", e.target.value)}
                  placeholder="Y value"
                  className="h-7 text-xs"
                />
              )}
            </div>
            <div className="w-24">
              {line.type === "vertical" ? (
                <Input
                  type="number"
                  value={line.yRangeMin || ""}
                  onChange={(e) => handleUpdateReferenceLine(line.id, "yRangeMin", e.target.value)}
                  placeholder="Y Min"
                  className="h-7 text-xs"
                />
              ) : editingChart.xAxisType === "datetime" ? (
                <Input
                  type="datetime-local"
                  value={line.xRangeMin || ""}
                  onChange={(e) => handleUpdateReferenceLine(line.id, "xRangeMin", e.target.value)}
                  className="h-7 text-xs"
                />
              ) : (
                <Input
                  type="number"
                  value={line.xRangeMin || ""}
                  onChange={(e) => handleUpdateReferenceLine(line.id, "xRangeMin", e.target.value)}
                  placeholder={editingChart.xAxisType === "time" ? "Start(s)" : "X Min"}
                  className="h-7 text-xs"
                />
              )}
            </div>
            <div className="w-24">
              {line.type === "vertical" ? (
                <Input
                  type="number"
                  value={line.yRangeMax || ""}
                  onChange={(e) => handleUpdateReferenceLine(line.id, "yRangeMax", e.target.value)}
                  placeholder="Y Max"
                  className="h-7 text-xs"
                />
              ) : editingChart.xAxisType === "datetime" ? (
                <Input
                  type="datetime-local"
                  value={line.xRangeMax || ""}
                  onChange={(e) => handleUpdateReferenceLine(line.id, "xRangeMax", e.target.value)}
                  className="h-7 text-xs"
                />
              ) : (
                <Input
                  type="number"
                  value={line.xRangeMax || ""}
                  onChange={(e) => handleUpdateReferenceLine(line.id, "xRangeMax", e.target.value)}
                  placeholder={editingChart.xAxisType === "time" ? "End(s)" : "X Max"}
                  className="h-7 text-xs"
                />
              )}
            </div>
            <div className="w-7">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveReferenceLine(line.id)}
                className="h-7 w-7 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {referenceLines.length === 0 && (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <p className="text-sm">No reference lines added yet.</p>
          <p className="text-sm">Click "Add Reference Line" to create one.</p>
        </div>
      )}
    </div>
  )
}