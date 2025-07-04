"use client"

import React, { useState } from 'react'
import { ChartPreview } from '@/components/charts/ChartPreview'
import { ChartComponent, EventInfo } from '@/types'

// Generate test data
const generateTestData = () => {
  const data: EventInfo[] = []
  const now = Date.now()
  
  for (let i = 0; i < 100; i++) {
    data.push({
      id: `point-${i}`,
      plant: 'TestPlant',
      machineNo: 'M001',
      label: 'Test Data',
      event: 'test-event',
      start: new Date(now - i * 60000).toISOString(), // 1 minute intervals
      end: new Date(now - i * 60000 + 60000).toISOString()
    })
  }
  
  return data
}

export default function TestZoomPage() {
  const [testData] = useState<EventInfo[]>(generateTestData())
  
  const testChart: ChartComponent = {
    id: 'test-chart',
    type: 'scatter',
    title: 'Test Zoom Chart',
    showTitle: true,
    showXLabel: true,
    showYLabel: true,
    showLegend: true,
    showGrid: true,
    xLabel: 'Time',
    yLabel: 'Value',
    xAxisType: 'datetime',
    data: [],
    margins: { top: 40, right: 40, bottom: 60, left: 60 },
  }
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Zoom Test Page</h1>
      <div className="mb-4 text-sm text-gray-600">
        <p>• Hold Shift and drag to select a region to zoom</p>
        <p>• Use mouse wheel to zoom in/out</p>
        <p>• Click and drag to pan</p>
        <p>• Open console to see debug logs</p>
      </div>
      <div className="w-full h-[600px] border border-gray-200 rounded-lg bg-white">
        <ChartPreview
          editingChart={testChart}
          selectedDataSourceItems={testData}
          enableZoom={true}
          enablePan={true}
          zoomMode="xy"
        />
      </div>
    </div>
  )
}