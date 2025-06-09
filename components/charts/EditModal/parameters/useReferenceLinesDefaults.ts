import { ChartComponent, EventInfo } from "@/types"

export function useReferenceLinesDefaults(
  editingChart: ChartComponent,
  selectedDataSourceItems: EventInfo[]
) {
  const formatDateTimeForInput = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
  }

  const getDefaultValues = () => {
    const now = new Date()
    let defaultXValue = ""
    let defaultYValue = "50" // Always use midpoint of 0-100 range

    // Calculate default X value based on chart's X-axis type
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

    return { defaultXValue, defaultYValue }
  }

  return {
    formatDateTimeForInput,
    getDefaultValues
  }
}