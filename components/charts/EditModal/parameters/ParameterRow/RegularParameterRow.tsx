"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { ChartComponent } from "@/types"

interface RegularParameterRowProps {
  index: number
  parameter: string
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
  parameterInputRefs: React.MutableRefObject<(HTMLInputElement | null)[]>
}

export function RegularParameterRow({
  index,
  parameter,
  editingChart,
  setEditingChart,
  parameterInputRefs,
}: RegularParameterRowProps) {
  return (
    <Input
      ref={(el) => {
        parameterInputRefs.current[index] = el
      }}
      value={parameter}
      onChange={(e) => {
        const newParams = [...(editingChart.yAxisParams || [])]
        newParams[index] = { ...newParams[index], parameter: e.target.value }
        setEditingChart({ ...editingChart, yAxisParams: newParams })
      }}
      placeholder="Parameter"
      className="h-7 text-sm"
    />
  )
}