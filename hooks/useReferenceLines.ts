"use client"

import { useState, useCallback, useEffect } from 'react'
import { ChartComponent, ReferenceLine } from '@/types'

// Import the shared type from ReferenceLineRow
import type { ReferenceLineConfig } from '@/components/charts/EditModal/parameters/ReferenceLineRow'

// Extend the base type to include additional properties
interface ExtendedReferenceLineConfig extends ReferenceLineConfig {
  color?: string
  style?: "solid" | "dashed" | "dotted"
  labelOffset?: {
    x: number
    y: number
  }
}

export function useReferenceLines(
  editingChart: ChartComponent,
  setEditingChart: (chart: ChartComponent) => void
) {
  const [referenceLineConfigs, setReferenceLineConfigs] = useState<ExtendedReferenceLineConfig[]>([])

  // Convert ChartComponent.referenceLines to ExtendedReferenceLineConfig format
  useEffect(() => {
    const newConfigs: ExtendedReferenceLineConfig[] = (editingChart.referenceLines || []).map(line => {
      return {
        id: line.id,
        type: line.type === "vertical" ? "vertical" as const : "horizontal" as const,
        label: line.label,
        xValue: line.type === "vertical" ? (typeof line.value === 'string' ? line.value : line.value?.toString()) : undefined,
        yValue: line.type === "horizontal" ? line.value?.toString() : undefined,
        axisNo: 1,
        color: line.color,
        style: line.style,
        labelOffset: line.labelOffset
      }
    })
    setReferenceLineConfigs(newConfigs)
  }, [editingChart.referenceLines])

  // Convert ExtendedReferenceLineConfig back to ReferenceLine format and update chart
  const handleUpdateReferenceLines = useCallback((updatedConfigs: ExtendedReferenceLineConfig[]) => {
    setReferenceLineConfigs(updatedConfigs)
    
    const referenceLines: ReferenceLine[] = updatedConfigs.map(config => {
      let value: number | string = ""
      
      if (config.type === "vertical" && config.xValue) {
        value = config.xValue
      } else if (config.type === "horizontal" && config.yValue) {
        value = parseFloat(config.yValue)
      }

      const baseLine: ReferenceLine = {
        id: config.id,
        type: config.type,
        label: config.label,
        value: value,
        color: config.color || "#FF0000",
        style: config.style || "solid",
        labelOffset: config.labelOffset
      }

      return baseLine
    })

    setEditingChart({
      ...editingChart,
      referenceLines
    })
  }, [editingChart, setEditingChart])

  const addReferenceLine = useCallback((type: "vertical" | "horizontal", defaultValue: string, label: string) => {
    const newConfig: ExtendedReferenceLineConfig = {
      id: Date.now().toString(),
      type,
      label,
      xValue: type === "vertical" ? defaultValue : "",
      yValue: type === "horizontal" ? defaultValue : "",
      axisNo: 1,
      color: "#FF0000",
      style: "solid"
    }
    
    const updatedConfigs = [...referenceLineConfigs, newConfig]
    handleUpdateReferenceLines(updatedConfigs)
  }, [referenceLineConfigs, handleUpdateReferenceLines])

  const removeReferenceLine = useCallback((id: string) => {
    const updatedConfigs = referenceLineConfigs.filter(line => line.id !== id)
    handleUpdateReferenceLines(updatedConfigs)
  }, [referenceLineConfigs, handleUpdateReferenceLines])

  const updateReferenceLine = useCallback((id: string, updates: Partial<ExtendedReferenceLineConfig>) => {
    const updatedConfigs = referenceLineConfigs.map(line => 
      line.id === id ? { ...line, ...updates } : line
    )
    handleUpdateReferenceLines(updatedConfigs)
  }, [referenceLineConfigs, handleUpdateReferenceLines])

  return {
    referenceLineConfigs,
    handleUpdateReferenceLines,
    addReferenceLine,
    removeReferenceLine,
    updateReferenceLine
  }
}