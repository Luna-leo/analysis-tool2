'use client'

import React, { useState } from 'react'
import { ChartPreviewGraph } from '@/components/charts/ChartPreviewGraph'
import { ChartComponent, EventInfo } from '@/types'
import { Button } from '@/components/ui/button'
import { useCSVDataStore } from '@/stores/useCSVDataStore'

// Generate mock data sources
function generateMockDataSources(): EventInfo[] {
  const startDate = new Date('2024-01-01')
  const endDate = new Date('2024-12-31')
  
  return [{
    id: 'test-datasource-error',
    plant: 'Test Plant',
    machineNo: 'Machine-001',
    label: 'Test Data (Error)',
    labelDescription: 'Test data source for error handling',
    event: 'test-event',
    eventDetail: 'Test event details',
    start: startDate.toISOString(),
    end: endDate.toISOString()
  }]
}

// Mock the data store to simulate errors
const mockCSVDataStore = {
  getParameterData: (dataSourceId: string, parameters: string[]) => {
    console.log('Mock getParameterData called:', { dataSourceId, parameters })
    
    // Simulate error after a delay
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.5) {
          reject(new Error('Simulated data loading error'))
        } else {
          // Return empty data
          resolve([])
        }
      }, 1000)
    })
  }
}

// Override the store temporarily
;(useCSVDataStore as any).setState({ 
  getParameterData: mockCSVDataStore.getParameterData 
})

export default function TestWorkerErrorPage() {
  const [simulateError, setSimulateError] = useState(false)
  const [chartKey, setChartKey] = useState(0)
  
  const testChart: ChartComponent = {
    id: 'test-chart-error',
    name: 'Test Chart (Error Handling)',
    type: 'scatter',
    xAxisType: 'datetime',
    yAxisParams: [
      { parameter: 'value1', parameterType: 'value' },
      { parameter: 'value2', parameterType: 'value' }
    ],
    showLegend: true,
    showTitle: true,
    showXAxis: true,
    showYAxis: true,
    showGrid: true,
    enableAnimation: false
  }
  
  const mockDataSources = generateMockDataSources()
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Web Worker Error Handling Test</h1>
      
      <div className="mb-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          This page tests error handling and fallback mechanisms when the Web Worker fails.
        </p>
        
        <div className="flex gap-4">
          <Button
            onClick={() => setSimulateError(!simulateError)}
            variant={simulateError ? "destructive" : "default"}
          >
            {simulateError ? "Error Mode Active" : "Enable Error Mode"}
          </Button>
          
          <Button
            onClick={() => setChartKey(prev => prev + 1)}
            variant="outline"
          >
            Reload Chart
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          Status: {simulateError ? "Simulating errors (50% chance)" : "Normal operation"}
        </div>
      </div>
      
      <div className="border rounded-lg p-4 bg-muted/10">
        <div className="h-[600px]">
          <ChartPreviewGraph
            key={chartKey}
            editingChart={testChart}
            selectedDataSourceItems={mockDataSources}
            enableZoom={true}
            enablePan={true}
            showZoomControls={true}
          />
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h2 className="font-semibold mb-2">Error Handling Features:</h2>
        <ul className="list-disc list-inside text-sm space-y-1">
          <li>Error boundary catches React rendering errors</li>
          <li>Worker failures trigger fallback to main thread processing</li>
          <li>Clear error messages with retry functionality</li>
          <li>Progress indicators show fallback processing status</li>
          <li>Graceful degradation maintains functionality</li>
        </ul>
      </div>
    </div>
  )
}