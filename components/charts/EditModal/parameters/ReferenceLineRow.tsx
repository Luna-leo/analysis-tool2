"use client"

import React, { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { ChartComponent, ReferenceLine } from "@/types"
import { ReferenceLineConfig } from "@/types/reference-line"
import { ReferenceLineStylePopover } from "./ReferenceLineStylePopover"

// Re-export for backward compatibility
export type { ReferenceLineConfig }

interface ReferenceLineRowProps {
  line: ReferenceLineConfig
  editingChart: ChartComponent
  onUpdateReferenceLine: (id: string, field: keyof ReferenceLineConfig, value: any) => void
  onRemoveReferenceLine: (id: string) => void
}

export const ReferenceLineRow = React.memo(({
  line,
  editingChart,
  onUpdateReferenceLine,
  onRemoveReferenceLine
}: ReferenceLineRowProps) => {
  const handleLabelChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateReferenceLine(line.id, "label", e.target.value)
  }, [onUpdateReferenceLine, line.id])

  const handleXValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateReferenceLine(line.id, "xValue", e.target.value)
  }, [onUpdateReferenceLine, line.id])

  const handleYValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateReferenceLine(line.id, "yValue", e.target.value)
  }, [onUpdateReferenceLine, line.id])

  const handleAxisNoChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateReferenceLine(line.id, "axisNo", parseInt(e.target.value) || 1)
  }, [onUpdateReferenceLine, line.id])

  const handleRemove = useCallback(() => {
    onRemoveReferenceLine(line.id)
  }, [onRemoveReferenceLine, line.id])

  const handleStyleUpdate = useCallback((updates: Partial<ReferenceLine>) => {
    // Handle each update property appropriately
    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'labelStyle' && value && typeof value === 'object') {
        // For labelStyle, merge with existing values
        const currentLabelStyle = line.labelStyle || {}
        const mergedLabelStyle = { ...currentLabelStyle, ...value }
        onUpdateReferenceLine(line.id, 'labelStyle', mergedLabelStyle)
      } else {
        // For primitive values, update directly
        onUpdateReferenceLine(line.id, key as keyof ReferenceLineConfig, value)
      }
    })
  }, [onUpdateReferenceLine, line.id, line.labelStyle])

  return (
    <div className="flex gap-2 p-1">
      <div className="w-16">
        <div className="h-7 px-2 py-1 text-xs flex items-center">
          {line.type === "vertical" ? "V" : "H"}
        </div>
      </div>
      <div className="flex-1">
        <Input
          value={line.label}
          onChange={handleLabelChange}
          placeholder="Label"
          className="h-7 text-xs"
        />
      </div>
      <div className="w-40">
        {line.type === "vertical" ? (
          (editingChart.xAxisType || "datetime") === "datetime" ? (
            <Input
              type="datetime-local"
              value={line.xValue || ""}
              onChange={handleXValueChange}
              className="h-7 text-xs w-full [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          ) : (
            <Input
              type="number"
              step="any"
              value={line.xValue || ""}
              onChange={handleXValueChange}
              placeholder={(editingChart.xAxisType || "datetime") === "time" ? "Time(s)" : "X value"}
              className="h-7 text-xs"
            />
          )
        ) : (
          <Input
            type="number"
            step="any"
            value={line.yValue || ""}
            onChange={handleYValueChange}
            placeholder="Y value"
            className="h-7 text-xs"
          />
        )}
      </div>
      <div className="w-16">
        {line.type === "horizontal" ? (
          <Input
            type="number"
            min="1"
            max="10"
            value={line.axisNo || 1}
            onChange={handleAxisNoChange}
            className="h-7 text-xs"
          />
        ) : (
          <div className="h-7" />
        )}
      </div>
      <div className="w-7">
        <ReferenceLineStylePopover
          line={line}
          onUpdate={handleStyleUpdate}
        />
      </div>
      <div className="w-7">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="h-7 w-7 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
})