import { ChartComponent, EventInfo } from "@/types"
import { formatDateTimeForInput } from "@/utils/dateUtils"
import { useOptimizedChart } from "@/hooks/useOptimizedChart"
import { ChartScalesContext } from "@/contexts/ChartScalesContext"
import { useContext } from "react"

export function useReferenceLinesDefaults(
  editingChart: ChartComponent,
  selectedDataSourceItems: EventInfo[],
  currentScales?: {
    xDomain: [any, any]
    yDomain: [number, number]
    xAxisType: string
  } | null
) {
  // Try to get scales from context if not provided
  const contextScales = useContext(ChartScalesContext)
  
  // Use provided scales or context scales
  const scalesData = currentScales || (contextScales?.scales?.xDomain && contextScales?.scales?.yDomain ? contextScales.scales : null)
  
  // Load actual chart data
  const { data: chartData } = useOptimizedChart({
    editingChart,
    selectedDataSourceItems,
    maxDataPoints: 10000 // We don't need all points, just enough to calculate range
  })

  const getDefaultValues = () => {
    const now = new Date()
    let defaultXValue = ""
    let defaultYValue = ""

    // If current scales are available, use them for midpoint calculation
    if (scalesData) {
      // Use visible Y domain for Y value
      if (scalesData.yDomain) {
        const [yMin, yMax] = scalesData.yDomain
        defaultYValue = ((yMin + yMax) / 2).toString()
        
      }
      
      // Use visible X domain for X value
      if (scalesData.xDomain) {
        const [xMin, xMax] = scalesData.xDomain
        
        if (scalesData.xAxisType === "datetime") {
          // For datetime axis, calculate midpoint between dates
          const minTime = xMin instanceof Date ? xMin.getTime() : new Date(xMin).getTime()
          const maxTime = xMax instanceof Date ? xMax.getTime() : new Date(xMax).getTime()
          const midTime = new Date((minTime + maxTime) / 2)
          defaultXValue = formatDateTimeForInput(midTime)
          
        } else {
          // For numeric axes
          const midpoint = (Number(xMin) + Number(xMax)) / 2
          defaultXValue = midpoint.toString()
          
        }
      }
      
      // If we have both values from current scales, return early
      if (defaultXValue && defaultYValue) {
        return { defaultXValue, defaultYValue }
      }
    }

    // Fallback: Calculate default Y value based on Y-axis range
    if (!defaultYValue && editingChart.yAxisParams && editingChart.yAxisParams.length > 0) {
      
      // Find the first Y parameter with a manual range (auto = false)
      const paramWithRange = editingChart.yAxisParams.find(param => 
        param.range && 
        param.range.auto === false && 
        param.range.min !== undefined && 
        param.range.max !== undefined
      )
      
      if (paramWithRange && paramWithRange.range) {
        // Use midpoint of the manual range
        const midpoint = (paramWithRange.range.min + paramWithRange.range.max) / 2
        defaultYValue = midpoint.toString()
        
      } else {
        // If no manual range is set, try to calculate from actual chart data
        if (chartData && chartData.length > 0) {
          // Extract Y values from chart data
          const yValues: number[] = []
          
          chartData.forEach((dataPoint: any, index: number) => {
            
            // The chartData from useOptimizedChart has y values directly
            if (typeof dataPoint.y === 'number') {
              yValues.push(dataPoint.y)
            }
          })
          
          if (yValues.length > 0) {
            // Calculate min and max from data
            const min = Math.min(...yValues)
            const max = Math.max(...yValues)
            
            // Apply nice rounding similar to D3's nice() function
            const range = max - min
            let niceMin = min
            let niceMax = max
            
            if (range > 0) {
              // Find a nice round interval
              const power = Math.pow(10, Math.floor(Math.log10(range)))
              const fraction = range / power
              let niceFraction: number
              
              if (fraction <= 1) niceFraction = 1
              else if (fraction <= 2) niceFraction = 2
              else if (fraction <= 5) niceFraction = 5
              else niceFraction = 10
              
              const niceInterval = niceFraction * power
              
              // Round min down and max up to nice values
              niceMin = Math.floor(min / niceInterval) * niceInterval
              niceMax = Math.ceil(max / niceInterval) * niceInterval
              
              // Ensure non-negative data doesn't get negative domain
              if (min >= 0 && niceMin < 0) {
                niceMin = 0
              }
            } else {
              // All values are the same
              const padding = Math.abs(min) * 0.1 || 1
              niceMin = min - padding
              niceMax = max + padding
            }
            
            // Calculate midpoint
            const midpoint = (niceMin + niceMax) / 2
            defaultYValue = midpoint.toString()
            
          } else {
            // No valid Y values found in data
            defaultYValue = "50"
            
          }
        } else {
          // No data available
          defaultYValue = "50"
          
        }
      }
    }

    // Fallback: Calculate default X value based on chart's X-axis type
    if (!defaultXValue) {
      const xAxisType = editingChart.xAxisType || "datetime"
      
      if (xAxisType === "datetime") {
        // If data sources are available and have valid dates, use their midpoint
        if (selectedDataSourceItems.length > 0) {
          const validDates: Date[] = []

          selectedDataSourceItems.forEach(dataSource => {
            const startTime = new Date(dataSource.start)
            const endTime = new Date(dataSource.end)

            if (!isNaN(startTime.getTime())) {
              validDates.push(startTime)
            }
            if (!isNaN(endTime.getTime())) {
              validDates.push(endTime)
            }
          })
          
          if (validDates.length >= 2) {
            const sortedDates = validDates.sort((a, b) => a.getTime() - b.getTime())
            const earliestStart = sortedDates[0]
            const latestEnd = sortedDates[sortedDates.length - 1]
            const midTime = new Date((earliestStart.getTime() + latestEnd.getTime()) / 2)
            defaultXValue = formatDateTimeForInput(midTime)
          } else {
            // Default: midpoint between 1 month ago and now
            const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            const midTime = new Date((oneMonthAgo.getTime() + now.getTime()) / 2)
            defaultXValue = formatDateTimeForInput(midTime)
          }
        } else {
          // Default: midpoint between 1 month ago and now
          const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          const midTime = new Date((oneMonthAgo.getTime() + now.getTime()) / 2)
          defaultXValue = formatDateTimeForInput(midTime)
        }
      } else if (xAxisType === "time") {
        // Time (elapsed): midpoint of 0-30 minutes
        defaultXValue = "15"
      } else {
        // Parameter: midpoint of 0-100
        defaultXValue = "50"
      }
    }

    return { defaultXValue, defaultYValue }
  }

  return {
    formatDateTimeForInput,
    getDefaultValues
  }
}