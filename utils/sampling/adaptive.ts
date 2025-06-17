import { DataPoint, SamplingFunction } from './types'
import { lttbSample } from './lttb'
import { nthPointSample } from './nth-point'

/**
 * Adaptive sampling based on data characteristics
 * Automatically chooses the best sampling method based on data size and characteristics
 */
export const adaptiveSample: SamplingFunction<any> = <T extends DataPoint>(
  data: T[],
  targetPoints: number
): T[] => {
  // For small datasets, return as-is
  if (data.length <= targetPoints) {
    return data
  }
  
  // For moderate datasets (up to 5000 points), use LTTB for best quality
  if (data.length <= 5000) {
    return lttbSample(data, targetPoints)
  }
  
  // For large datasets (5000-50000), use stratified sampling then LTTB
  if (data.length <= 50000) {
    // First reduce to 2x target points with nth-point
    const presampled = nthPointSample(data, targetPoints * 2)
    // Then apply LTTB for final sampling
    return lttbSample(presampled, targetPoints)
  }
  
  // For very large datasets (>50000), use multi-stage sampling
  // First stage: reduce to 5000 points
  const firstStage = nthPointSample(data, 5000)
  // Second stage: reduce to 2x target
  const secondStage = nthPointSample(firstStage, targetPoints * 2)
  // Final stage: LTTB for quality
  return lttbSample(secondStage, targetPoints)
}

/**
 * Analyze data characteristics to determine best sampling method
 */
export function analyzeDataCharacteristics<T extends DataPoint>(data: T[]): {
  isTimeSeries: boolean
  hasHighVariance: boolean
  density: number
} {
  if (data.length < 10) {
    return {
      isTimeSeries: false,
      hasHighVariance: false,
      density: 0
    }
  }
  
  // Check if data is time series (monotonic x values)
  let isTimeSeries = true
  let prevX = convertToNumber(data[0].x)
  
  for (let i = 1; i < Math.min(100, data.length); i++) {
    const currX = convertToNumber(data[i].x)
    if (currX <= prevX) {
      isTimeSeries = false
      break
    }
    prevX = currX
  }
  
  // Calculate variance in y values
  const sampleSize = Math.min(100, data.length)
  const step = Math.floor(data.length / sampleSize)
  let sum = 0
  let sumSq = 0
  
  for (let i = 0; i < data.length; i += step) {
    sum += data[i].y
    sumSq += data[i].y * data[i].y
  }
  
  const mean = sum / sampleSize
  const variance = (sumSq / sampleSize) - (mean * mean)
  const stdDev = Math.sqrt(variance)
  const hasHighVariance = stdDev > mean * 0.2 // High variance if std dev > 20% of mean
  
  // Calculate point density
  const xRange = convertToNumber(data[data.length - 1].x) - convertToNumber(data[0].x)
  const density = data.length / xRange
  
  return {
    isTimeSeries,
    hasHighVariance,
    density
  }
}

function convertToNumber(x: number | string | Date): number {
  if (typeof x === 'number') return x
  if (x instanceof Date) return x.getTime()
  if (typeof x === 'string') {
    const parsed = Date.parse(x)
    return isNaN(parsed) ? parseFloat(x) || 0 : parsed
  }
  return 0
}