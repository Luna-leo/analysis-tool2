"use client"

import React from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlotStyleRow, LegendMode, MarkerSettings, LineSettings } from "@/types/plot-style"
import { PlotStylePopover } from "./PlotStylePopover"
import { LegendInput } from "./LegendInput"

interface PlotStyleTableRowProps {
  row: PlotStyleRow
  mode: LegendMode
  onUpdateMarker: (marker: MarkerSettings) => void
  onUpdateLine: (line: LineSettings) => void
  onUpdateLegend: (legend: string) => void
}

export const PlotStyleTableRow = React.memo(({
  row,
  mode,
  onUpdateMarker,
  onUpdateLine,
  onUpdateLegend
}: PlotStyleTableRowProps) => {
  return (
    <TableRow>
      {mode !== "parameter" && row.dataSource && (
        <TableCell className="text-xs">
          <div>
            <div className="font-medium">{row.dataSource.plant} - {row.dataSource.machineNo}</div>
            <div className="text-muted-foreground">
              {row.dataSource.labelDescription 
                ? `${row.dataSource.label} (${row.dataSource.labelDescription})` 
                : row.dataSource.label}
            </div>
          </div>
        </TableCell>
      )}
      {mode !== "datasource" && row.parameter && (
        <TableCell className="text-xs">
          <div>
            <div className="font-medium flex items-center gap-1">
              {row.parameter.parameter || "Unnamed"}
              {row.parameter.parameterType === "Formula" && (
                <Badge variant="secondary" className="text-[10px] px-1 h-4">Formula</Badge>
              )}
            </div>
            <div className="text-muted-foreground">Axis {row.parameter.axisNo || 1}</div>
          </div>
        </TableCell>
      )}
      <TableCell className="text-xs">
        <LegendInput
          value={row.legendText}
          onChange={onUpdateLegend}
        />
      </TableCell>
      <TableCell className="text-xs">
        <PlotStylePopover
          marker={row.parameter?.marker}
          line={row.parameter?.line}
          colorIndex={row.colorIndex}
          onUpdateMarker={onUpdateMarker}
          onUpdateLine={onUpdateLine}
        />
      </TableCell>
    </TableRow>
  )
})

PlotStyleTableRow.displayName = "PlotStyleTableRow"