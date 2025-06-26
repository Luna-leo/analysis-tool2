"use client"

import React from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { PlotStyleRow, LegendMode, MarkerSettings, LineSettings, PlotStyle } from "@/types/plot-style"
import { PlotStylePopover } from "./PlotStylePopover"
import { LegendInput } from "./LegendInput"
import { Eye, EyeOff } from "lucide-react"

interface PlotStyleTableRowProps {
  row: PlotStyleRow
  mode: LegendMode
  plotStyle: PlotStyle
  onUpdateMarker: (marker: MarkerSettings) => void
  onUpdateLine: (line: LineSettings) => void
  onUpdateLegend: (legend: string) => void
  onUpdateVisibility: (visible: boolean) => void
}

export const PlotStyleTableRow = React.memo(({
  row,
  mode,
  plotStyle,
  onUpdateMarker,
  onUpdateLine,
  onUpdateLegend,
  onUpdateVisibility
}: PlotStyleTableRowProps) => {
  const isVisible = plotStyle.visible !== false // default to true if not specified

  return (
    <TableRow className={!isVisible ? "opacity-50" : ""}>
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
        <div className="space-y-1">
          <LegendInput
            value={plotStyle.legendText || row.legendText}
            onChange={onUpdateLegend}
            disabled={!isVisible}
          />
          {!isVisible && (
            <span className="text-[10px] text-muted-foreground">(非表示)</span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-xs">
        <div className={!isVisible ? "pointer-events-none" : ""}>
          <PlotStylePopover
            marker={plotStyle.marker}
            line={plotStyle.line}
            colorIndex={row.colorIndex}
            onUpdateMarker={onUpdateMarker}
            onUpdateLine={onUpdateLine}
          />
        </div>
      </TableCell>
      <TableCell className="text-xs">
        <button
          onClick={() => onUpdateVisibility(!isVisible)}
          className={`p-1.5 rounded transition-all ${
            isVisible 
              ? "hover:bg-accent text-foreground" 
              : "bg-muted hover:bg-muted-foreground/20 text-muted-foreground"
          }`}
          aria-label={isVisible ? "Hide plot" : "Show plot"}
          title={isVisible ? "クリックして非表示" : "クリックして表示"}
        >
          {isVisible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>
      </TableCell>
    </TableRow>
  )
})

PlotStyleTableRow.displayName = "PlotStyleTableRow"