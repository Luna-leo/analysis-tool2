"use client"

import React, { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { FileNode, ChartSizes } from "@/types"
import { ChartCard } from "./ChartCard"
import { VirtualizedChartGrid } from "./VirtualizedChartGrid"
import { CSVImportPage } from "@/components/csv-import"
import { EventMasterPage } from "@/components/event-master"
import { InterlockMasterPageWrapper } from "@/components/interlock-master/InterlockMasterPageWrapper"
import { FormulaMasterPage } from "@/components/formula-master"
import { TriggerConditionMasterPage } from "@/components/trigger-condition-master"
import { UnitConverterFormulaMasterPage } from "@/components/unit-converter-formula"
import { SettingsPage } from "@/components/settings"
import { useFileStore } from "@/stores/useFileStore"
import { useLayoutStore } from "@/stores/useLayoutStore"

interface ChartGridProps {
  file: FileNode
}

export const ChartGrid = React.memo(function ChartGrid({ file }: ChartGridProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [chartSizes, setChartSizes] = useState<ChartSizes>({
    cardMinHeight: 180,
    chartMinHeight: 80,
    isCompactLayout: false,
  })

  const { activeTab } = useFileStore()
  const { layoutSettingsMap } = useLayoutStore()

  const currentSettings = layoutSettingsMap[file.id] || {
    showFileName: true,
    showDataSources: true,
    columns: 2,
    rows: 2,
    pagination: true,
  }

  useEffect(() => {
    if (contentRef.current && activeTab === file.id && file.id !== 'csv-import') {
      const updateChartSizes = () => {
        if (!contentRef.current) return

        const isCompactLayout = currentSettings.rows >= 3 || currentSettings.columns >= 3

        const cardMinHeight = isCompactLayout ? 140 : 180
        const chartMinHeight = isCompactLayout ? 60 : 80

        setChartSizes({
          cardMinHeight,
          chartMinHeight,
          isCompactLayout,
        })
      }

      const resizeObserver = new ResizeObserver(() => {
        setTimeout(updateChartSizes, 100)
      })

      resizeObserver.observe(contentRef.current)
      setTimeout(updateChartSizes, 100)

      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [layoutSettingsMap, activeTab, file.id, currentSettings])

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

  if (!file.charts || file.charts.length === 0) {
    return (
      <div className="p-6">
        <div className="h-full flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>No charts available for this file</p>
          </div>
        </div>
      </div>
    )
  }

  const charts = file.charts
  const totalItems = charts.length

  // Use virtualized grid for large datasets
  const VIRTUALIZATION_THRESHOLD = 10
  const shouldUseVirtualization = totalItems > VIRTUALIZATION_THRESHOLD

  if (shouldUseVirtualization) {
    return <VirtualizedChartGrid file={file} />
  }

  return (
    <div className="absolute inset-0 overflow-auto" ref={contentRef}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {currentSettings.showFileName && <h2 className="text-2xl font-bold mb-2">{file.name}</h2>}

              {currentSettings.showDataSources && file.dataSources && file.dataSources.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {file.dataSources.map((source, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {source}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${currentSettings.columns}, 1fr)`,
            gap: chartSizes.isCompactLayout ? "12px" : "24px",
          }}
        >
          {charts.map((chart) => (
            <ChartCard
              key={chart.id}
              chart={chart}
              isCompactLayout={chartSizes.isCompactLayout}
              cardMinHeight={chartSizes.cardMinHeight}
              chartMinHeight={chartSizes.chartMinHeight}
              fileId={file.id}
            />
          ))}
        </div>
      </div>
    </div>
  )
})