"use client"

import React, { useState, useEffect } from 'react'
import { ChartPreview } from '@/components/charts/ChartPreview'
import { ChartComponent, EventInfo } from '@/types'

const sampleDataSources: EventInfo[] = [
  {
    id: 'temp-1',
    name: 'Temperature Sensor 1',
    type: 'temperature',
    unit: '°C',
    data: Array.from({ length: 100 }, (_, i) => ({
      timestamp: new Date(Date.now() - (100 - i) * 60000).toISOString(),
      value: 20 + Math.sin(i / 10) * 5 + Math.random() * 2
    }))
  },
  {
    id: 'temp-2',
    name: 'Temperature Sensor 2',
    type: 'temperature', 
    unit: '°C',
    data: Array.from({ length: 100 }, (_, i) => ({
      timestamp: new Date(Date.now() - (100 - i) * 60000).toISOString(),
      value: 25 + Math.cos(i / 8) * 3 + Math.random() * 1.5
    }))
  }
]

export default function TestZoomPage() {
  const [chartType, setChartType] = useState<'line' | 'scatter'>('line')
  const [editingChart, setEditingChart] = useState<ChartComponent>({
    id: 'test-chart',
    name: 'Zoom Test Chart',
    type: chartType,
    xParameter: 'timestamp',
    yParameter: 'value',
    yAxisParams: [
      {
        parameter: 'value',
        axisNo: 1,
        unit: '°C'
      }
    ],
    showLegend: true,
    showTitle: true,
    showXLabel: true,
    showYLabel: true,
    showGrid: true,
    title: 'Temperature Over Time',
    xLabel: 'Time',
    yLabel: 'Temperature (°C)',
    referenceLines: {
      horizontal: [
        { value: 22, label: 'Target', color: '#ef4444' }
      ],
      vertical: []
    }
  })
  
  // Update chart type when selection changes
  useEffect(() => {
    setEditingChart(prev => ({ ...prev, type: chartType }))
  }, [chartType])

  return (
    <div className="h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Chart Zoom Test</h1>
        <p className="text-gray-600 mb-6">
          Test the pan and zoom functionality. Use the +/- buttons or drag to pan.
        </p>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-4 flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="line"
                checked={chartType === 'line'}
                onChange={(e) => setChartType(e.target.value as 'line')}
                className="mr-2"
              />
              Line Chart (X-axis zoom only)
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="scatter"
                checked={chartType === 'scatter'}
                onChange={(e) => setChartType(e.target.value as 'scatter')}
                className="mr-2"
              />
              Scatter Plot (X/Y zoom)
            </label>
          </div>
          <div className="h-[600px]">
            <ChartPreview
              editingChart={editingChart}
              selectedDataSourceItems={sampleDataSources}
              setEditingChart={setEditingChart}
            />
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-500">
          <p>• Click and drag to pan the chart</p>
          <p>• Use the zoom controls (+/-) or scroll wheel to zoom</p>
          <p>• Click the home button to reset zoom</p>
        </div>
      </div>
    </div>
  )
}