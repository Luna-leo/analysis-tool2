"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { ChartComponent } from "@/types"
import { ReferenceLineRangePopover } from "./ReferenceLineRangePopover"

export interface ReferenceLineConfig {
  id: string
  type: "vertical" | "horizontal"
  label: string
  xValue?: string
  yValue?: string
  axisNo?: number
  yRange?: {
    auto: boolean
    min: string
    max: string
  }
  xRange?: {
    auto: boolean
    min: string
    max: string
  }
}

interface ReferenceLineRowProps {
  line: ReferenceLineConfig
  editingChart: ChartComponent
  onUpdateReferenceLine: (id: string, field: keyof ReferenceLineConfig, value: any) => void
  onUpdateRange: (
    id: string,
    rangeType: 'xRange' | 'yRange',
    field: keyof NonNullable<ReferenceLineConfig['xRange']> | keyof NonNullable<ReferenceLineConfig['yRange']>,
    value: any
  ) => void
  onRemoveReferenceLine: (id: string) => void
}

export function ReferenceLineRow({
  line,
  editingChart,
  onUpdateReferenceLine,
  onUpdateRange,
  onRemoveReferenceLine
}: ReferenceLineRowProps) {
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
          onChange={(e) => onUpdateReferenceLine(line.id, "label", e.target.value)}
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
              onChange={(e) => onUpdateReferenceLine(line.id, "xValue", e.target.value)}
              className="h-7 text-xs w-full [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          ) : (
            <Input
              type="number"
              value={line.xValue || ""}
              onChange={(e) => onUpdateReferenceLine(line.id, "xValue", e.target.value)}
              placeholder={(editingChart.xAxisType || "datetime") === "time" ? "Time(s)" : "X value"}
              className="h-7 text-xs"
            />
          )
        ) : (
          <Input
            type="number"
            value={line.yValue || ""}
            onChange={(e) => onUpdateReferenceLine(line.id, "yValue", e.target.value)}
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
            onChange={(e) => onUpdateReferenceLine(line.id, "axisNo", parseInt(e.target.value) || 1)}
            className="h-7 text-xs"
          />
        ) : (
          <div className="h-7" />
        )}
      </div>
      <div className="w-24">
        <ReferenceLineRangePopover
          line={line}
          editingChart={editingChart}
          onUpdateRange={onUpdateRange}
        />
      </div>
      <div className="w-7">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemoveReferenceLine(line.id)}
          className="h-7 w-7 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}