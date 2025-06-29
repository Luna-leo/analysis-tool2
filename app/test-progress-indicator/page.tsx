"use client"

import React, { useState } from 'react'
import { ChartPreviewGraph } from '@/components/charts/ChartPreviewGraph'
import { ChartComponent, EventInfo } from '@/types'
import { Button } from '@/components/ui/button'

// Generate test data
function generateLargeDataset(numPoints: number): EventInfo[] {
  const startDate = new Date('2024-01-01')
  const endDate = new Date('2024-12-31')
  
  return [{
    id: 'test-datasource',
    plant: 'Test Plant',
    machineNo: 'Machine-001',
    label: 'Test Data',
    labelDescription: 'Test data source for progress indicator',
    event: 'test-event',
    eventDetail: 'Test event details',
    start: startDate.toISOString(),
    end: endDate.toISOString()
  }]
}

// Mock the data store to return large dataset
import { useCSVDataStore } from '@/stores/useCSVDataStore'

export default function TestProgressIndicatorPage() {
  const [numPoints, setNumPoints] = useState(50000)
  const [showChart, setShowChart] = useState(false)
  
  const testChart: ChartComponent = {
    id: 'test-chart',
    title: 'Progress Indicator Test Chart',
    data: [],
    xAxisType: 'datetime',
    yAxisParams: [
      { parameter: 'value1', axisName: 'Value 1', axisNo: 0 },
      { parameter: 'value2', axisName: 'Value 2', axisNo: 0 },
      { parameter: 'value3', axisName: 'Value 3', axisNo: 0 }
    ],
    showTitle: true,
    showLegend: true,
    showMarkers: false,
    showLines: true,
    showGrid: true,
    type: 'line'
  }
  
  const dataSources = generateLargeDataset(numPoints)
  
  // Override getParameterData to return mock data
  React.useEffect(() => {
    const store = useCSVDataStore.getState()
    const originalGetParameterData = store.getParameterData
    
    // Mock implementation that generates large dataset
    store.getParameterData = (dataSourceId: string, parameters: string[]) => {
      if (dataSourceId === 'test-datasource') {
        console.log(`Generating ${numPoints} data points for testing...`)
        const data = []
        const startTime = new Date('2024-01-01').getTime()
        const endTime = new Date('2024-12-31').getTime()
        const timeStep = (endTime - startTime) / numPoints
        
        for (let i = 0; i < numPoints; i++) {
          const timestamp = new Date(startTime + i * timeStep).toISOString()
          const point: any = { timestamp }
          
          // Generate values for each parameter
          parameters.forEach(param => {
            if (param === 'value1') {
              point[param] = Math.sin(i / 100) * 50 + 50 + Math.random() * 10
            } else if (param === 'value2') {
              point[param] = Math.cos(i / 100) * 30 + 60 + Math.random() * 5
            } else if (param === 'value3') {
              point[param] = Math.sin(i / 50) * Math.cos(i / 200) * 40 + 50 + Math.random() * 8
            }
          })
          
          data.push(point)
        }
        
        return Promise.resolve(data)
      }
      return originalGetParameterData(dataSourceId, parameters)
    }
    
    // Cleanup
    return () => {
      store.getParameterData = originalGetParameterData
    }
  }, [numPoints])
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Progress Indicator Test</h1>
      
      <div className="mb-8 space-y-4">
        <p className="text-muted-foreground">
          This page demonstrates the progress indicator when processing large datasets.
          The progress indicator appears when processing more than 10,000 data points.
        </p>
        
        <div className="flex items-center gap-4">
          <label className="font-medium">Number of data points:</label>
          <select 
            value={numPoints} 
            onChange={(e) => {
              setNumPoints(Number(e.target.value))
              setShowChart(false)
            }}
            className="border rounded px-3 py-1"
          >
            <option value={5000}>5,000 (no progress indicator)</option>
            <option value={10000}>10,000 (threshold)</option>
            <option value={25000}>25,000</option>
            <option value={50000}>50,000</option>
            <option value={100000}>100,000</option>
            <option value={250000}>250,000</option>
          </select>
          
          <Button 
            onClick={() => setShowChart(!showChart)}
            variant={showChart ? "secondary" : "default"}
          >
            {showChart ? 'Hide Chart' : 'Show Chart'}
          </Button>
        </div>
        
        {numPoints > 10000 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> With {numPoints.toLocaleString()} data points, you should see a progress indicator
              while the Web Worker processes the data. The indicator shows the percentage complete
              and disappears once processing is finished.
            </p>
          </div>
        )}
      </div>
      
      {showChart && (
        <div className="border rounded-lg p-4">
          <div style={{ height: '500px' }}>
            <ChartPreviewGraph
              editingChart={testChart}
              selectedDataSourceItems={dataSources}
              enableZoom={true}
              enablePan={true}
              showZoomControls={true}
            />
          </div>
        </div>
      )}
      
      <div className="mt-8 space-y-2 text-sm text-muted-foreground">
        <h2 className="font-semibold text-base">Implementation Details:</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Progress indicator only shows for datasets larger than 10,000 points</li>
          <li>Uses the Web Worker for data processing to avoid blocking the UI</li>
          <li>Shows real-time progress updates as data is processed</li>
          <li>Displays a gradient progress bar with percentage</li>
          <li>Automatically disappears when processing is complete</li>
          <li>Provides smooth transitions for a good user experience</li>
        </ul>
      </div>
    </div>
  )
}