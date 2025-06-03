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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Chart: {editingChart.title}</DialogTitle>
          <DialogDescription>
            Configure chart appearance, parameters, support lines, and view data source information.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8">
          {/* Appearance Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Appearance</h3>

            <div className="grid grid-cols-2 gap-4">
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

              <div className="flex items-center space-x-2 pt-6">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
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

          {/* Parameter Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Parameters</h3>

            {/* X Parameter Settings */}
            <div className="space-y-4 p-4 border rounded-md">
              <h4 className="font-medium">X Parameter Settings</h4>

              <div className="flex items-center gap-3">
                <div className="w-40">
                  <Label htmlFor="x-axis-type" className="text-xs">
                    Axis Type
                  </Label>
                  <select
                    id="x-axis-type"
                    className="w-full h-9 px-3 py-2 border rounded-md text-xs"
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

                <div className="flex-1">
                  <Label htmlFor="x-parameter" className="text-xs">
                    Parameter
                  </Label>
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
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Y Parameters */}
            <div className="space-y-4 p-4 border rounded-md">
              <h4 className="font-medium">Y Parameters</h4>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Configure Y-axis parameters for the chart. You can add multiple parameters for line charts.
                </p>
                <Button variant="outline" size="sm">
                  Add Y Parameter
                </Button>
              </div>
            </div>
          </div>

          {/* Data Source Information */}
          {editingChart.dataSource && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Data Source</h3>
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-md bg-muted/30">
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
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
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
        </div>
      </DialogContent>
    </Dialog>
  )
}