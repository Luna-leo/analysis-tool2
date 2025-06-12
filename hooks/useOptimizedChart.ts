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
}

export function useOptimizedChart({
  editingChart,
  selectedDataSourceItems,
  maxDataPoints = 500
}: UseOptimizedChartProps): OptimizedChartData {
  const { getParameterData } = useCSVDataStore()
  const dataCache = useSharedDataCache()
  const loadingRef = useRef(false)
  const errorRef = useRef<Error | null>(null)
  const dataRef = useRef<ChartDataPoint[]>([])
  const [version, setVersion] = React.useState(0)

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
        dataRef.current = []
        loadingRef.current = false
        setVersion(v => v + 1)
        return
      }
      
      loadingRef.current = true
      errorRef.current = null
      setVersion(v => v + 1)
      
      const allData: ChartDataPoint[] = []
      
      try {
        // Fetch data with caching
        await Promise.all(
          selectedDataSourceItems.map(async (dataSource) => {
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
                  xValue = point.timestamp
                } else if (rawXValue !== undefined) {
                  xValue = Number(rawXValue)
                }
                
                editingChart.yAxisParams?.forEach((yParam, index) => {
                  const cleanParam = yParam.parameter.includes('|') 
                    ? yParam.parameter.split('|')[0] 
                    : yParam.parameter
                  
                  let yValue = point[cleanParam]
                  
                  if (typeof yValue === 'string' && !isNaN(Number(yValue))) {
                    yValue = Number(yValue)
                  }
                  
                  if (xValue !== undefined && typeof yValue === 'number' && !isNaN(yValue)) {
                    allData.push({
                      x: xValue,
                      y: yValue,
                      series: yParam.parameter,
                      seriesIndex: index,
                      timestamp: point.timestamp,
                      dataSourceId: dataSource.id,
                      dataSourceLabel: dataSource.label
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
            // Sort by x value for proper sampling
            seriesData.sort((a, b) => {
              if (a.x < b.x) return -1
              if (a.x > b.x) return 1
              return 0
            })
            
            const sampled = adaptiveSample(
              seriesData.map(p => ({ ...p, x: Number(new Date(p.x)), y: p.y })),
              pointsPerSeries
            ).map(p => ({ ...p, x: seriesData[0].x instanceof Date ? new Date(p.x) : p.x }))
            
            sampledData.push(...sampled as ChartDataPoint[])
          })
        }
        
        dataRef.current = sampledData
      } catch (error) {
        console.error('Error loading chart data:', error)
        errorRef.current = error as Error
      } finally {
        loadingRef.current = false
        setVersion(v => v + 1)
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
    data: dataRef.current,
    isLoading: loadingRef.current,
    error: errorRef.current
  }
}