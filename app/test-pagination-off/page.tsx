'use client'

import React, { useState, useEffect } from 'react'
import { ChartComponent, EventInfo } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCSVDataStore } from '@/stores/useCSVDataStore'
import { Badge } from '@/components/ui/badge'

// Mock CSV data generator
function generateMockCSVData(points: number = 100) {
  const data = []
  const startTime = new Date('2024-01-01').getTime()
  for (let i = 0; i < points; i++) {
    data.push({
      timestamp: new Date(startTime + i * 60000).toISOString(), // 1 minute intervals
      temperature: 20 + Math.sin(i / 10) * 5 + Math.random() * 2,
      pressure: 100 + Math.cos(i / 10) * 10 + Math.random() * 5,
      flow: 50 + Math.sin(i / 5) * 20 + Math.random() * 10,
      value1: Math.random() * 100,
      value2: Math.random() * 50,
      value3: Math.random() * 200
    })
  }
  return data
}

// Track which data sources have been requested
const dataRequestTracker = new Set<string>()

// Mock the data store
const mockCSVDataStore = {
  getParameterData: (dataSourceId: string, parameters: string[]) => {
    // Track this request
    dataRequestTracker.add(dataSourceId)
    
    console.log('Data requested for:', dataSourceId, 'Parameters:', parameters)
    
    // Simulate async data loading
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(generateMockCSVData(100))
      }, 100 + Math.random() * 400) // Random delay 100-500ms
    })
  }
}

// Override the store
;(useCSVDataStore as any).setState({ 
  getParameterData: mockCSVDataStore.getParameterData 
})

// Generate mock data sources
function generateMockDataSources(count: number = 20): EventInfo[] {
  const sources: EventInfo[] = []
  const startDate = new Date('2024-01-01')
  const endDate = new Date('2024-12-31')
  
  for (let i = 0; i < count; i++) {
    sources.push({
      id: `datasource-${i}`,
      plant: 'Test Plant',
      machineNo: `Machine-${Math.floor(i / 5) + 1}`,
      label: `Data Source ${i + 1}`,
      labelDescription: `Test data source #${i + 1} for pagination testing`,
      event: `event-${i % 5}`,
      eventDetail: `Test event for chart ${i + 1}`,
      start: startDate.toISOString(),
      end: endDate.toISOString()
    })
  }
  
  return sources
}

// Generate mock charts
function generateCharts(count: number = 20): ChartComponent[] {
  const charts: ChartComponent[] = []
  
  for (let i = 0; i < count; i++) {
    charts.push({
      id: `chart-${i}`,
      title: `Chart ${i + 1}`,
      data: [],
      type: i % 3 === 0 ? 'scatter' : 'line',
      xAxisType: 'datetime',
      yAxisParams: [
        { 
          parameter: i % 2 === 0 ? 'temperature' : 'pressure', 
          parameterType: 'Parameter', 
          axisName: i % 2 === 0 ? 'Temperature (°C)' : 'Pressure (bar)'
        },
        { 
          parameter: 'flow', 
          parameterType: 'Parameter', 
          axisName: 'Flow (L/min)'
        }
      ],
      showLegend: true,
      showTitle: true,
      showXAxis: true,
      showYAxis: true,
      showGrid: true
    })
  }
  
  return charts
}

export default function TestPaginationOffPage() {
  const [chartCount, setChartCount] = useState(20)
  const [loadedCharts, setLoadedCharts] = useState<Set<string>>(new Set())
  const [checkInterval, setCheckInterval] = useState<NodeJS.Timeout | null>(null)
  
  const charts = generateCharts(chartCount)
  const dataSources = generateMockDataSources(5)
  
  // Monitor which charts have requested data
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadedCharts(new Set(dataRequestTracker))
    }, 500)
    
    setCheckInterval(interval)
    
    return () => {
      clearInterval(interval)
    }
  }, [])
  
  const resetTracking = () => {
    dataRequestTracker.clear()
    setLoadedCharts(new Set())
  }
  
  return (
    <div className="container mx-auto p-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-6">Pagination OFF - Data Loading Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Scenario</CardTitle>
          <CardDescription>
            This page tests whether all charts load data when pagination is turned OFF.
            Each chart should request data immediately, not just when scrolled into view.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <span className="text-sm font-medium w-32">Chart Count:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChartCount(Math.max(5, chartCount - 5))}
            >
              -5
            </Button>
            <span className="w-12 text-center">{chartCount}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChartCount(chartCount + 5)}
            >
              +5
            </Button>
          </div>
          
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Data Loading Status:</span>
              <Badge variant={loadedCharts.size === 0 ? "secondary" : "default"}>
                {loadedCharts.size} / {dataSources.length} data sources loaded
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              Expected: All {dataSources.length} data sources should load immediately when pagination is OFF
            </div>
          </div>
          
          <Button onClick={resetTracking} variant="outline">
            Reset Tracking
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Chart Grid (Pagination OFF)</CardTitle>
          <CardDescription>
            Scroll down to see if charts at the bottom have loaded their data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 max-h-[600px] overflow-y-auto">
            <div className="text-center py-8 text-muted-foreground">
              <p>To test this properly, you need to:</p>
              <ol className="list-decimal list-inside mt-4 space-y-2 text-left max-w-xl mx-auto">
                <li>Open the Charts page in the main application</li>
                <li>Turn OFF pagination using the toggle</li>
                <li>Create or load {chartCount} charts</li>
                <li>Scroll to the bottom without waiting</li>
                <li>Check if bottom charts show data or remain as skeletons</li>
              </ol>
            </div>
          </div>
          
          <div className="mt-4 space-y-2 text-sm">
            <h3 className="font-semibold">Expected Behavior:</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>All charts should start loading data immediately</li>
              <li>No charts should remain as skeletons when scrolling down</li>
              <li>Data loading should happen in parallel for all visible charts</li>
            </ul>
            
            <h3 className="font-semibold mt-4">Current Fix:</h3>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
              <li>Disabled virtualization when pagination is OFF</li>
              <li>All charts marked as visible immediately</li>
              <li>Scroll event handling disabled for non-paginated mode</li>
              <li>Force re-mount charts when pagination mode changes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Loaded Data Sources</CardTitle>
          <CardDescription>
            Real-time tracking of which data sources have been requested
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {dataSources.map((ds) => (
              <Badge
                key={ds.id}
                variant={loadedCharts.has(ds.id) ? "default" : "outline"}
                className="justify-center"
              >
                {ds.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}