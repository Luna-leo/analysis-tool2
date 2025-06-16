"use client"

import React from "react"
import { EventInfo, DataSourceStyle, ChartComponent } from "@/types"
import { DataSourceBadgePreview } from "./DataSourceBadgePreview"
import { getDefaultColor } from "@/utils/chartColors"
import { cn } from "@/lib/utils"

interface ChartLegendProps {
  editingChart: ChartComponent
  dataSources: EventInfo[]
  dataSourceStyles?: { [dataSourceId: string]: DataSourceStyle }
  className?: string
  style?: React.CSSProperties
  onPointerDown?: React.PointerEventHandler<HTMLDivElement>
}

export const ChartLegend = React.memo(
  React.forwardRef<HTMLDivElement, ChartLegendProps>(
    ({
      editingChart,
      dataSources,
      dataSourceStyles = {},
      className,
      style,
      onPointerDown
    }, ref) => {
      if (!dataSources || dataSources.length === 0) return null

      const mode = editingChart.plotStyles?.mode || editingChart.legendMode || 'datasource'
      const items: { key: string; label: string; colorIndex: number; dsId?: string }[] = []

      if (mode === 'datasource') {
        dataSources.forEach((ds, idx) => {
          const plotStyle = editingChart.plotStyles?.byDataSource?.[ds.id]
          const customLabel = plotStyle?.legendText
          const defaultLabel = ds.labelDescription ? `${ds.label} (${ds.labelDescription})` : ds.label
          items.push({ key: ds.id, label: customLabel || defaultLabel, colorIndex: idx, dsId: ds.id })
        })
      } else if (mode === 'parameter') {
        editingChart.yAxisParams?.forEach((param, idx) => {
          const plotStyle = editingChart.plotStyles?.byParameter?.[idx]
          const customLabel = plotStyle?.legendText
          items.push({ key: `param-${idx}`, label: customLabel || param.parameter || 'Unnamed', colorIndex: idx })
        })
      } else {
        dataSources.forEach((ds, dsIdx) => {
          editingChart.yAxisParams?.forEach((param, pIdx) => {
            const key = `${ds.id}-${pIdx}`
            const plotStyle = editingChart.plotStyles?.byBoth?.[key]
            const customLabel = plotStyle?.legendText
            const defaultLabel = `${ds.label}-${param.parameter || 'Unnamed'}`
            items.push({
              key,
              label: customLabel || defaultLabel,
              colorIndex: dsIdx,
              dsId: ds.id
            })
          })
        })
      }

      return (
        <div
          ref={ref}
          style={style}
          onPointerDown={onPointerDown}
          className={cn(
            "bg-white/80 rounded shadow p-1 text-[10px] space-y-1",
            className
          )}
        >
          {items.map((item) => (
            <div key={item.key} className="flex items-center gap-1 whitespace-nowrap">
              <DataSourceBadgePreview
                dataSourceStyle={item.dsId ? dataSourceStyles[item.dsId] : undefined}
                defaultColor={getDefaultColor(item.colorIndex)}
              />
              <span className="font-medium text-black">{item.label}</span>
            </div>
          ))}
        </div>
      )
    }
  )
)

ChartLegend.displayName = "ChartLegend"
