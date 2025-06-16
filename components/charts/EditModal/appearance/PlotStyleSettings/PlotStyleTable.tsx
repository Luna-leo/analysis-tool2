"use client"

import React, { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { ChartComponent } from "@/types"
import { LegendMode } from "@/types/plot-style"
import { PlotStyleTableRow } from "./PlotStyleTableRow"
import { usePlotStyleRows } from "./hooks/usePlotStyleRows"
import { usePlotStyleUpdate } from "./hooks/usePlotStyleUpdate"
import { getDefaultColor } from "@/utils/chartColors"

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
    initializeDefaultStylesForMode,
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
    
    // Check if we need to initialize default styles for the new mode
    const needsInitialization = (
      (newMode === 'datasource' && (!editingChart.plotStyles?.byDataSource || Object.keys(editingChart.plotStyles.byDataSource).length === 0)) ||
      (newMode === 'parameter' && (!editingChart.plotStyles?.byParameter || Object.keys(editingChart.plotStyles.byParameter).length === 0)) ||
      (newMode === 'both' && (!editingChart.plotStyles?.byBoth || Object.keys(editingChart.plotStyles.byBoth).length === 0))
    )
    
    if (needsInitialization) {
      const newStyles = initializeDefaultStylesForMode(
        newMode,
        selectedDataSourceItems,
        editingChart.yAxisParams || []
      )
      setEditingChart({
        ...editingChart,
        legendMode: newMode,
        plotStyles: newStyles
      })
    } else {
      updateMode(newMode)
    }
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
    <div className="space-y-4 px-4">
      {/* Plot Display Options */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium w-20">Plot</Label>
        <div className="flex items-center gap-6 flex-1">
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-markers"
              checked={editingChart.showMarkers ?? true}
              onCheckedChange={(checked) => {
                setEditingChart({
                  ...editingChart,
                  showMarkers: checked,
                })
              }}
            />
            <Label htmlFor="show-markers" className="text-sm cursor-pointer">Markers</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="show-lines"
              checked={editingChart.showLines ?? false}
              onCheckedChange={(checked) => {
                setEditingChart({
                  ...editingChart,
                  showLines: checked,
                })
              }}
            />
            <Label htmlFor="show-lines" className="text-sm cursor-pointer">Lines</Label>
          </div>
        </div>
      </div>

      {/* Plot Style Settings Table */}
      <div>
        <div className="flex items-center justify-between mb-2 px-0">
          <Label className="text-sm font-medium">Style Settings</Label>
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
                let plotStyle = getPlotStyle(dataSourceId, dataSourceIndex, paramIndex)
                
                // Ensure plotStyle has valid marker and line properties
                if (!plotStyle || !plotStyle.marker || !plotStyle.line) {
                  const defaultColor = getDefaultColor(mode === 'parameter' ? paramIndex : dataSourceIndex)
                  plotStyle = {
                    marker: plotStyle?.marker || {
                      type: 'circle',
                      size: 6,
                      borderColor: defaultColor,
                      fillColor: defaultColor
                    },
                    line: plotStyle?.line || {
                      style: 'solid',
                      width: 2,
                      color: defaultColor
                    },
                    legendText: plotStyle?.legendText || row.legendText
                  }
                  }
                  
                  return (
                    <PlotStyleTableRow
                      key={row.id}
                      row={row}
                      mode={mode}
                      plotStyle={plotStyle}
                      onUpdateMarker={(marker) => updateMarkerStyle(dataSourceId, dataSourceIndex, paramIndex, marker)}
                      onUpdateLine={(line) => updateLineStyle(dataSourceId, dataSourceIndex, paramIndex, line)}
                      onUpdateLegend={(legend) => updateLegend(dataSourceId, dataSourceIndex, paramIndex, legend)}
                    />
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}