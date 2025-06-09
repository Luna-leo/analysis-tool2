"use client"

import React, { useState } from "react"
import { ChartComponent } from "@/types"
import { XParameterSettings } from "./XParameterSettings"
import { YParametersSettings } from "./YParametersSettings"
import { ReferenceLinesSettings } from "./ReferenceLinesSettings"

interface ParametersTabProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

interface ReferenceLineConfig {
  id: string
  type: "vertical" | "horizontal"
  label: string
  xValue?: string
  yValue?: string
  axisNo?: number
  yRange?: {
    auto: boolean
    min: string
    max: string
  }
  xRange?: {
    auto: boolean
    min: string
    max: string
  }
}

export function ParametersTab({ editingChart, setEditingChart }: ParametersTabProps) {
  const [isReferenceLinesOpen, setIsReferenceLinesOpen] = useState(false)
  const [referenceLineConfigs, setReferenceLineConfigs] = useState<ReferenceLineConfig[]>([])

  // Update referenceLineConfigs when editingChart.referenceLines changes
  React.useEffect(() => {
    const newConfigs = (editingChart.referenceLines || []).map(line => {
      // Find existing config to preserve range settings
      const existingConfig = referenceLineConfigs.find(config => config.id === line.id)
      
      return {
        id: line.id,
        type: line.type === "vertical" ? "vertical" as const : "horizontal" as const,
        label: line.label,
        xValue: line.type === "vertical" ? line.value?.toString() : undefined,
        yValue: line.type === "horizontal" ? line.value?.toString() : undefined,
        axisNo: existingConfig?.axisNo || 1,
        yRange: existingConfig?.yRange || {
          auto: true,
          min: "0",
          max: "100"
        },
        xRange: existingConfig?.xRange || {
          auto: true,
          min: "0",
          max: "100"
        }
      }
    })
    setReferenceLineConfigs(newConfigs)
  }, [editingChart.referenceLines?.length])

  const handleUpdateReferenceLines = (lines: ReferenceLineConfig[]) => {
    // Update local state first
    setReferenceLineConfigs(lines)
    
    // Convert to chart format
    const convertedLines = lines.map(line => ({
      id: line.id,
      type: line.type === "vertical" ? "vertical" as const : "horizontal" as const,
      value: parseFloat(line.type === "vertical" ? (line.xValue || "0") : (line.yValue || "0")),
      label: line.label,
      color: "#666666",
      style: "solid" as const
    }))

    setEditingChart({
      ...editingChart,
      referenceLines: convertedLines
    })
  }

  return (
    <div className="flex flex-col space-y-4 h-full">
      <XParameterSettings 
        editingChart={editingChart} 
        setEditingChart={setEditingChart} 
      />
      
      <YParametersSettings 
        editingChart={editingChart} 
        setEditingChart={setEditingChart}
        isReferenceLinesOpen={isReferenceLinesOpen}
      />

      <ReferenceLinesSettings 
        editingChart={editingChart} 
        referenceLines={referenceLineConfigs}
        onUpdateReferenceLines={handleUpdateReferenceLines}
        isOpen={isReferenceLinesOpen}
        onOpenChange={setIsReferenceLinesOpen}
      />
    </div>
  )
}