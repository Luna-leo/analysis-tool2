"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartComponent, MarkerType, LineStyle } from "@/types"

interface PlotStyleTableProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
  selectedDataSourceItems: { id: string; plant: string; machineNo: string; label: string; labelDescription?: string }[]
}

export function PlotStyleTable({ editingChart, setEditingChart, selectedDataSourceItems }: PlotStyleTableProps) {
  const [appearanceMode, setAppearanceMode] = useState<"datasource" | "parameter" | "both">(
    editingChart.legendMode || "both"
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className="text-sm">Plot Style Settings</Label>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Mode</Label>
          <select
            className="h-7 text-xs border rounded-md px-2"
            value={appearanceMode}
            onChange={(e) => {
              const mode = e.target.value as "datasource" | "parameter" | "both"
              setAppearanceMode(mode)
              setEditingChart({ ...editingChart, legendMode: mode })
            }}
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
              {appearanceMode !== "parameter" && (
                <TableHead className="text-xs">Data Source</TableHead>
              )}
              {appearanceMode !== "datasource" && (
                <TableHead className="text-xs">Parameter</TableHead>
              )}
              <TableHead className="text-xs">Marker</TableHead>
              <TableHead className="text-xs">Line</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedDataSourceItems.length > 0 && editingChart.yAxisParams && editingChart.yAxisParams.length > 0 ? (
              selectedDataSourceItems.flatMap((dataSource) =>
                editingChart.yAxisParams?.map((param, paramIndex) => {
                  const key = `${dataSource.id}-${paramIndex}`
                  return (
                    <TableRow key={key}>
                      {appearanceMode !== "parameter" && (
                        <TableCell className="text-xs">
                          <div>
                            <div className="font-medium">{dataSource.plant} - {dataSource.machineNo}</div>
                            <div className="text-muted-foreground">
                              {dataSource.labelDescription ? `${dataSource.label} (${dataSource.labelDescription})` : dataSource.label}
                            </div>
                          </div>
                        </TableCell>
                      )}
                      {appearanceMode !== "datasource" && (
                        <TableCell className="text-xs">
                          <div>
                            <div className="font-medium flex items-center gap-1">
                              {param.parameter || "Unnamed"}
                              {param.parameterType === "Formula" && (
                                <Badge variant="secondary" className="text-[10px] px-1 h-4">Formula</Badge>
                              )}
                            </div>
                            <div className="text-muted-foreground">Axis {param.axisNo || 1}</div>
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="h-7 text-xs">
                                <div className="flex items-center gap-1">
                                  <div 
                                    className="w-3 h-3 border rounded-full" 
                                    style={{
                                      backgroundColor: param.marker?.fillColor || "#0066cc",
                                      borderColor: param.marker?.borderColor || "#0066cc"
                                    }}
                                  />
                                  <span>{param.marker?.type || "circle"}</span>
                                </div>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium">Marker Settings</h4>
                                
                                <div>
                                  <Label className="text-xs">Type</Label>
                                  <select
                                    value={param.marker?.type || "circle"}
                                    onChange={(e) => {
                                      const newParams = [...(editingChart.yAxisParams || [])]
                                      newParams[paramIndex] = {
                                        ...newParams[paramIndex],
                                        marker: {
                                          ...newParams[paramIndex].marker,
                                          type: e.target.value as MarkerType,
                                          size: newParams[paramIndex].marker?.size || 6,
                                          borderColor: newParams[paramIndex].marker?.borderColor || "#0066cc",
                                          fillColor: newParams[paramIndex].marker?.fillColor || "#0066cc"
                                        }
                                      }
                                      setEditingChart({ ...editingChart, yAxisParams: newParams })
                                    }}
                                    className="w-full h-7 px-2 py-1 border rounded-md text-xs"
                                  >
                                    <option value="circle">Circle</option>
                                    <option value="square">Square</option>
                                    <option value="triangle">Triangle</option>
                                    <option value="diamond">Diamond</option>
                                    <option value="star">Star</option>
                                    <option value="cross">Cross</option>
                                  </select>
                                </div>
                                
                                <div>
                                  <Label className="text-xs">Size</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={param.marker?.size || 6}
                                    onChange={(e) => {
                                      const newParams = [...(editingChart.yAxisParams || [])]
                                      newParams[paramIndex] = {
                                        ...newParams[paramIndex],
                                        marker: {
                                          ...newParams[paramIndex].marker,
                                          type: newParams[paramIndex].marker?.type || "circle",
                                          size: parseInt(e.target.value) || 6,
                                          borderColor: newParams[paramIndex].marker?.borderColor || "#0066cc",
                                          fillColor: newParams[paramIndex].marker?.fillColor || "#0066cc"
                                        }
                                      }
                                      setEditingChart({ ...editingChart, yAxisParams: newParams })
                                    }}
                                    className="h-7 text-xs"
                                  />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs">Border Color</Label>
                                    <Input
                                      type="color"
                                      value={param.marker?.borderColor || "#0066cc"}
                                      onChange={(e) => {
                                        const newParams = [...(editingChart.yAxisParams || [])]
                                        newParams[paramIndex] = {
                                          ...newParams[paramIndex],
                                          marker: {
                                            ...newParams[paramIndex].marker,
                                            type: newParams[paramIndex].marker?.type || "circle",
                                            size: newParams[paramIndex].marker?.size || 6,
                                            borderColor: e.target.value,
                                            fillColor: newParams[paramIndex].marker?.fillColor || "#0066cc"
                                          }
                                        }
                                        setEditingChart({ ...editingChart, yAxisParams: newParams })
                                      }}
                                      className="h-7 w-full"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs">Fill Color</Label>
                                    <Input
                                      type="color"
                                      value={param.marker?.fillColor || "#0066cc"}
                                      onChange={(e) => {
                                        const newParams = [...(editingChart.yAxisParams || [])]
                                        newParams[paramIndex] = {
                                          ...newParams[paramIndex],
                                          marker: {
                                            ...newParams[paramIndex].marker,
                                            type: newParams[paramIndex].marker?.type || "circle",
                                            size: newParams[paramIndex].marker?.size || 6,
                                            borderColor: newParams[paramIndex].marker?.borderColor || "#0066cc",
                                            fillColor: e.target.value
                                          }
                                        }
                                        setEditingChart({ ...editingChart, yAxisParams: newParams })
                                      }}
                                      className="h-7 w-full"
                                    />
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="h-7 text-xs">
                                <div className="flex items-center gap-1">
                                  <div 
                                    className="w-4 h-0 border-b-2"
                                    style={{
                                      borderColor: param.line?.color || "#0066cc",
                                      borderStyle: param.line?.style || "solid"
                                    }}
                                  />
                                  <span>{param.line?.style || "solid"}</span>
                                </div>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <div className="space-y-3">
                                <h4 className="text-sm font-medium">Line Settings</h4>
                                
                                <div>
                                  <Label className="text-xs">Style</Label>
                                  <select
                                    value={param.line?.style || "solid"}
                                    onChange={(e) => {
                                      const newParams = [...(editingChart.yAxisParams || [])]
                                      newParams[paramIndex] = {
                                        ...newParams[paramIndex],
                                        line: {
                                          ...newParams[paramIndex].line,
                                          style: e.target.value as LineStyle,
                                          width: newParams[paramIndex].line?.width || 2,
                                          color: newParams[paramIndex].line?.color || "#0066cc"
                                        }
                                      }
                                      setEditingChart({ ...editingChart, yAxisParams: newParams })
                                    }}
                                    className="w-full h-7 px-2 py-1 border rounded-md text-xs"
                                  >
                                    <option value="solid">Solid</option>
                                    <option value="dashed">Dashed</option>
                                    <option value="dotted">Dotted</option>
                                  </select>
                                </div>
                                
                                <div>
                                  <Label className="text-xs">Width</Label>
                                  <Input
                                    type="number"
                                    min="1"
                                    max="10"
                                    value={param.line?.width || 2}
                                    onChange={(e) => {
                                      const newParams = [...(editingChart.yAxisParams || [])]
                                      newParams[paramIndex] = {
                                        ...newParams[paramIndex],
                                        line: {
                                          ...newParams[paramIndex].line,
                                          style: newParams[paramIndex].line?.style || "solid",
                                          width: parseInt(e.target.value) || 2,
                                          color: newParams[paramIndex].line?.color || "#0066cc"
                                        }
                                      }
                                      setEditingChart({ ...editingChart, yAxisParams: newParams })
                                    }}
                                    className="h-7 text-xs"
                                  />
                                </div>
                                
                                <div>
                                  <Label className="text-xs">Color</Label>
                                  <Input
                                    type="color"
                                    value={param.line?.color || "#0066cc"}
                                    onChange={(e) => {
                                      const newParams = [...(editingChart.yAxisParams || [])]
                                      newParams[paramIndex] = {
                                        ...newParams[paramIndex],
                                        line: {
                                          ...newParams[paramIndex].line,
                                          style: newParams[paramIndex].line?.style || "solid",
                                          width: newParams[paramIndex].line?.width || 2,
                                          color: e.target.value
                                        }
                                      }
                                      setEditingChart({ ...editingChart, yAxisParams: newParams })
                                    }}
                                    className="h-7 w-full"
                                  />
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                }) || []
              )
            ) : (
              <TableRow>
                <TableCell colSpan={appearanceMode === "both" ? 4 : 3} className="text-center text-xs text-muted-foreground py-4">
                  {selectedDataSourceItems.length === 0 
                    ? "No data sources selected. Please select data sources in the DataSource tab."
                    : "No Y parameters configured. Please add parameters in the Parameters tab."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}