"use client"

import React from "react"
import { EventInfo, DataSourceStyle } from "@/types"
import { DataSourceBadgePreview } from "./DataSourceBadgePreview"
import { getDefaultColor } from "@/utils/chartColors"
import { cn } from "@/lib/utils"

interface ChartLegendProps {
  dataSources: EventInfo[]
  dataSourceStyles?: { [dataSourceId: string]: DataSourceStyle }
  className?: string
  style?: React.CSSProperties
  onPointerDown?: React.PointerEventHandler<HTMLDivElement>
}

export const ChartLegend = React.memo(
  React.forwardRef<HTMLDivElement, ChartLegendProps>(
    ({
      dataSources,
      dataSourceStyles = {},
      className,
      style,
      onPointerDown
    }, ref) => {
      if (!dataSources || dataSources.length === 0) return null

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
          {dataSources.map((source, index) => (
            <div key={source.id} className="flex items-center gap-1 whitespace-nowrap">
              <DataSourceBadgePreview
                dataSourceStyle={dataSourceStyles[source.id]}
                defaultColor={getDefaultColor(index)}
              />
              <span className="font-medium text-black">{source.label}</span>
            </div>
          ))}
        </div>
      )
    }
  )
)

ChartLegend.displayName = "ChartLegend"
