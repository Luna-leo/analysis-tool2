"use client"

import React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAnalysisStore } from "@/stores/useAnalysisStore"

export function ChartEditModal() {
  const { editingChart, editModalOpen, setEditingChart, setEditModalOpen } = useAnalysisStore()

  if (!editingChart) return null

  return (
    <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
      <DialogContent className="max-w-7xl w-[90vw] h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Edit Chart: {editingChart.title}</DialogTitle>
          <DialogDescription>
            Configure chart appearance, parameters, support lines, and view data source information.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 grid-rows-2 gap-4 flex-1 min-h-0">
          {/* Top Left - Appearance Section */}
          <div className="border rounded-lg p-4 overflow-y-auto h-full">
            <h3 className="text-lg font-semibold border-b pb-2 mb-4">Appearance</h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="chart-title">Title</Label>
                <Input
                  id="chart-title"
                  value={editingChart.title}
                  onChange={(e) => {
                    setEditingChart({
                      ...editingChart,
                      title: e.target.value,
                    })
                  }}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="show-legend"
                  checked={editingChart.legend ?? true}
                  onChange={(e) => {
                    setEditingChart({
                      ...editingChart,
                      legend: e.target.checked,
                    })
                  }}
                  className="rounded"
                />
                <Label htmlFor="show-legend">Show Legend</Label>
              </div>

              <div>
                <Label htmlFor="x-label">X-axis Label</Label>
                <Input
                  id="x-label"
                  value={editingChart.xLabel || ""}
                  onChange={(e) => {
                    setEditingChart({
                      ...editingChart,
                      xLabel: e.target.value,
                    })
                  }}
                  placeholder="Enter X-axis label"
                />
              </div>

              <div>
                <Label htmlFor="y-label">Y-axis Label</Label>
                <Input
                  id="y-label"
                  value={editingChart.yLabel || ""}
                  onChange={(e) => {
                    setEditingChart({
                      ...editingChart,
                      yLabel: e.target.value,
                    })
                  }}
                  placeholder="Enter Y-axis label"
                />
              </div>
            </div>
          </div>

          {/* Top Right - Empty Section */}
          <div className="border rounded-lg p-4 overflow-y-auto h-full">
            <h3 className="text-lg font-semibold border-b pb-2 mb-4">Additional Settings</h3>
            <p className="text-sm text-muted-foreground">Additional chart settings can be configured here.</p>
          </div>

          {/* Bottom Left - Parameters (X and Y) */}
          <div className="border rounded-lg p-4 overflow-y-auto h-full">
            <h3 className="text-lg font-semibold border-b pb-2 mb-4">Parameters</h3>
            
            <div className="space-y-6">
              {/* X Parameter Settings */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm">X Parameter Settings</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="x-axis-type" className="text-xs">Axis Type</Label>
                    <select
                      id="x-axis-type"
                      className="w-full h-8 px-2 py-1 border rounded-md text-sm"
                      value={editingChart.xAxisType || "datetime"}
                      onChange={(e) => {
                        setEditingChart({
                          ...editingChart,
                          xAxisType: e.target.value as "datetime" | "time" | "parameter",
                          ...(e.target.value !== "parameter" && { xParameter: "" }),
                        })
                      }}
                    >
                      <option value="datetime">Datetime</option>
                      <option value="time">Time (elapsed)</option>
                      <option value="parameter">Parameter</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="x-parameter" className="text-xs">Parameter</Label>
                    <Input
                      id="x-parameter"
                      value={editingChart.xParameter || ""}
                      onChange={(e) => {
                        setEditingChart({
                          ...editingChart,
                          xParameter: e.target.value,
                        })
                      }}
                      placeholder="Enter X parameter"
                      disabled={editingChart.xAxisType !== "parameter"}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Y Parameters */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Y Parameters</h4>
                <p className="text-xs text-muted-foreground">
                  Configure Y-axis parameters for the chart. You can add multiple parameters for line charts.
                </p>
                <Button variant="outline" size="sm" className="h-8">
                  Add Y Parameter
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom Right - Data Source Information */}
          <div className="border rounded-lg p-4 overflow-y-auto h-full">
            <h3 className="text-lg font-semibold border-b pb-2 mb-4">Data Source</h3>
            {editingChart.dataSource ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Source Name</p>
                  <p className="text-sm text-muted-foreground">{editingChart.dataSource.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Table</p>
                  <p className="text-sm text-muted-foreground">{editingChart.dataSource.table}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Columns</p>
                  <p className="text-sm text-muted-foreground">{editingChart.dataSource.columns.join(", ")}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Last Updated</p>
                  <p className="text-sm text-muted-foreground">{editingChart.dataSource.lastUpdated}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No data source configured</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4 flex-shrink-0">
          <Button variant="outline" onClick={() => setEditModalOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              // In a real app, you would save the changes here
              setEditModalOpen(false)
            }}
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}