"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ChartComponent, EventInfo } from "@/types"
import { formatDateTimeForInput, formatDateTimeForDisplay, calculateOverallTimeRange } from "@/utils/dateTimeUtils"

interface DateTimeRangeSettingsProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
  selectedDataSourceItems?: EventInfo[]
  disabled: boolean
}

export function DateTimeRangeSettings({ 
  editingChart, 
  setEditingChart, 
  selectedDataSourceItems,
  disabled 
}: DateTimeRangeSettingsProps) {
  const setRangeFromDataSource = () => {
    const timeRange = calculateOverallTimeRange(selectedDataSourceItems || [])
    if (!timeRange) {
      console.warn('Invalid date ranges in data source items')
      return
    }

    const startTime = formatDateTimeForInput(timeRange.earliestStart.toISOString())
    const endTime = formatDateTimeForInput(timeRange.latestEnd.toISOString())

    setEditingChart({
      ...editingChart,
      xAxisRange: {
        auto: false,
        min: startTime,
        max: endTime,
        unit: editingChart.xAxisRange?.unit || "sec"
      }
    })
  }

  return (
    <>
      {selectedDataSourceItems && selectedDataSourceItems.length > 0 && (editingChart.xAxisType || "datetime") === "datetime" && (
        <div className="pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={setRangeFromDataSource}
            className="w-full h-8 text-xs"
          >
            Auto from DataSource{selectedDataSourceItems.length > 1 ? 's' : ''}
          </Button>
          <p className="text-xs text-muted-foreground mt-1">
            {(() => {
              const timeRange = calculateOverallTimeRange(selectedDataSourceItems)
              if (timeRange && timeRange.earliestStart && timeRange.latestEnd) {
                try {
                  return `Set range from: ${formatDateTimeForDisplay((timeRange.earliestStart as Date).toISOString())} ~ ${formatDateTimeForDisplay((timeRange.latestEnd as Date).toISOString())}`
                } catch {
                  return "Set range from DataSource period"
                }
              }
              return "Set range from DataSource period"
            })()}
            {selectedDataSourceItems.length > 1 && (
              <span className="block text-[10px] text-muted-foreground/60 mt-0.5">
                ({selectedDataSourceItems.length} data sources)
              </span>
            )}
          </p>
        </div>
      )}
      
      <div className="space-y-2">
        <div>
          <Label htmlFor="x-min" className="text-xs">Min Value</Label>
          <Input
            id="x-min"
            type="datetime-local"
            value={editingChart.xAxisRange?.min || ""}
            onChange={(e) => {
              setEditingChart({
                ...editingChart,
                xAxisRange: {
                  ...editingChart.xAxisRange,
                  min: e.target.value,
                  max: editingChart.xAxisRange?.max || "",
                  auto: editingChart.xAxisRange?.auto !== false,
                }
              })
            }}
            disabled={disabled}
            className="h-8 [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          />
        </div>
        <div>
          <Label htmlFor="x-max" className="text-xs">Max Value</Label>
          <Input
            id="x-max"
            type="datetime-local"
            value={editingChart.xAxisRange?.max || ""}
            onChange={(e) => {
              setEditingChart({
                ...editingChart,
                xAxisRange: {
                  ...editingChart.xAxisRange,
                  min: editingChart.xAxisRange?.min || "",
                  max: e.target.value,
                  auto: editingChart.xAxisRange?.auto !== false,
                }
              })
            }}
            disabled={disabled}
            className="h-8 [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          />
        </div>
      </div>
    </>
  )
}