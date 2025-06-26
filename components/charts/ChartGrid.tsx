"use client"

import React, { useEffect } from "react"
import { FileNode } from "@/types"
import { VirtualizedChartGrid } from "./VirtualizedChartGrid"
import { CSVImportPage } from "@/components/csv-import"
import { EventMasterPage } from "@/components/event-master"
import { InterlockMasterPageWrapper } from "@/components/interlock-master/InterlockMasterPageWrapper"
import { FormulaMasterPage } from "@/components/formula-master"
import { TriggerConditionMasterPage } from "@/components/trigger-condition-master"
import { UnitConverterFormulaMasterPage } from "@/components/unit-converter-formula"
import { SettingsPage } from "@/components/settings"
import { useLayoutStore } from "@/stores/useLayoutStore"

interface ChartGridProps {
  file: FileNode
}

export const ChartGrid = React.memo(function ChartGrid({ file }: ChartGridProps) {
  const { layoutSettingsMap } = useLayoutStore()

  // Initialize settings if they don't exist
  useEffect(() => {
    const layoutStore = useLayoutStore.getState()
    if (!layoutSettingsMap[file.id] && file.id !== 'csv-import') {
      layoutStore.initializeSettings(file.id)
    }
  }, [file.id, layoutSettingsMap])
  
  // Check if this is a CSV Import tab
  if (file.id === 'csv-import') {
    return <CSVImportPage fileId={file.id} />
  }

  // Check if this is an Event Master tab
  if (file.id === 'event-master') {
    return <EventMasterPage />
  }

  // Check if this is an Interlock Master tab
  if (file.id === 'interlock-master') {
    return <InterlockMasterPageWrapper fileId={file.id} />
  }

  // Check if this is a Formula Master tab
  if (file.id === 'formula-master') {
    return <FormulaMasterPage />
  }

  // Check if this is a Trigger Condition Master tab
  if (file.id === 'trigger-condition-master') {
    return <TriggerConditionMasterPage />
  }

  // Check if this is a Unit Converter Formula Master tab
  if (file.id === 'unit-converter-formula-master') {
    return <UnitConverterFormulaMasterPage />
  }

  // Check if this is a Settings tab
  if (file.id === 'settings') {
    return <SettingsPage />
  }

  // Always use virtualized grid for consistency
  return <VirtualizedChartGrid file={file} />
})