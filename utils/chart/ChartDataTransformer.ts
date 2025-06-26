import { ChartComponent, AxisType } from "@/types"
import { ChartDataPoint } from "@/types/chart-data"

/**
 * Common data transformation utilities for all chart types
 * Handles timestamp processing, unit conversion, and missing value handling
 */
export class ChartDataTransformer {
  
  /**
   * Transform raw data based on chart configuration
   */
  static transformData<T extends Record<string, any>>(
    data: T[],
    editingChart: ChartComponent
  ): T[] {
    if (!data || data.length === 0) return []
    
    // Apply transformations in sequence
    let transformedData = data
    
    // 1. Handle missing values
    transformedData = this.handleMissingValues(transformedData, editingChart)
    
    // 2. Transform timestamps based on axis type
    transformedData = this.transformTimestamps(transformedData, editingChart)
    
    // 3. Apply unit conversions
    transformedData = this.applyUnitConversions(transformedData, editingChart)
    
    // 4. Filter data based on axis ranges if specified
    transformedData = this.filterByAxisRange(transformedData, editingChart)
    
    return transformedData
  }
  
  /**
   * Handle missing values in data
   */
  private static handleMissingValues<T extends Record<string, any>>(
    data: T[],
    editingChart: ChartComponent
  ): T[] {
    const yParams = editingChart.yAxisParams || []
    
    return data.map(item => {
      const newItem = { ...item } as any
      
      // For each Y parameter, replace null/undefined with 0 or NaN
      yParams.forEach(param => {
        if (param.parameter && (newItem[param.parameter] === null || newItem[param.parameter] === undefined)) {
          // Use NaN for line charts to create gaps, 0 for others
          newItem[param.parameter] = editingChart.type === 'line' ? NaN : 0
        }
      })
      
      return newItem as T
    })
  }
  
  /**
   * Transform timestamps based on axis type
   */
  private static transformTimestamps<T extends Record<string, any>>(
    data: T[],
    editingChart: ChartComponent
  ): T[] {
    const xAxisType = editingChart.xAxisType || 'datetime'
    const xParameter = editingChart.xParameter || 'timestamp'
    
    return data.map(item => {
      const newItem = { ...item } as any
      
      if (xAxisType === 'datetime') {
        // For datetime axis, ensure we have a timestamp field
        const timestampField = 'timestamp'
        
        // First, ensure the timestamp field is a Date object
        if (item[timestampField] && !(item[timestampField] instanceof Date)) {
          newItem[timestampField] = new Date(item[timestampField])
        }
        
        // If xParameter is different from timestamp (or empty for datetime), 
        // copy the timestamp value to xParameter field
        if (xParameter && xParameter !== timestampField && newItem[timestampField]) {
          newItem[xParameter] = newItem[timestampField]
        }
        
        // Also handle the case where xParameter has a value but it's not a Date
        if (xParameter && newItem[xParameter] && !(newItem[xParameter] instanceof Date)) {
          newItem[xParameter] = new Date(newItem[xParameter])
        }
      } else if (xAxisType === 'time') {
        // Convert to elapsed time in specified unit
        const unit = editingChart.xAxisRange?.unit || 'min'
        const baseTime = data[0]?.[xParameter]
        
        if (baseTime) {
          const elapsed = this.calculateElapsedTime(
            baseTime,
            newItem[xParameter],
            unit
          )
          newItem[xParameter] = elapsed
        }
      }
      
      return newItem as T
    })
  }
  
  /**
   * Calculate elapsed time between two timestamps
   */
  private static calculateElapsedTime(
    baseTime: string | Date | number,
    currentTime: string | Date | number,
    unit: 'sec' | 'min' | 'hr'
  ): number {
    const base = new Date(baseTime).getTime()
    const current = new Date(currentTime).getTime()
    const diffMs = current - base
    
    switch (unit) {
      case 'sec':
        return diffMs / 1000
      case 'min':
        return diffMs / (1000 * 60)
      case 'hr':
        return diffMs / (1000 * 60 * 60)
      default:
        return diffMs / (1000 * 60) // Default to minutes
    }
  }
  
  /**
   * Apply unit conversions to Y parameters
   */
  private static applyUnitConversions<T extends Record<string, any>>(
    data: T[],
    editingChart: ChartComponent
  ): T[] {
    const yParams = editingChart.yAxisParams || []
    
    // Check if any parameters need unit conversion
    const conversionsNeeded = yParams.filter(
      param => param.unitConversionId && param.unit
    )
    
    if (conversionsNeeded.length === 0) return data
    
    return data.map(item => {
      const newItem = { ...item } as any
      
      conversionsNeeded.forEach(param => {
        if (param.parameter && newItem[param.parameter] !== null && newItem[param.parameter] !== undefined) {
          // Apply conversion based on unitConversionId
          // This would integrate with your unit conversion system
          // For now, this is a placeholder
          newItem[param.parameter] = this.convertUnit(
            newItem[param.parameter],
            param.unitConversionId!
          )
        }
      })
      
      return newItem as T
    })
  }
  
  /**
   * Convert unit based on conversion ID
   * This is a placeholder - integrate with actual unit conversion system
   */
  private static convertUnit(value: number, conversionId: string): number {
    // Placeholder implementation
    // In real implementation, this would look up the conversion formula
    // and apply it to the value
    return value
  }
  
