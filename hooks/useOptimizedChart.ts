import React, { useCallback, useRef, useMemo, useEffect } from 'react'
import { debounce } from 'lodash'
import { ChartComponent, EventInfo } from '@/types'
import { CSVDataPoint, useCSVDataStore } from '@/stores/useCSVDataStore'
import { useSharedDataCache } from './useSharedDataCache'
import { adaptiveSample } from '@/utils/dataSampling'

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
}

export function useOptimizedChart({
  editingChart,
  selectedDataSourceItems,
  maxDataPoints = 500
}: UseOptimizedChartProps): OptimizedChartData {
  const { getParameterData } = useCSVDataStore()
  const dataCache = useSharedDataCache()
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)
  const [data, setData] = React.useState<ChartDataPoint[]>([])
  const loadingRef = useRef(false)

  // Memoize parameters
  const allParameters = useMemo(() => {
    if (!editingChart.yAxisParams?.length) return []
    
    const params: string[] = []
    if (editingChart.xAxisType !== 'datetime' && editingChart.xParameter) {
      const cleanXParam = editingChart.xParameter.includes('|') 
        ? editingChart.xParameter.split('|')[0] 
        : editingChart.xParameter
      params.push(cleanXParam)
    }
    
    editingChart.yAxisParams.forEach(yParam => {
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
  }, [editingChart.xAxisType, editingChart.xParameter, editingChart.yAxisParams])

  // Debounced data loading
  const loadData = useMemo(
    () => debounce(async () => {
      if (selectedDataSourceItems.length === 0 || 
          (editingChart.xAxisType !== 'datetime' && allParameters.length === 0)) {
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
      const validYParams = editingChart.yAxisParams?.filter(
        param => param.parameter && param.parameter.trim() !== ''
      ) || []
      
      try {
        // Fetch data with caching
        await Promise.all(
          selectedDataSourceItems.map(async (dataSource, dataSourceIndex) => {
            const csvData = await dataCache.get(
              dataSource.id,
              allParameters,
              () => getParameterData(dataSource.id, allParameters)
            )
            
            if (csvData && csvData.length > 0) {
              csvData.forEach(point => {
                const cleanXParam = editingChart.xParameter?.includes('|') 
                  ? editingChart.xParameter.split('|')[0] 
                  : editingChart.xParameter
                
                const rawXValue = cleanXParam ? point[cleanXParam] : undefined
                let xValue: number | string | Date | undefined
                
                if (editingChart.xAxisType === 'datetime') {
                  // Ensure timestamp is a Date object
                  xValue = point.timestamp instanceof Date ? point.timestamp : new Date(point.timestamp)
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
                      dataSourceIndex: dataSourceIndex  // Add dataSourceIndex for consistent coloring
                    })
                  }
                })
              })
            }
          })
        )
        
        // Apply data sampling if needed
        let sampledData = allData
        if (allData.length > maxDataPoints) {
          // Group by series and sample each series separately
          const seriesMap = new Map<string, ChartDataPoint[]>()
          allData.forEach(point => {
            const series = seriesMap.get(point.series) || []
            series.push(point)
            seriesMap.set(point.series, series)
          })
          
          sampledData = []
          const pointsPerSeries = Math.floor(maxDataPoints / seriesMap.size)
          
          seriesMap.forEach((seriesData) => {
            // Filter out invalid data points
            const validData = seriesData.filter(p => p && p.x !== undefined && p.y !== undefined)
            
            if (validData.length === 0) return
            
            // Sort by x value for proper sampling
            validData.sort((a, b) => {
              if (a.x < b.x) return -1
              if (a.x > b.x) return 1
              return 0
            })
            
            const sampled = adaptiveSample(
              validData.map(p => ({ 
                ...p, 
                x: editingChart.xAxisType === 'datetime' && p.x instanceof Date 
                  ? Number(p.x) 
                  : typeof p.x === 'number' ? p.x : Number(p.x || 0), 
                y: p.y 
              })),
              pointsPerSeries
            ).map(p => ({ 
              ...p, 
              x: editingChart.xAxisType === 'datetime' && validData[0]?.x instanceof Date 
                ? new Date(p.x) 
                : p.x 
            }))
            
            sampledData.push(...sampled as ChartDataPoint[])
          })
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
    [selectedDataSourceItems, allParameters, editingChart, getParameterData, dataCache, maxDataPoints]
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