"use client"

import React, { useEffect, useState } from 'react'
import { ChartPreview } from '@/components/charts/ChartPreview'
import { ChartComponent, EventInfo } from '@/types'

// Simple test data with clear x/y values
const testData: EventInfo[] = [
  {
    id: 'test-1',
    name: 'Test Data',
    type: 'test',
    unit: 'units',
    data: [
      { timestamp: new Date('2024-01-01T10:00:00').toISOString(), value: 10 },
      { timestamp: new Date('2024-01-01T11:00:00').toISOString(), value: 20 },
      { timestamp: new Date('2024-01-01T12:00:00').toISOString(), value: 30 },
      { timestamp: new Date('2024-01-01T13:00:00').toISOString(), value: 25 },
      { timestamp: new Date('2024-01-01T14:00:00').toISOString(), value: 35 }
    ]
  }
]

export default function TestInlinePage() {
  const [showData, setShowData] = useState(false)
  const [chartConfig] = useState<ChartComponent>({
    id: 'test-chart',
    name: 'Test Chart',
    type: 'scatter',
    xParameter: 'timestamp',
    yParameter: 'value',
    yAxisParams: [{
      parameter: 'value',
      axisNo: 1,
      unit: 'units'
    }],
    showLegend: true,
    showTitle: true,
    showXLabel: true,
    showYLabel: true,
    showGrid: true,
    title: 'Inline Test Chart',
    xLabel: 'Time',
    yLabel: 'Value'
  })

  useEffect(() => {
    // Log when component mounts
    console.log('TestInlinePage mounted')
    
    // Show data after a delay to simulate loading
    setTimeout(() => {
      console.log('Setting showData to true')
      setShowData(true)
    }, 1000)
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Inline Chart Test</h1>
      <p className="mb-4">
        Expected Y-axis range: 10-35 (data values)<br/>
        If fix is working, Y-axis should NOT show 0-100
      </p>
      <div className="bg-white rounded-lg shadow p-4">
        <div className="h-[400px]">
          <ChartPreview
            editingChart={chartConfig}
            selectedDataSourceItems={showData ? testData : []}
            enableZoom={false}
            enablePan={false}
          />
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        Data status: {showData ? 'Loaded' : 'Loading...'}
      </div>
    </div>
  )
}