  /**
   * Filter data based on axis ranges
   */
  private static filterByAxisRange<T extends Record<string, any>>(
    data: T[],
    editingChart: ChartComponent
  ): T[] {
    // Only filter if auto range is disabled and ranges are specified
    if (editingChart.xAxisRange?.auto !== false) return data
    
    const { min, max } = editingChart.xAxisRange
    if (!min || !max) return data
    
    const xParameter = editingChart.xParameter || 'timestamp'
    const xAxisType = editingChart.xAxisType || 'datetime'
    
    return data.filter(item => {
      const value = item[xParameter]
      
      if (xAxisType === 'datetime') {
        const date = new Date(value)
        const minDate = new Date(min)
        const maxDate = new Date(max)
        return date >= minDate && date <= maxDate
      } else {
        const numValue = Number(value)
        const numMin = Number(min)
        const numMax = Number(max)
        return numValue >= numMin && numValue <= numMax
      }
    })
  }
  
  /**
   * Prepare data for line chart
   */
  static prepareLineChartData(
    data: ChartDataPoint[],
    editingChart: ChartComponent
  ): any[] {
    // Transform base data
    const transformed = this.transformData(data as any[], editingChart)
    
    // Sort by X axis value for proper line rendering
    const xParameter = editingChart.xParameter || 'timestamp'
    return transformed.sort((a: any, b: any) => {
      const aVal = a[xParameter]
      const bVal = b[xParameter]
      
      if (aVal instanceof Date && bVal instanceof Date) {
        return aVal.getTime() - bVal.getTime()
      }
      return Number(aVal) - Number(bVal)
    })
  }
  
  /**
   * Prepare data for scatter plot
   */
  static prepareScatterPlotData(
    data: any[],
    editingChart: ChartComponent,
    dataSourceId: string,
    dataSourceLabel: string,
    seriesIndex: number
  ): any[] {
    const xParameter = editingChart.xParameter || 'timestamp'
    const yParams = editingChart.yAxisParams || []
    
    // Transform each data point into scatter plot format
    const scatterData: any[] = []
    
    data.forEach((item: any) => {
      yParams.forEach((param, paramIndex) => {
        if (param.parameter && item[param.parameter] !== null && item[param.parameter] !== undefined) {
          scatterData.push({
            x: item[xParameter],
            y: item[param.parameter],
            series: param.parameter,
            seriesIndex: paramIndex,
            timestamp: item.timestamp || item[xParameter],
            dataSourceId,
            dataSourceLabel,
            dataSourceIndex: seriesIndex
          })
        }
      })
    })
    
    return this.transformData(scatterData, editingChart)
  }
  
  /**
   * Aggregate data for performance optimization
   */
  static aggregateData<T extends Record<string, any>>(
    data: T[],
    maxPoints: number,
    aggregationMethod: 'average' | 'sample' | 'min-max' = 'average'
  ): T[] {
    if (data.length <= maxPoints) return data
    
    const bucketSize = Math.ceil(data.length / maxPoints)
    const aggregated: T[] = []
    
    for (let i = 0; i < data.length; i += bucketSize) {
      const bucket = data.slice(i, i + bucketSize)
      
      if (aggregationMethod === 'sample') {
        // Take middle point of bucket
        aggregated.push(bucket[Math.floor(bucket.length / 2)])
      } else if (aggregationMethod === 'average') {
        // Average numeric values in bucket
        const averaged = this.averageBucket(bucket)
        aggregated.push(averaged)
      } else if (aggregationMethod === 'min-max') {
        // Keep min and max points for each bucket
        const { min, max } = this.minMaxBucket(bucket)
        aggregated.push(min, max)
      }
    }
    
    return aggregated
  }
  
  /**
   * Average values in a bucket
   */
  private static averageBucket<T extends Record<string, any>>(bucket: T[]): T {
    if (bucket.length === 0) throw new Error('Empty bucket')
    if (bucket.length === 1) return bucket[0]
    
    const result: any = { ...bucket[0] }
    const numericKeys = Object.keys(result).filter(
      key => typeof result[key] === 'number'
    )
    
    // Average numeric values
    numericKeys.forEach(key => {
      const sum = bucket.reduce((acc, item) => acc + (item[key] || 0), 0)
      result[key] = sum / bucket.length
    })
    
    return result as T
  }
  
  /**
   * Get min and max points from bucket
   */
  private static minMaxBucket<T extends Record<string, any>>(
    bucket: T[]
  ): { min: T; max: T } {
    if (bucket.length === 0) throw new Error('Empty bucket')
    if (bucket.length === 1) return { min: bucket[0], max: bucket[0] }
    
    // Find the first numeric key to use for comparison
    const numericKey = Object.keys(bucket[0]).find(
      key => typeof bucket[0][key] === 'number' && key !== 'timestamp'
    )
    
    if (!numericKey) return { min: bucket[0], max: bucket[bucket.length - 1] }
    
    let min = bucket[0]
    let max = bucket[0]
    
    bucket.forEach(item => {
      if (item[numericKey] < min[numericKey]) min = item
      if (item[numericKey] > max[numericKey]) max = item
    })
    
    return { min, max }
  }
}