"use client"

import React, { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { ChartComponent } from "@/types"

interface ParametersTabProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

export function ParametersTab({ editingChart, setEditingChart }: ParametersTabProps) {
  const [lastAddedParamIndex, setLastAddedParamIndex] = useState<number | null>(null)
  const parameterInputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (lastAddedParamIndex !== null && parameterInputRefs.current[lastAddedParamIndex]) {
      const inputElement = parameterInputRefs.current[lastAddedParamIndex]
      inputElement?.focus()
      inputElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      setLastAddedParamIndex(null)
    }
  }, [lastAddedParamIndex, editingChart?.yAxisParams?.length])

  return (
    <div className="flex flex-col space-y-4 h-full">
      <div className="border rounded-lg p-3 bg-muted/30">
        <h4 className="font-medium text-sm mb-2">X Parameter Settings</h4>
        <div className="flex gap-2">
          <div className="w-38">
            <Label htmlFor="x-axis-type" className="text-sm mb-1 block">Parameter Type</Label>
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

          <div className="flex-1">
            <Label htmlFor="x-parameter" className="text-sm mb-1 block">Parameter</Label>
            <Input
              id="x-parameter"
              value={editingChart.xParameter || ""}
              onChange={(e) => {
                setEditingChart({
                  ...editingChart,
                  xParameter: e.target.value,
                })
              }}
              placeholder="Enter parameter"
              disabled={editingChart.xAxisType !== "parameter"}
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col border rounded-lg p-3 bg-muted/30 min-h-0 flex-1">
        <div className="flex justify-between items-center mb-2 flex-shrink-0">
          <h4 className="font-medium text-sm">Y Parameters Settings</h4>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              const newParam = {
                parameterType: "Parameter" as "Parameter" | "Formula",
                parameter: "",
                axisNo: 1,
                axisName: "",
                range: {
                  auto: true,
                  min: 0,
                  max: 100,
                },
                line: {
                  width: 2,
                  color: "#000000",
                  style: "solid" as const,
                },
              }
              const newParams = [...(editingChart.yAxisParams || []), newParam]
              setEditingChart({
                ...editingChart,
                yAxisParams: newParams,
              })
              setLastAddedParamIndex(newParams.length - 1)
            }}
          >
            Add Y Parameter
          </Button>
        </div>

        <div className="flex gap-2 mb-2 px-1 pb-1 border-b flex-shrink-0">
          <div className="w-28 text-xs font-medium text-muted-foreground">Parameter Type</div>
          <div className="flex-1 text-xs font-medium text-muted-foreground">Parameter</div>
          <div className="w-16 text-xs font-medium text-muted-foreground">Axis No</div>
          <div className="w-7"></div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="space-y-1">
            {editingChart.yAxisParams?.map((param, index) => (
              <div key={index} className="flex gap-2 p-1">
                <div className="w-28">
                  <select
                    value={param.parameterType || "Parameter"}
                    onChange={(e) => {
                      const newParams = [...(editingChart.yAxisParams || [])]
                      newParams[index] = { ...newParams[index], parameterType: e.target.value as "Parameter" | "Formula" }
                      setEditingChart({ ...editingChart, yAxisParams: newParams })
                    }}
                    className="w-full h-7 px-2 py-1 border rounded-md text-sm"
                  >
                    <option value="Parameter">Parameter</option>
                    <option value="Formula">Formula</option>
                  </select>
                </div>
                <div className="flex-1">
                  <Input
                    ref={(el) => {
                      parameterInputRefs.current[index] = el
                    }}
                    value={param.parameter}
                    onChange={(e) => {
                      const newParams = [...(editingChart.yAxisParams || [])]
                      newParams[index] = { ...newParams[index], parameter: e.target.value }
                      setEditingChart({ ...editingChart, yAxisParams: newParams })
                    }}
                    placeholder="Parameter"
                    className="h-7 text-sm"
                  />
                </div>
                <div className="w-16">
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={param.axisNo || 1}
                    onChange={(e) => {
                      const newParams = [...(editingChart.yAxisParams || [])]
                      newParams[index] = { ...newParams[index], axisNo: parseInt(e.target.value) || 1 }
                      setEditingChart({ ...editingChart, yAxisParams: newParams })
                    }}
                    className="h-7 text-sm"
                  />
                </div>
                <div className="w-7">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => {
                      const newParams = editingChart.yAxisParams?.filter((_, i) => i !== index) || []
                      setEditingChart({ ...editingChart, yAxisParams: newParams })
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )) || <p className="text-sm text-muted-foreground px-1">No Y parameters added yet.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

