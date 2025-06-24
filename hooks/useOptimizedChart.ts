import React, { useRef, useMemo, useEffect, useCallback } from 'react'
import { debounce } from 'lodash'
import { ChartComponent, EventInfo } from '@/types'
import { useCSVDataStore } from '@/stores/useCSVDataStore'
import { useSharedDataCache } from './useSharedDataCache'
import { sampleMultipleSeries, SamplingOptions, SamplingMethod } from '@/utils/sampling'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useChartLoadingStore } from '@/stores/useChartLoadingStore'

// Constants
const DATA_LOAD_DEBOUNCE_MS = 300

interface UseOptimizedChartProps {
  editingChart: ChartComponent
  selectedDataSourceItems: EventInfo[]
  maxDataPoints?: number
}

interface OptimizedChartData {
  data: ChartDataPoint[]
  isLoading: boolean
  error: Error | null
}

interface ChartDataPoint {
  x: number | string | Date
  y: number
  series: string
  seriesIndex: number
  timestamp: string
  dataSourceId: string
  dataSourceLabel: string
  dataSourceIndex?: number
  paramIndex?: number  // Add parameter index for parameter-based styling
}

export function useOptimizedChart({
  editingChart,
  selectedDataSourceItems,
  maxDataPoints
}: UseOptimizedChartProps): OptimizedChartData {
  const { getParameterData } = useCSVDataStore()
  const dataCache = useSharedDataCache()
  const { settings } = useSettingsStore()
  const { registerLoading, unregisterLoading } = useChartLoadingStore()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)
  const [data, setData] = React.useState<ChartDataPoint[]>([])
  // loadingRef removed - debounce handles duplicate request prevention
  
  // Use refs to maintain stable references
  const getParameterDataRef = useRef(getParameterData)
  const dataCacheRef = useRef(dataCache)
  
  // Update refs when the actual functions change
  useEffect(() => {
    getParameterDataRef.current = getParameterData
  }, [getParameterData])
  
  useEffect(() => {
    dataCacheRef.current = dataCache
  }, [dataCache])
  
  // Extract only what we need from settings to avoid unnecessary re-renders
  const enableSampling = settings.performanceSettings.dataProcessing.enableSampling
  const defaultSamplingPoints = settings.performanceSettings.dataProcessing.defaultSamplingPoints
  
  // Use settings to determine default max data points
  const defaultMaxDataPoints = enableSampling
    ? defaultSamplingPoints
    : Number.MAX_SAFE_INTEGER
  const effectiveMaxDataPoints = maxDataPoints ?? defaultMaxDataPoints
  
  // Extract only data-relevant properties from editingChart
  const xAxisType = editingChart.xAxisType
  const xParameter = editingChart.xParameter
  const yAxisParams = editingChart.yAxisParams
  
  // Track previous xAxisType to detect changes
  const prevXAxisTypeRef = useRef(xAxisType)
  
  // Clear cache when xAxisType changes
  useEffect(() => {
    if (prevXAxisTypeRef.current !== undefined && prevXAxisTypeRef.current !== xAxisType) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[useOptimizedChart ${editingChart.id}] X-axis type changed from ${prevXAxisTypeRef.current} to ${xAxisType}, clearing cache`)
      }
      dataCache.clear()
      prevXAxisTypeRef.current = xAxisType
      // Force immediate data reload
      setData([])
      setIsLoading(true)
    } else if (prevXAxisTypeRef.current === undefined) {
      prevXAxisTypeRef.current = xAxisType
    }
  }, [xAxisType, dataCache, editingChart.id])

  // Memoize parameters - include all parameters without deduplication
  // This ensures that changes to any Y parameter trigger data reload
  const allParameters = useMemo(() => {
    if (!yAxisParams?.length) return []
    
    const params: string[] = []
    
    // Add X parameter if not datetime
    if (xAxisType !== 'datetime' && xParameter) {
      const cleanXParam = xParameter.includes('|') 
        ? xParameter.split('|')[0] 
        : xParameter
      params.push(cleanXParam)
    }
    
    // Add all Y parameters without deduplication
    // This ensures each parameter change triggers data reload
    yAxisParams.forEach(yParam => {
      if (yParam.parameter) {
        const cleanParam = yParam.parameter.includes('|') 
          ? yParam.parameter.split('|')[0] 
          : yParam.parameter
        params.push(cleanParam)
      }
    })
    
    // Return unique parameters for data fetching
    return [...new Set(params)]
  }, [xAxisType, xParameter, yAxisParams])

  // Create a stable key from yAxisParams to trigger reloads on parameter changes
  const yAxisParamsKey = useMemo(() => {
    return yAxisParams?.map(param => `${param.parameterType}:${param.parameter}`).join('|') || ''
  }, [yAxisParams])

  // Create debounced function with cancel capability
  const debouncedLoadDataRef = useRef<ReturnType<typeof debounce> | null>(null)
  
  // Debounced data loading
  const loadData = useCallback(async () => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[useOptimizedChart ${editingChart.id}] Loading data:`, {
          dataSourceCount: selectedDataSourceItems.length,
          xAxisType,
          xParameter,
          parametersCount: allParameters.length,
          yAxisParamsKey
        })
      }
      
      if (selectedDataSourceItems.length === 0) {
        setData([])
        setIsLoading(false)
        return
      }
      
      // For non-datetime axis types, we need at least the x parameter
      if (xAxisType !== 'datetime' && !xParameter) {
        if (process.env.NODE_ENV === 'development') {
        console.warn(`[useOptimizedChart ${editingChart.id}] No x parameter for ${xAxisType} axis type`)
      }
        setData([])
        setIsLoading(false)
        return
      }
      
      // Set loading state
      setIsLoading(true)
      setError(null)
      
      const allData: ChartDataPoint[] = []
      
      // Get valid Y parameters
      const validYParams = yAxisParams?.filter(
        param => param.parameter && param.parameter.trim() !== ''
      ) || []
      
      try {
        // Fetch data with caching
        await Promise.all(
          selectedDataSourceItems.map(async (dataSource, dataSourceIndex) => {
            const csvData = await dataCacheRef.current.get(
              dataSource.id,
              allParameters,
              () => getParameterDataRef.current(dataSource.id, allParameters),
              xAxisType,
              yAxisParamsKey
            )
            
            // Debug logging removed to reduce console spam
            // Uncomment for debugging if needed
            // console.log(`[useOptimizedChart] Data fetch for ${dataSource.id}:`, {
            //   dataSourceId: dataSource.id,
            //   dataSourceLabel: dataSource.label,
            //   requestedParams: allParameters,
            //   dataLength: csvData?.length || 0,
            //   hasData: !!csvData && csvData.length > 0
            // })
            
            if (csvData && csvData.length > 0) {
              csvData.forEach(point => {
                const cleanXParam = xParameter?.includes('|') 
                  ? xParameter.split('|')[0] 
                  : xParameter
                
                const rawXValue = cleanXParam ? point[cleanXParam] : undefined
                let xValue: number | string | Date | undefined
                
                if (xAxisType === 'datetime') {
                  // Ensure timestamp is a Date object (timestamp is always a string in DataPoint)
                  xValue = new Date(point.timestamp)
                } else if (xAxisType === 'parameter' && rawXValue !== undefined) {
                  // For parameter type, ensure we get numeric values
                  const numValue = Number(rawXValue)
                  // Only use the value if it's a valid number
                  if (!isNaN(numValue)) {
                    xValue = numValue
                  }
                } else if (xAxisType === 'time' && rawXValue !== undefined) {
                  // For time type, also convert to numeric
                  const numValue = Number(rawXValue)
                  if (!isNaN(numValue)) {
                    xValue = numValue
                  }
                }
                
                validYParams.forEach((yParam, index) => {
                  const cleanParam = yParam.parameter.includes('|') 
                    ? yParam.parameter.split('|')[0] 
                    : yParam.parameter
                  
                  let yValue = point[cleanParam]
                  
                  if (typeof yValue === 'string' && !isNaN(Number(yValue))) {
                    yValue = Number(yValue)
                  }
                  
                  if (xValue !== undefined && typeof yValue === 'number' && !isNaN(yValue)) {
                    // Create unique seriesIndex based on both dataSource and yParam
                    const uniqueSeriesIndex = dataSourceIndex * validYParams.length + index
                    
                    allData.push({
                      x: xValue,
                      y: yValue,
                      series: `${dataSource.label} - ${yParam.parameter}`,  // Include dataSource in series name
                      seriesIndex: uniqueSeriesIndex,
                      timestamp: point.timestamp,
                      dataSourceId: dataSource.id,
                      dataSourceLabel: dataSource.label,
                      dataSourceIndex: dataSourceIndex,  // Add dataSourceIndex for consistent coloring
                      paramIndex: index  // Add parameter index for parameter-based styling
                    })
                  }
                })
              })
            }
          })
        )
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[useOptimizedChart ${editingChart.id}] Generated data:`, {
            totalPoints: allData.length,
            xAxisType,
            xParameter,
            sampleData: allData.slice(0, 5).map(d => ({
              x: d.x,
              xType: typeof d.x,
              xIsDate: d.x instanceof Date,
              y: d.y,
              series: d.series
            }))
          })
        }
        
        // Apply data sampling if needed
        let sampledData = allData
        if (settings.performanceSettings.dataProcessing.enableSampling && allData.length > effectiveMaxDataPoints) {
          
          // Group by series for batch sampling
          const seriesMap = new Map<string, ChartDataPoint[]>()
          allData.forEach(point => {
            const series = seriesMap.get(point.series) || []
            series.push(point)
            seriesMap.set(point.series, series)
          })
          
          // Prepare sampling options
          let samplingMethod: SamplingMethod = 'adaptive' // default
          if (settings.performanceSettings.dataProcessing.samplingMethod === 'none') {
            samplingMethod = 'none'
          } else if (settings.performanceSettings.dataProcessing.samplingMethod === 'auto') {
            // Pass 'auto' through to let the sampling module handle it with adaptive sampling
            samplingMethod = 'auto'
          } else if (['lttb', 'nth-point', 'adaptive', 'douglas-peucker'].includes(settings.performanceSettings.dataProcessing.samplingMethod)) {
            samplingMethod = settings.performanceSettings.dataProcessing.samplingMethod as SamplingMethod
          }
          
          const samplingOptions: SamplingOptions = {
            method: samplingMethod,
            targetPoints: effectiveMaxDataPoints,
            chartType: editingChart.type === 'scatter' ? 'scatter' : 'line',
            isTimeSeries: xAxisType === 'datetime'
          }
          
          // Use batch sampling for better performance
          const sampledSeriesMap = sampleMultipleSeries(seriesMap, samplingOptions)
          
          sampledData = []
          sampledSeriesMap.forEach((result) => {
            sampledData.push(...result.data)
          })
          
          // Sort final data by x value if needed
          if (xAxisType === 'datetime') {
            sampledData.sort((a, b) => {
              const aTime = a.x instanceof Date ? a.x.getTime() : new Date(a.x).getTime()
              const bTime = b.x instanceof Date ? b.x.getTime() : new Date(b.x).getTime()
              return aTime - bTime
            })
          }
        }
        
        setData(sampledData)
      } catch (error) {
        console.error('Error loading chart data:', error)
        setError(error as Error)
      } finally {
        setIsLoading(false)
      }
    },
    [selectedDataSourceItems, allParameters, xAxisType, xParameter, yAxisParamsKey, effectiveMaxDataPoints, enableSampling, editingChart.id]
  )

  // Create debounced version of loadData
  useEffect(() => {
    // Cancel previous debounced function
    if (debouncedLoadDataRef.current) {
      debouncedLoadDataRef.current.cancel()
    }
    
    // Create new debounced function
    debouncedLoadDataRef.current = debounce(loadData, DATA_LOAD_DEBOUNCE_MS)
    
    // Call it immediately
    debouncedLoadDataRef.current()
    
    // Cleanup
    return () => {
      if (debouncedLoadDataRef.current) {
        debouncedLoadDataRef.current.cancel()
      }
    }
  }, [loadData])

  // Register loading state in global store
  useEffect(() => {
    if (isLoading) {
      registerLoading(editingChart.id)
    } else {
      unregisterLoading(editingChart.id)
    }
    
    // Cleanup on unmount
    return () => {
      unregisterLoading(editingChart.id)
    }
  }, [isLoading, editingChart.id, registerLoading, unregisterLoading])

  return {
    data,
    isLoading,
    error
  }
}