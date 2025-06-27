"use client"

import { useState, useCallback, useEffect } from 'react'
import { ChartComponent } from '@/types'
import { ReferenceLineConfig, configToReferenceLine, referenceLineToConfig } from '@/types/reference-line'

export function useReferenceLines(
  editingChart: ChartComponent,
  setEditingChart: (chart: ChartComponent) => void
) {
  const [referenceLineConfigs, setReferenceLineConfigs] = useState<ReferenceLineConfig[]>([])

  // Convert ChartComponent.referenceLines to ReferenceLineConfig format
  useEffect(() => {
    const newConfigs = (editingChart.referenceLines || []).map(referenceLineToConfig)
    setReferenceLineConfigs(newConfigs)
  }, [editingChart.referenceLines])

  // Convert ReferenceLineConfig back to ReferenceLine format and update chart
  const handleUpdateReferenceLines = useCallback((updatedConfigs: ReferenceLineConfig[]) => {
    setReferenceLineConfigs(updatedConfigs)
    
    const referenceLines = updatedConfigs.map(config => 
      configToReferenceLine(config, editingChart.xAxisType)
    )

    setEditingChart({
      ...editingChart,
      referenceLines
    })
  }, [editingChart, setEditingChart])

  const addReferenceLine = useCallback((type: "vertical" | "horizontal", defaultValue: string, label: string) => {
    const newConfig: ReferenceLineConfig = {
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

  const updateReferenceLine = useCallback((id: string, updates: Partial<ReferenceLineConfig>) => {
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