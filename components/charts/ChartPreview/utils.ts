import * as d3 from "d3"
import { ChartComponent, EventInfo } from "@/types"

export const getTimeFormat = (startDate: Date, endDate: Date): string => {
  const duration = endDate.getTime() - startDate.getTime()
  const hours = duration / (1000 * 60 * 60)
  const days = hours / 24
  
  if (days > 365) {
    return "%Y-%m"  // Year-Month for ranges over a year
  } else if (days > 30) {
    return "%m/%d"  // Month/Day for ranges over a month
  } else if (days > 7) {
    return "%m/%d"  // Month/Day for ranges over a week
  } else if (days > 1) {
    return "%m/%d %H:%M"  // Date and time for multi-day ranges
  } else if (hours > 6) {
    return "%H:%M"  // Hours:Minutes for ranges over 6 hours
  } else {
    return "%H:%M:%S"  // Include seconds for short ranges
  }
}

export const generateMockData = (editingChart: ChartComponent, selectedDataSourceItems: EventInfo[]) => {
  if (!editingChart.yAxisParams?.length) {
    return []
  }

  const data: Array<{ timestamp: Date; [key: string]: Date | number }> = []
  
  // Determine time range for data generation
  let startTime: Date
  let endTime: Date
  
  // Use X-axis range if custom range is set
  if (editingChart.xAxisRange?.auto === false && editingChart.xAxisRange.min && editingChart.xAxisRange.max) {
    if ((editingChart.xAxisType || "datetime") === "datetime") {
      startTime = new Date(editingChart.xAxisRange.min)
      endTime = new Date(editingChart.xAxisRange.max)
    } else {
      // Fallback to data source or default
      if (selectedDataSourceItems.length > 0) {
        startTime = new Date(selectedDataSourceItems[0].start)
        endTime = new Date(selectedDataSourceItems[0].end)
      } else {
        const now = new Date()
        startTime = new Date(now.getTime() - 60 * 60 * 1000)
        endTime = now
      }
    }
  } else {
    // Use data source range or default
    if (selectedDataSourceItems.length > 0) {
      // Calculate overall range from all data sources
      let earliestStart: Date | null = null
      let latestEnd: Date | null = null

      selectedDataSourceItems.forEach(dataSource => {
        const sourceStart = new Date(dataSource.start)
        const sourceEnd = new Date(dataSource.end)

        if (!isNaN(sourceStart.getTime())) {
          if (!earliestStart || sourceStart < earliestStart) {
            earliestStart = sourceStart
          }
        }

        if (!isNaN(sourceEnd.getTime())) {
          if (!latestEnd || sourceEnd > latestEnd) {
            latestEnd = sourceEnd
          }
        }
      })

      if (earliestStart && latestEnd) {
        startTime = earliestStart
        endTime = latestEnd
      } else {
        // Fallback to first data source
        startTime = new Date(selectedDataSourceItems[0].start)
        endTime = new Date(selectedDataSourceItems[0].end)
      }
    } else {
      const now = new Date()
      startTime = new Date(now.getTime() - 60 * 60 * 1000)
      endTime = now
    }
  }

  // Validate dates
  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    const now = new Date()
    startTime = new Date(now.getTime() - 60 * 60 * 1000)
    endTime = now
  }

  const duration = endTime.getTime() - startTime.getTime()
  const points = Math.min(50, Math.max(10, Math.floor(duration / (5 * 60 * 1000))))

  for (let i = 0; i < points; i++) {
    const timestamp = new Date(startTime.getTime() + (i * duration / (points - 1)))
    const dataPoint: { timestamp: Date; [key: string]: Date | number } = { timestamp }

    editingChart.yAxisParams.forEach((param) => {
      if (param.parameter) {
        const baseValue = Math.random() * 50 + 25
        const variation = Math.sin(i * 0.3) * 10
        dataPoint[param.parameter] = Math.max(0, baseValue + variation)
      }
    })

    data.push(dataPoint)
  }

  return data
}