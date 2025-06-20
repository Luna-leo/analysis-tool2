import React, { useRef, useMemo, useEffect } from 'react'
import { debounce } from 'lodash'
import { ChartComponent, EventInfo } from '@/types'
import { useCSVDataStore } from '@/stores/useCSVDataStore'
import { useSharedDataCache } from './useSharedDataCache'
import { sampleData, sampleMultipleSeries, SamplingOptions } from '@/utils/sampling'
import { useSettingsStore } from '@/stores/useSettingsStore'

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
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)
  const [data, setData] = React.useState<ChartDataPoint[]>([])
  const loadingRef = useRef(false)
  
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

  // Memoize parameters
  const allParameters = useMemo(() => {
    if (!yAxisParams?.length) return []
    
    const params: string[] = []
    if (xAxisType !== 'datetime' && xParameter) {
      const cleanXParam = xParameter.includes('|') 
        ? xParameter.split('|')[0] 
        : xParameter
      params.push(cleanXParam)
    }
    
    yAxisParams.forEach(yParam => {
      if (yParam.parameter) {
        const cleanParam = yParam.parameter.includes('|') 
          ? yParam.parameter.split('|')[0] 
          : yParam.parameter
        if (!params.includes(cleanParam)) {
          params.push(cleanParam)
        }
      }
    })
    return params
  }, [xAxisType, xParameter, yAxisParams])

  // Debounced data loading
  const loadData = useMemo(
    () => debounce(async () => {
      // Debug logging disabled to reduce console spam
      // Uncomment for debugging if needed
      // if (process.env.NODE_ENV === 'development') {
      //   console.log(`[useOptimizedChart ${editingChart.id}] Loading data:`, {
      //     dataSourceCount: selectedDataSourceItems.length,
      //     dataSources: selectedDataSourceItems.map(ds => ({ id: ds.id, label: ds.label })),
      //     xAxisType,
      //     parametersCount: allParameters.length
      //   })
      // }
      
      if (selectedDataSourceItems.length === 0 || 
          (xAxisType !== 'datetime' && allParameters.length === 0)) {
        setData([])
        setIsLoading(false)
        loadingRef.current = false
        return
      }
      
      // Prevent concurrent loads
      if (loadingRef.current) {
        return
      }
      
      loadingRef.current = true
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
              () => getParameterDataRef.current(dataSource.id, allParameters)
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
                } else if (rawXValue !== undefined) {
                  const numValue = Number(rawXValue)
                  // Only use the value if it's a valid number
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
          const samplingOptions: SamplingOptions = {
            method: settings.performanceSettings.dataProcessing.samplingMethod === 'none' 
              ? 'none' 
              : settings.performanceSettings.dataProcessing.samplingMethod,
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
        loadingRef.current = false
        setIsLoading(false)
      }
    }, 300),
    [selectedDataSourceItems, allParameters, xAxisType, xParameter, yAxisParams, effectiveMaxDataPoints, enableSampling]
  )

  // Trigger data loading when dependencies change
  useEffect(() => {
    loadData()
    return () => {
      loadData.cancel()
    }
  }, [loadData])

  return {
    data,
    isLoading,
    error
  }
}