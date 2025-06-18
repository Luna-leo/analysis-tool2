"use client"

import React from "react"
import { EventInfo, DataSourceStyle, ChartComponent } from "@/types"
import { DataSourceBadgePreview } from "./DataSourceBadgePreview"
import { PlotStyleBadge } from "./PlotStyleBadge"
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
      const items: { key: string; label: string; colorIndex: number; dsId?: string; plotStyle?: any }[] = []

      if (mode === 'datasource') {
        dataSources.forEach((ds, idx) => {
          const plotStyle = editingChart.plotStyles?.byDataSource?.[ds.id]
          const customLabel = plotStyle?.legendText
          const defaultLabel = ds.labelDescription ? `${ds.label} (${ds.labelDescription})` : ds.label
          items.push({ 
            key: ds.id, 
            label: customLabel || defaultLabel, 
            colorIndex: idx, 
            dsId: ds.id,
            plotStyle 
          })
        })
      } else if (mode === 'parameter') {
        editingChart.yAxisParams?.forEach((param, idx) => {
          const plotStyle = editingChart.plotStyles?.byParameter?.[idx]
          const customLabel = plotStyle?.legendText
          items.push({ 
            key: `param-${idx}`, 
            label: customLabel || param.parameter || 'Unnamed', 
            colorIndex: idx,
            plotStyle 
          })
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
              dsId: ds.id,
              plotStyle
            })
          })
        })
      }

      return (
        <div
          ref={ref}
          style={style}
          onPointerDown={onPointerDown}
          data-legend="true"
          className={cn(
            "bg-white/80 rounded shadow p-1 text-[10px] space-y-1 pointer-events-auto",
            className
          )}
        >
          {items.map((item) => {
            const isHidden = item.plotStyle?.visible === false
            // Use PlotStyleBadge if plotStyle is available (even partially)
            if (item.plotStyle) {
              // Ensure plotStyle has required properties with defaults
              const defaultColor = getDefaultColor(item.colorIndex)
              const completeStyle = {
                marker: item.plotStyle.marker || {
                  type: 'circle' as const,
                  size: 6,
                  borderColor: defaultColor,
                  fillColor: defaultColor
                },
                line: item.plotStyle.line || {
                  style: 'solid' as const,
                  width: 2,
                  color: defaultColor
                },
                legendText: item.plotStyle.legendText || item.label
              }
              return (
                <div key={item.key} className={cn(
                  "flex items-center gap-1 whitespace-nowrap",
                  isHidden && "opacity-40"
                )}>
                  <PlotStyleBadge 
                    plotStyle={completeStyle} 
                    showLines={editingChart.showLines ?? false}
                    showMarkers={editingChart.showMarkers ?? true}
                  />
                  <span className={cn(
                    "font-medium",
                    isHidden ? "text-black/60" : "text-black"
                  )}>{item.label}</span>
                </div>
              )
            }
            // Fallback to DataSourceBadgePreview for backward compatibility
            return (
              <div key={item.key} className="flex items-center gap-1 whitespace-nowrap">
                <DataSourceBadgePreview
                  dataSourceStyle={item.dsId ? dataSourceStyles[item.dsId] : undefined}
                  defaultColor={getDefaultColor(item.colorIndex)}
                />
                <span className="font-medium text-black">{item.label}</span>
              </div>
            )
          })}
        </div>
      )
    }
  )
)

ChartLegend.displayName = "ChartLegend"
