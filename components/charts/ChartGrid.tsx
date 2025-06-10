"use client"

import React, { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileNode, ChartSizes } from "@/types"
import { ChartCard } from "./ChartCard"
import { CSVImportPage } from "@/components/csv-import"
import { useFileStore } from "@/stores/useFileStore"
import { useLayoutStore } from "@/stores/useLayoutStore"
import { useUIStore } from "@/stores/useUIStore"

interface ChartGridProps {
  file: FileNode
}

export function ChartGrid({ file }: ChartGridProps) {
  // Check if this is a CSV Import tab
  if (file.type === 'csv-import') {
    return <CSVImportPage fileId={file.id} />
  }

  const contentRef = useRef<HTMLDivElement>(null)
  const [chartSizes, setChartSizes] = useState<ChartSizes>({
    cardMinHeight: 180,
    chartMinHeight: 80,
    isCompactLayout: false,
  })

  const { activeTab } = useFileStore()
  const { layoutSettingsMap } = useLayoutStore()
  const { currentPage, setCurrentPage } = useUIStore()

  const currentSettings = layoutSettingsMap[file.id] || {
    showFileName: true,
    showDataSources: true,
    columns: 2,
    rows: 2,
    pagination: true,
  }

  useEffect(() => {
    if (contentRef.current && activeTab === file.id) {
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
  let totalPages = 1
  let currentCharts = charts

  if (currentSettings.pagination) {
    const maxItemsPerPage = currentSettings.columns * currentSettings.rows
    totalPages = Math.ceil(totalItems / maxItemsPerPage)

    const startIndex = (currentPage - 1) * maxItemsPerPage
    const endIndex = startIndex + maxItemsPerPage
    currentCharts = charts.slice(startIndex, endIndex)
  }

  return (
    <div className="h-full flex flex-col" ref={contentRef}>
      <div className={cn("flex-1", currentSettings.pagination ? "overflow-hidden" : "overflow-auto")}>
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="mb-6 flex-shrink-0">
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

          {/* Grid */}
          <div
            className={cn("grid", currentSettings.pagination ? "flex-1" : "")}
            style={{
              gridTemplateColumns: `repeat(${currentSettings.columns}, 1fr)`,
              ...(currentSettings.pagination && {
                gridTemplateRows: `repeat(${currentSettings.rows}, 1fr)`,
              }),
              gap: chartSizes.isCompactLayout ? "12px" : "24px",
            }}
          >
            {currentCharts.map((chart) => (
              <ChartCard
                key={chart.id}
                chart={chart}
                isCompactLayout={chartSizes.isCompactLayout}
                cardMinHeight={chartSizes.cardMinHeight}
                chartMinHeight={chartSizes.chartMinHeight}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Pagination */}
      {currentSettings.pagination && totalPages > 1 && (
        <div className="border-t bg-background py-4 px-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              Showing {(currentPage - 1) * (currentSettings.columns * currentSettings.rows) + 1} -{" "}
              {Math.min(currentPage * (currentSettings.columns * currentSettings.rows), totalItems)} of {totalItems}{" "}
              charts
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-3 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}