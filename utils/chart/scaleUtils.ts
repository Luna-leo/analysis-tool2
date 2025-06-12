import { ChartComponent } from "@/types"
// Define ChartDataPoint interface here to avoid circular dependency
interface ChartDataPoint {
  x: number | string | Date
  y: number
  series: string
  seriesIndex: number
  timestamp: string
  dataSourceId: string
  dataSourceLabel: string
}

/**
 * Calculate consistent Y domain that includes both data and reference lines
 * This ensures reference lines appear at the same position in all contexts
 */
export function calculateConsistentYDomain(
  data: ChartDataPoint[] | Array<{ y: number }>,
  chart: ChartComponent,
  padding: number = 0.1
): [number, number] {
  // Check if any Y parameter has manual range set (auto = false)
  // Since all parameters on the same axis should have the same range,
  // we just need to check the first one with a valid range setting
  const yParamsWithRange = chart.yAxisParams?.filter(param => 
    param.range && param.range.auto === false && 
    param.range.min !== undefined && 
    param.range.max !== undefined
  )
  
  if (yParamsWithRange && yParamsWithRange.length > 0) {
    // Use the manual range from the first parameter with manual range
    const manualRange = yParamsWithRange[0].range!
    return [manualRange.min, manualRange.max]
  }
  
  const values: number[] = []
  
  // Add data values
  if (data.length > 0) {
    values.push(...data.map(d => d.y))
  }
  
  // Add reference line values
  if (chart.referenceLines) {
    chart.referenceLines.forEach(line => {
      if (line.type === 'horizontal' && typeof line.value === 'number') {
        values.push(line.value)
      }
    })
  }
  
  // If no values, use sensible defaults
  if (values.length === 0) {
    return [0, 100]
  }
  
  // Calculate min and max with padding
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  
  return [
    min - range * padding,
    max + range * padding
  ]
}

/**
 * Calculate consistent X domain for datetime axis
 */
export function calculateConsistentXDomain(
  data: ChartDataPoint[],
  chart: ChartComponent,
  padding: number = 0.05
): [Date, Date] {
  const timestamps: number[] = []
  
  // Add data timestamps
  if (data.length > 0) {
    data.forEach(d => {
      if (d.x instanceof Date) {
        timestamps.push(d.x.getTime())
      }
    })
  }
  
  // Add reference line timestamps
  if (chart.referenceLines) {
    chart.referenceLines.forEach(line => {
      if (line.type === 'vertical' && typeof line.value === 'string') {
        const date = new Date(line.value)
        if (!isNaN(date.getTime())) {
          timestamps.push(date.getTime())
        }
      }
    })
  }
  
  // If no timestamps, use current time range
  if (timestamps.length === 0) {
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    return [dayAgo, now]
  }
  
  // Calculate min and max with padding
  const min = Math.min(...timestamps)
  const max = Math.max(...timestamps)
  const range = max - min || 24 * 60 * 60 * 1000 // Default to 1 day
  
  return [
    new Date(min - range * padding),
    new Date(max + range * padding)
  ]
}