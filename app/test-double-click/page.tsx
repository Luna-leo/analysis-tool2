"use client"

import React from "react"
import { ChartComponent, EventInfo } from "@/types"
import { ChartPreview } from "@/components/charts/ChartPreview"
import { ChartPreviewGraph } from "@/components/charts/ChartPreviewGraph"

export default function TestDoubleClickPage() {
  const [editingChart, setEditingChart] = React.useState<ChartComponent>({
    id: "test-chart",
    title: "Test Chart for Double-Click",
    type: "scatter",
    showXLabel: true,
    showYLabel: true,
    showGrid: true,
    showLegend: true,
    showTitle: true,
    showMarkers: true,
    showLines: true,
    xAxisType: "time",
    xParameter: "time",
    yAxisParams: [{
      id: "param1",
      name: "Test Parameter",
      color: "#3b82f6"
    }],
    margins: { top: 20, right: 40, bottom: 60, left: 60 }
  })

  const testData: EventInfo[] = [{
    id: "test-datasource",
    name: "Test Data Source",
    parameters: [{
      id: "param1",
      name: "Test Parameter",
      data: Array.from({ length: 100 }, (_, i) => ({
        timestamp: new Date(Date.now() - (100 - i) * 1000 * 60).toISOString(),
        value: Math.sin(i / 10) * 50 + 50 + Math.random() * 10
      }))
    }]
  }]

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Double-Click Reset</h1>
      <p className="mb-4">Double-click on the chart to reset zoom. Use mouse wheel to zoom.</p>
      
      <div className="grid grid-cols-2 gap-8">
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">Direct ChartPreviewGraph</h2>
          <div className="h-[400px]">
            <ChartPreviewGraph
              editingChart={editingChart}
              selectedDataSourceItems={testData}
              setEditingChart={setEditingChart}
              enableZoom={true}
              enablePan={true}
              showZoomControls={true}
            />
          </div>
        </div>
        
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-2">ChartPreview (as in Modal)</h2>
          <div className="h-[400px]">
            <ChartPreview
              editingChart={editingChart}
              selectedDataSourceItems={testData}
              setEditingChart={setEditingChart}
              enableZoom={true}
              enablePan={true}
              zoomMode="auto"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <p className="text-sm">Console logs should show:</p>
        <ul className="text-sm list-disc list-inside">
          <li>"Setting up double-click handler for chart test-chart"</li>
          <li>"Double-click reset triggered for chart test-chart" when you double-click</li>
        </ul>
      </div>
    </div>
  )
}