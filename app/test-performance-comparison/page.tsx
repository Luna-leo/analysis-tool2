'use client'

import React, { useState } from 'react'
import { ChartPreviewGraph } from '@/components/charts/ChartPreviewGraph'
import { ChartComponent, EventInfo } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Generate mock data sources
function generateMockDataSources(count: number = 1): EventInfo[] {
  const sources: EventInfo[] = []
  const startDate = new Date('2024-01-01')
  const endDate = new Date('2024-12-31')
  
  for (let i = 0; i < count; i++) {
    sources.push({
      id: `datasource-${i}`,
      plant: 'Test Plant',
      machineNo: `Machine-${i + 1}`,
      label: `Data Source ${i + 1}`,
      labelDescription: 'Test data source for performance comparison',
      event: 'test-event',
      eventDetail: 'Performance test',
      start: startDate.toISOString(),
      end: endDate.toISOString()
    })
  }
  
  return sources
}

// Generate mock chart component
function generateChart(id: string, title: string, type: 'line' | 'scatter' = 'line'): ChartComponent {
  return {
    id,
    title,
    data: [],
    type,
    xAxisType: 'datetime',
    yAxisParams: [
      { parameter: 'temperature', parameterType: 'Parameter', axisName: 'Temperature (°C)' },
      { parameter: 'pressure', parameterType: 'Parameter', axisName: 'Pressure (bar)' },
      { parameter: 'flow', parameterType: 'Parameter', axisName: 'Flow (L/min)' }
    ],
    showLegend: true,
    showTitle: true,
    showXAxis: true,
    showYAxis: true,
    showGrid: true,
    showMarkers: false
  }
}

export default function TestPerformanceComparisonPage() {
  const [chartCount, setChartCount] = useState(4)
  const [dataSourceCount, setDataSourceCount] = useState(2)
  const [isResizing, setIsResizing] = useState(false)
  const [containerWidth, setContainerWidth] = useState(800)
  
  const charts = Array.from({ length: chartCount }, (_, i) => 
    generateChart(`chart-${i}`, `Performance Chart ${i + 1}`, i % 2 === 0 ? 'line' : 'scatter')
  )
  
  const dataSources = generateMockDataSources(dataSourceCount)
  
  // Simulate window resizing
  const simulateResize = () => {
    setIsResizing(true)
    let width = 800
    const interval = setInterval(() => {
      width = 600 + Math.sin(Date.now() / 200) * 200
      setContainerWidth(width)
    }, 16) // 60fps
    
    setTimeout(() => {
      clearInterval(interval)
      setIsResizing(false)
      setContainerWidth(800)
    }, 3000)
  }
  
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Performance Optimization Comparison</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
          <CardDescription>
            Configure test parameters to evaluate performance improvements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4 items-center">
            <span className="text-sm font-medium w-32">Charts:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChartCount(Math.max(1, chartCount - 1))}
            >
              -
            </Button>
            <span className="w-12 text-center">{chartCount}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChartCount(chartCount + 1)}
            >
              +
            </Button>
          </div>
          
          <div className="flex gap-4 items-center">
            <span className="text-sm font-medium w-32">Data Sources:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDataSourceCount(Math.max(1, dataSourceCount - 1))}
            >
              -
            </Button>
            <span className="w-12 text-center">{dataSourceCount}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDataSourceCount(dataSourceCount + 1)}
            >
              +
            </Button>
          </div>
          
          <div className="flex gap-4">
            <Button
              onClick={simulateResize}
              disabled={isResizing}
              variant={isResizing ? "secondary" : "default"}
            >
              {isResizing ? "Resizing..." : "Simulate Resize"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="optimized" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="optimized">Optimized Version</TabsTrigger>
          <TabsTrigger value="status">Performance Status</TabsTrigger>
        </TabsList>
        
        <TabsContent value="optimized">
          <Card>
            <CardHeader>
              <CardTitle>Optimized Charts</CardTitle>
              <CardDescription>
                Using new performance hooks: useChartRenderConfig, useStableMargins, useChartInteractionState
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(chartCount, 2)}, 1fr)`,
                  width: isResizing ? `${containerWidth}px` : '100%',
                  transition: isResizing ? 'none' : 'width 0.3s ease-out'
                }}
              >
                {charts.map((chart) => (
                  <div key={chart.id} className="border rounded-lg p-2 h-[300px]">
                    <ChartPreviewGraph
                      editingChart={chart}
                      selectedDataSourceItems={dataSources}
                      enableZoom={true}
                      enablePan={true}
                      showZoomControls={true}
                      isCompactLayout={true}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="status">
          <Card>
            <CardHeader>
              <CardTitle>Performance Improvements</CardTitle>
              <CardDescription>
                Overview of optimizations implemented
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold">✅ Implemented Optimizations:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li>Consolidated render configuration with stable references</li>
                  <li>Debounced margin calculations (150ms delay)</li>
                  <li>Batched interaction state updates using reducer</li>
                  <li>Deferred dimension updates with React.useDeferredValue</li>
                  <li>Elevated render priority during interactions</li>
                  <li>Optimized tooltip handling during interactions</li>
                  <li>Web Worker integration for large datasets (&gt;10k points)</li>
                  <li>Progressive rendering with progress indicators</li>
                  <li>Error boundaries with recovery mechanisms</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-semibold">📊 Expected Improvements:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                  <li>Smoother resize operations without margin jumping</li>
                  <li>Reduced re-renders during interactions</li>
                  <li>Better performance with multiple charts</li>
                  <li>Non-blocking UI during data processing</li>
                  <li>Graceful error handling with fallbacks</li>
                </ul>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Test Configuration:</strong><br/>
                  Charts: {chartCount} | Data Sources: {dataSourceCount} | 
                  Total Series: {chartCount * dataSourceCount * 3}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}