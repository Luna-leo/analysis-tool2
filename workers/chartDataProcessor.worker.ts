/**
 * Web Worker for processing chart data
 * Handles data sampling, coordinate transformation, and other CPU-intensive tasks
 */

import { SamplingMethod, SamplingOptions, sampleMultipleSeries } from '@/utils/sampling'

// Worker message types
export interface WorkerRequest {
  id: string
  type: 'sample' | 'transform' | 'process'
  data: any
  options?: any
}

export interface WorkerResponse {
  id: string
  type: 'success' | 'error' | 'progress'
  data?: any
  error?: string
  progress?: number
}

// Message handler
self.addEventListener('message', async (event: MessageEvent<WorkerRequest>) => {
  const { id, type, data, options } = event.data

  try {
    switch (type) {
      case 'sample':
        await handleSampling(id, data, options)
        break
      
      case 'transform':
        await handleTransform(id, data, options)
        break
      
      case 'process':
        await handleFullProcess(id, data, options)
        break
      
      default:
        sendError(id, `Unknown request type: ${type}`)
    }
  } catch (error) {
    sendError(id, error instanceof Error ? error.message : 'Unknown error')
  }
})

/**
 * Handle data sampling
 */
async function handleSampling(
  id: string,
  data: any[],
  options: {
    method: SamplingMethod
    targetPoints: number
    chartType: 'line' | 'scatter'
    isTimeSeries: boolean
  }
) {
  // Report progress
  sendProgress(id, 0)

  // Group data by series
  const seriesMap = new Map<string, any[]>()
  data.forEach((point, index) => {
    const series = seriesMap.get(point.series) || []
    series.push(point)
    seriesMap.set(point.series, series)
    
    // Report progress every 1000 points
    if (index % 1000 === 0) {
      sendProgress(id, (index / data.length) * 30) // 30% for grouping
    }
  })

  // Sampling options
  const samplingOptions: SamplingOptions = {
    method: options.method,
    targetPoints: options.targetPoints,
    chartType: options.chartType,
    isTimeSeries: options.isTimeSeries
  }

  // Perform sampling
  const sampledSeriesMap = sampleMultipleSeries(seriesMap, samplingOptions)
  
  // Flatten results
  const sampledData: any[] = []
  let processedSeries = 0
  const totalSeries = sampledSeriesMap.size
  
  sampledSeriesMap.forEach((result) => {
    sampledData.push(...result.data)
    processedSeries++
    sendProgress(id, 30 + (processedSeries / totalSeries) * 70) // 30-100%
  })

  // Sort by time if needed
  if (options.isTimeSeries) {
    sampledData.sort((a, b) => {
      const aTime = a.x instanceof Date ? a.x.getTime() : new Date(a.x).getTime()
      const bTime = b.x instanceof Date ? b.x.getTime() : new Date(b.x).getTime()
      return aTime - bTime
    })
  }

  sendSuccess(id, sampledData)
}

/**
 * Handle coordinate transformation
 */
async function handleTransform(
  id: string,
  data: {
    points: any[]
    xAxisType: string
    xParameter?: string
    yParams: any[]
  },
  options: {
    chunkSize?: number
  }
) {
  const { points, xAxisType, xParameter, yParams } = data
  const chunkSize = options.chunkSize || 1000
  const transformedData: any[] = []
  
  // Process in chunks
  for (let i = 0; i < points.length; i += chunkSize) {
    const chunk = points.slice(i, i + chunkSize)
    const transformedChunk = chunk.flatMap(point => {
      // Transform X value
      let xValue: number | string | Date | undefined
      
      if (xAxisType === 'datetime') {
        xValue = new Date(point.timestamp)
      } else if (xParameter && point[xParameter] !== undefined) {
        const numValue = Number(point[xParameter])
        if (!isNaN(numValue)) {
          xValue = numValue
        }
      }
      
      // Transform Y values
      return yParams
        .filter(yParam => yParam.parameter)
        .map((yParam, index) => {
          const yValue = point[yParam.parameter]
          const numY = typeof yValue === 'string' ? Number(yValue) : yValue
          
          if (xValue !== undefined && typeof numY === 'number' && !isNaN(numY)) {
            return {
              x: xValue,
              y: numY,
              series: yParam.parameter,
              seriesIndex: index,
              timestamp: point.timestamp,
              originalPoint: point
            }
          }
          return null
        })
        .filter(Boolean)
    })
    
    transformedData.push(...transformedChunk)
    sendProgress(id, ((i + chunk.length) / points.length) * 100)
  }

  sendSuccess(id, transformedData)
}

/**
 * Handle full data processing pipeline
 */
async function handleFullProcess(
  id: string,
  data: {
    rawData: any[]
    xAxisType: string
    xParameter?: string
    yParams: any[]
    dataSourceInfo: any[]
  },
  options: {
    enableSampling: boolean
    samplingMethod: SamplingMethod
    targetPoints: number
    chartType: 'line' | 'scatter'
  }
) {
  // Step 1: Transform coordinates (40% progress)
  await handleTransform(
    `${id}-transform`,
    {
      points: data.rawData,
      xAxisType: data.xAxisType,
      xParameter: data.xParameter,
      yParams: data.yParams
    },
    { chunkSize: 1000 }
  )
  
  // Get transformed data from the internal result
  const transformedData = await getInternalResult(`${id}-transform`)
  sendProgress(id, 40)
  
  // Step 2: Apply data source info
  const enrichedData = transformedData.map((point: any, index: number) => {
    const dataSourceIndex = Math.floor(index / data.yParams.length)
    const dataSource = data.dataSourceInfo[dataSourceIndex]
    
    return {
      ...point,
      dataSourceId: dataSource?.id,
      dataSourceLabel: dataSource?.label,
      dataSourceIndex
    }
  })
  sendProgress(id, 60)
  
  // Step 3: Apply sampling if enabled
  if (options.enableSampling && enrichedData.length > options.targetPoints) {
    await handleSampling(
      `${id}-sample`,
      enrichedData,
      {
        method: options.samplingMethod,
        targetPoints: options.targetPoints,
        chartType: options.chartType,
        isTimeSeries: data.xAxisType === 'datetime'
      }
    )
    
    const sampledData = await getInternalResult(`${id}-sample`)
    sendSuccess(id, sampledData)
  } else {
    sendSuccess(id, enrichedData)
  }
}

// Internal result storage for multi-step processing
const internalResults = new Map<string, any>()

async function getInternalResult(id: string): Promise<any> {
  return new Promise((resolve) => {
    const checkResult = () => {
      if (internalResults.has(id)) {
        const result = internalResults.get(id)
        internalResults.delete(id)
        resolve(result)
      } else {
        setTimeout(checkResult, 10)
      }
    }
    checkResult()
  })
}

// Helper functions for sending messages
function sendSuccess(id: string, data: any) {
  // Store for internal use if needed
  if (id.includes('-')) {
    internalResults.set(id, data)
  } else {
    self.postMessage({
      id,
      type: 'success',
      data
    } as WorkerResponse)
  }
}

function sendError(id: string, error: string) {
  self.postMessage({
    id,
    type: 'error',
    error
  } as WorkerResponse)
}

function sendProgress(id: string, progress: number) {
  // Only send progress for main requests, not internal sub-requests
  if (!id.includes('-')) {
    self.postMessage({
      id,
      type: 'progress',
      progress: Math.round(progress)
    } as WorkerResponse)
  }
}

// Export as default for Next.js worker handling
export default null