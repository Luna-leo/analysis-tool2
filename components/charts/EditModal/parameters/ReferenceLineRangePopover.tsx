"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ChartComponent } from "@/types"
import { ReferenceLineConfig } from "./ReferenceLineRow"

interface ReferenceLineRangePopoverProps {
  line: ReferenceLineConfig
  editingChart: ChartComponent
  onUpdateRange: (
    id: string,
    rangeType: 'xRange' | 'yRange',
    field: keyof NonNullable<ReferenceLineConfig['xRange']> | keyof NonNullable<ReferenceLineConfig['yRange']>,
    value: any
  ) => void
}

export function ReferenceLineRangePopover({
  line,
  editingChart,
  onUpdateRange
}: ReferenceLineRangePopoverProps) {
  if (line.type === "vertical") {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="h-7 w-full justify-start text-xs"
            title={line.yRange?.auto ? "Auto range based on data" : `Min: ${line.yRange?.min || 0}, Max: ${line.yRange?.max || 100}`}
          >
            {line.yRange?.auto ? "Range: Auto" : "Range: Custom"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`y-auto-${line.id}`}
                checked={line.yRange?.auto ?? true}
                onCheckedChange={(checked) => onUpdateRange(line.id, 'yRange', 'auto', !!checked)}
              />
              <Label htmlFor={`y-auto-${line.id}`} className="text-sm">Auto Range</Label>
            </div>
            <div className="space-y-2">
              <div>
                <Label htmlFor={`y-min-${line.id}`} className="text-xs">Min Value</Label>
                <Input
                  id={`y-min-${line.id}`}
                  type="number"
                  step="any"
                  value={line.yRange?.min || "0"}
                  onChange={(e) => onUpdateRange(line.id, 'yRange', 'min', e.target.value)}
                  disabled={line.yRange?.auto ?? true}
                  className="h-8"
                />
              </div>
              <div>
                <Label htmlFor={`y-max-${line.id}`} className="text-xs">Max Value</Label>
                <Input
                  id={`y-max-${line.id}`}
                  type="number"
                  step="any"
                  value={line.yRange?.max || "100"}
                  onChange={(e) => onUpdateRange(line.id, 'yRange', 'max', e.target.value)}
                  disabled={line.yRange?.auto ?? true}
                  className="h-8"
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  } else {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="h-7 w-full justify-start text-xs"
            title={line.xRange?.auto ? "Auto range based on data" : `Min: ${line.xRange?.min || "Not set"}, Max: ${line.xRange?.max || "Not set"}`}
          >
            {line.xRange?.auto ? "Range: Auto" : "Range: Custom"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`x-auto-${line.id}`}
                checked={line.xRange?.auto ?? true}
                onCheckedChange={(checked) => onUpdateRange(line.id, 'xRange', 'auto', !!checked)}
              />
              <Label htmlFor={`x-auto-${line.id}`} className="text-sm">Auto Range</Label>
            </div>
            <div className="space-y-2">
              <div>
                <Label htmlFor={`x-min-${line.id}`} className="text-xs">Min Value</Label>
                {(editingChart.xAxisType || "datetime") === "datetime" ? (
                  <Input
                    id={`x-min-${line.id}`}
                    type="datetime-local"
                    value={line.xRange?.min || ""}
                    onChange={(e) => onUpdateRange(line.id, 'xRange', 'min', e.target.value)}
                    disabled={line.xRange?.auto ?? true}
                    className="h-8 [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                ) : (
                  <Input
                    id={`x-min-${line.id}`}
                    type="number"
                    step="any"
                    value={line.xRange?.min || "0"}
                    onChange={(e) => onUpdateRange(line.id, 'xRange', 'min', e.target.value)}
                    disabled={line.xRange?.auto ?? true}
                    placeholder={(editingChart.xAxisType || "datetime") === "time" ? "Start(s)" : "Min"}
                    className="h-8"
                  />
                )}
              </div>
              <div>
                <Label htmlFor={`x-max-${line.id}`} className="text-xs">Max Value</Label>
                {(editingChart.xAxisType || "datetime") === "datetime" ? (
                  <Input
                    id={`x-max-${line.id}`}
                    type="datetime-local"
                    value={line.xRange?.max || ""}
                    onChange={(e) => onUpdateRange(line.id, 'xRange', 'max', e.target.value)}
                    disabled={line.xRange?.auto ?? true}
                    className="h-8 [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                ) : (
                  <Input
                    id={`x-max-${line.id}`}
                    type="number"
                    step="any"
                    value={line.xRange?.max || "100"}
                    onChange={(e) => onUpdateRange(line.id, 'xRange', 'max', e.target.value)}
                    disabled={line.xRange?.auto ?? true}
                    placeholder={(editingChart.xAxisType || "datetime") === "time" ? "End(s)" : "Max"}
                    className="h-8"
                  />
                )}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }
}