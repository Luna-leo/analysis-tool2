"use client"

import React, { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartComponent } from "@/types"
import { LegendMode } from "@/types/plot-style"
import { PlotStyleTableRow } from "./PlotStyleTableRow"
import { usePlotStyleRows } from "./hooks/usePlotStyleRows"
import { usePlotStyleUpdate } from "./hooks/usePlotStyleUpdate"

interface PlotStyleTableProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
  selectedDataSourceItems: { 
    id: string
    plant: string
    machineNo: string
    label: string
    labelDescription?: string 
  }[]
}

export function PlotStyleTable({ 
  editingChart, 
  setEditingChart, 
  selectedDataSourceItems 
}: PlotStyleTableProps) {
  const mode = editingChart.plotStyles?.mode || editingChart.legendMode || "datasource"
  
  const {
    initializePlotStyles,
    getPlotStyle,
    updateMarkerStyle,
    updateLineStyle,
    updateLegend,
    updateMode
  } = usePlotStyleUpdate(editingChart, setEditingChart)

  const rows = usePlotStyleRows(
    editingChart, 
    selectedDataSourceItems, 
    mode,
    getPlotStyle
  )

  // Initialize plotStyles on mount
  useEffect(() => {
    initializePlotStyles()
  }, [])

  const handleModeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMode = e.target.value as LegendMode
    updateMode(newMode)
  }

  const getTableHeaders = () => {
    const headers = []
    if (mode !== "parameter") headers.push("Data Source")
    if (mode !== "datasource") headers.push("Parameter")
    headers.push("Legend", "Plot Style")
    return headers
  }

  const colSpan = mode === "both" ? 4 : 3

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm">Plot Style Settings</Label>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Mode</Label>
          <select
            className="h-7 text-xs border rounded-md px-2"
            value={mode}
            onChange={handleModeChange}
          >
            <option value="datasource">By Data Source</option>
            <option value="parameter">By Parameter</option>
            <option value="both">By Data Source x Parameter</option>
          </select>
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {getTableHeaders().map((header) => (
                <TableHead key={header} className="text-xs">{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="text-center text-xs text-muted-foreground py-4">
                  {selectedDataSourceItems.length === 0 
                    ? "No data sources selected. Please select data sources in the DataSource tab."
                    : "No Y parameters configured. Please add parameters in the Parameters tab."}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const dataSourceId = row.dataSource?.id || ''
                const dataSourceIndex = row.dataSourceIndex || 0
                const paramIndex = row.paramIndex
                const plotStyle = getPlotStyle(dataSourceId, dataSourceIndex, paramIndex)
                
                return (
                  <PlotStyleTableRow
                    key={row.id}
                    row={row}
                    mode={mode}
                    plotStyle={plotStyle}
                    onUpdateMarker={(marker) => updateMarkerStyle(dataSourceId, paramIndex, marker)}
                    onUpdateLine={(line) => updateLineStyle(dataSourceId, paramIndex, line)}
                    onUpdateLegend={(legend) => updateLegend(dataSourceId, paramIndex, legend)}
                  />
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}