"use client"

import React from "react"
import { ChartComponent, EventInfo } from "@/types"

interface ChartPreviewInfoProps {
  editingChart: ChartComponent
  selectedDataSourceItems: EventInfo[]
}

export const ChartPreviewInfo = React.memo(({ editingChart, selectedDataSourceItems }: ChartPreviewInfoProps) => {
  return (
    <div className="mt-2 space-y-2">
      <div className="p-2 bg-muted/30 rounded text-xs">
        <div className="font-medium mb-1">Data Sources:</div>
        {selectedDataSourceItems.length > 0 ? (
          selectedDataSourceItems.map((item, index) => (
            <div key={item.id} className="text-muted-foreground">
              {index + 1}. {item.plant} - {item.machineNo} ({item.label})
            </div>
          ))
        ) : (
          <div className="text-muted-foreground">Not set</div>
        )}
      </div>

      {/* Range Settings Display */}
      <div className="p-2 bg-muted/30 rounded text-xs">
        <div className="font-medium mb-1">Range Settings:</div>
        <div className="space-y-1 text-muted-foreground">
          <div>
            <span className="font-medium">X-Axis ({editingChart.xAxisType || "datetime"}):</span>
            {editingChart.xAxisRange?.auto !== false ? (
              <span className="ml-1">Auto</span>
            ) : (
              <span className="ml-1">
                {(editingChart.xAxisType || "datetime") === "datetime" ? (
                  `${editingChart.xAxisRange.min || "Not set"} ~ ${editingChart.xAxisRange.max || "Not set"}`
                ) : (
                  `${editingChart.xAxisRange.min || 0} - ${editingChart.xAxisRange.max || 100}`
                )}
              </span>
            )}
          </div>

          {editingChart.yAxisParams && editingChart.yAxisParams.length > 0 ? (
            (() => {
              const groupedByAxis: Record<number, typeof editingChart.yAxisParams> = {}
              editingChart.yAxisParams.forEach(param => {
                const axisNo = param.axisNo || 1
                if (!groupedByAxis[axisNo]) groupedByAxis[axisNo] = []
                groupedByAxis[axisNo].push(param)
              })

              return Object.entries(groupedByAxis).map(([axisNo, params]) => {
                const firstParam = params[0]
                const axisLabel = editingChart.yAxisLabels?.[parseInt(axisNo)] || `Axis ${axisNo}`

                return (
                  <div key={axisNo}>
                    <span className="font-medium">Y-Axis {axisNo} ({axisLabel}):</span>
                    {firstParam.range?.auto !== false ? (
                      <span className="ml-1">Auto</span>
                    ) : (
                      <span className="ml-1">
                        {firstParam.range.min || 0} - {firstParam.range.max || 100}
                      </span>
                    )}
                  </div>
                )
              })
            })()
          ) : (
            <div>
              <span className="font-medium">Y-Axis:</span>
              <span className="ml-1">Auto</span>
            </div>
          )}
        </div>
      </div>

      {/* Y Parameter Settings Display */}
      <div className="p-2 bg-muted/30 rounded text-xs">
        <div className="font-medium mb-1">Y Parameter Settings:</div>
        {editingChart.yAxisParams && editingChart.yAxisParams.length > 0 ? (
          <div className="space-y-1 text-muted-foreground">
            {editingChart.yAxisParams.map((param, index) => (
              <div key={index} className="flex flex-col space-y-1">
                <div>
                  <span className="font-medium">{param.parameter || `Parameter ${index + 1}`}</span>
                  <span className="ml-2">Axis {param.axisNo || 1}</span>
                </div>
                <div className="ml-2 flex flex-wrap gap-2 text-[10px]">
                  {param.line?.color ? (
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded" style={{ backgroundColor: param.line.color }} />
                      Color
                    </span>
                  ) : (
                    <span>Color: Not set</span>
                  )}
                  {param.line?.width ? (
                    <span>Width: {param.line.width}px</span>
                  ) : (
                    <span>Width: Not set</span>
                  )}
                  {param.range && !param.range.auto ? (
                    <span>Range: {param.range.min || 0} - {param.range.max || 100}</span>
                  ) : param.range?.auto ? (
                    <span>Range: Auto</span>
                  ) : (
                    <span>Range: Not set</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground">Not set</div>
        )}
      </div>
    </div>
  )
})
