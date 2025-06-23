"use client"

import React, { useState } from "react"
import { ChartComponent, EventInfo } from "@/types"
import { XParameterSettings } from "./XParameterSettings"
import { YParametersSettings } from "./YParametersSettings"
import { ReferenceLinesSettings } from "./ReferenceLinesSettings"

interface ParametersTabProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
  selectedDataSourceItems: EventInfo[]
  isBulkEdit?: boolean
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
  color?: string
  style?: "solid" | "dashed" | "dotted"
  labelOffset?: {
    x: number
    y: number
  }
}

export function ParametersTab({ editingChart, setEditingChart, selectedDataSourceItems, isBulkEdit = false }: ParametersTabProps) {
  const [isReferenceLinesOpen, setIsReferenceLinesOpen] = useState(false)
  const [referenceLineConfigs, setReferenceLineConfigs] = useState<ReferenceLineConfig[]>([])

  // Update referenceLineConfigs when editingChart.referenceLines changes
  React.useEffect(() => {
    const newConfigs = (editingChart.referenceLines || []).map(line => {
      return {
        id: line.id,
        type: line.type === "vertical" ? "vertical" as const : "horizontal" as const,
        label: line.label,
        xValue: line.type === "vertical" ? (typeof line.value === 'string' ? line.value : line.value?.toString()) : undefined,
        yValue: line.type === "horizontal" ? line.value?.toString() : undefined,
        axisNo: 1,
        yRange: line.yRange || {
          auto: true,
          min: "0",
          max: "100"
        },
        xRange: line.xRange || {
          auto: true,
          min: "0",
          max: "100"
        },
        color: line.color,
        style: line.style,
        labelOffset: line.labelOffset
      }
    })
    setReferenceLineConfigs(newConfigs)
  }, [editingChart.referenceLines])

  const handleUpdateReferenceLines = (lines: ReferenceLineConfig[]) => {
    // Update local state first
    setReferenceLineConfigs(lines)
    
    // Convert to chart format
    const convertedLines = lines.map(line => {
      let value: number | string
      
      if (line.type === "vertical") {
        // For vertical lines, check if it's datetime or numeric
        if ((editingChart.xAxisType || "datetime") === "datetime") {
          // Only set value if xValue is not empty
          value = line.xValue || ""
        } else {
          // For numeric values, ensure we have a valid number
          const numValue = parseFloat(line.xValue || "0")
          value = isNaN(numValue) ? 0 : numValue
        }
      } else {
        // For horizontal lines, always numeric
        const numValue = parseFloat(line.yValue || "0")
        value = isNaN(numValue) ? 0 : numValue
      }
      
      return {
        id: line.id,
        type: line.type === "vertical" ? "vertical" as const : "horizontal" as const,
        value: value,
        label: line.label,
        color: line.color || "#ff0000",
        style: line.style || "solid" as const,
        labelOffset: line.labelOffset,
        xRange: line.xRange,
        yRange: line.yRange
      }
    })

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
        selectedDataSourceItems={selectedDataSourceItems}
      />
      
      {!isBulkEdit && (
        <YParametersSettings 
          editingChart={editingChart} 
          setEditingChart={setEditingChart}
          isReferenceLinesOpen={isReferenceLinesOpen}
          selectedDataSourceItems={selectedDataSourceItems}
        />
      )}

      <ReferenceLinesSettings 
        editingChart={editingChart} 
        referenceLines={referenceLineConfigs}
        onUpdateReferenceLines={handleUpdateReferenceLines}
        isOpen={isReferenceLinesOpen}
        onOpenChange={setIsReferenceLinesOpen}
        selectedDataSourceItems={selectedDataSourceItems}
      />
    </div>
  )
}