/**
 * Unified data sampling module
 * Provides a single interface for all sampling methods
 */

import { DataPoint, SamplingMethod, SamplingOptions, SamplingResult } from './types'
import { lttbSample } from './lttb'
import { nthPointSample, stratifiedNthPointSample } from './nth-point'
import { douglasPeuckerSample } from './douglas-peucker'
import { adaptiveSample } from './adaptive'

/**
 * Main sampling function that delegates to specific algorithms
 */
export function sampleData<T extends DataPoint>(
  data: T[],
  options: SamplingOptions
): SamplingResult<T> {
  const { method, targetPoints, preserveExtremes = true } = options
  
  // Early return for empty or small datasets
  if (!data || data.length === 0) {
    return {
      data: [],
      originalCount: 0,
      sampledCount: 0,
      method
    }
  }
  
  if (data.length <= targetPoints || method === 'none') {
    return {
      data: data,
      originalCount: data.length,
      sampledCount: data.length,
      method
    }
  }
  
  // Select sampling function based on method
  let sampledData: T[]
  
  switch (method) {
    case 'lttb':
      sampledData = lttbSample(data, targetPoints)
      break
      
    case 'nth-point':
      sampledData = stratifiedNthPointSample(data, targetPoints)
      break
      
    case 'douglas-peucker':
      sampledData = douglasPeuckerSample(data, targetPoints)
      break
      
    case 'adaptive':
    case 'auto':
      sampledData = adaptiveSample(data, targetPoints)
      break
      
    default:
      // Fallback to adaptive sampling
      sampledData = adaptiveSample(data, targetPoints)
  }
  
  // Ensure extremes are preserved if requested
  if (preserveExtremes && sampledData.length > 0) {
    // Check if first and last points are included
    if (sampledData[0] !== data[0]) {
      sampledData.unshift(data[0])
    }
    if (sampledData[sampledData.length - 1] !== data[data.length - 1]) {
      sampledData.push(data[data.length - 1])
    }
  }
  
  return {
    data: sampledData,
    originalCount: data.length,
    sampledCount: sampledData.length,
    method
  }
}

/**
 * Sample multiple series with the same configuration
 * Useful for batch processing multiple chart series
 */
export function sampleMultipleSeries<T extends DataPoint>(
  seriesMap: Map<string, T[]>,
  options: SamplingOptions
): Map<string, SamplingResult<T>> {
  const results = new Map<string, SamplingResult<T>>()
  
  seriesMap.forEach((data, seriesId) => {
    results.set(seriesId, sampleData(data, options))
  })
  
  return results
}

/**
 * Determine optimal sampling method based on data characteristics
 */
export function getOptimalSamplingMethod<T extends DataPoint>(
  data: T[],
  targetPoints: number
): SamplingMethod {
  if (data.length <= targetPoints) {
    return 'none'
  }
  
  const ratio = data.length / targetPoints
  
  // For small reduction ratios, use LTTB for quality
  if (ratio < 10) {
    return 'lttb'
  }
  
  // For large datasets, use adaptive sampling
  if (data.length > 10000) {
    return 'adaptive'
  }
  
  // Check if data appears to be time series
  const isMonotonic = checkMonotonicX(data.slice(0, Math.min(100, data.length)))
  
  if (isMonotonic) {
    return 'lttb' // Best for time series
  } else {
    return 'douglas-peucker' // Better for non-time series
  }
}

function checkMonotonicX<T extends DataPoint>(data: T[]): boolean {
  if (data.length < 2) return true
  
  let prevX = convertToNumber(data[0].x)
  for (let i = 1; i < data.length; i++) {
    const currX = convertToNumber(data[i].x)
    if (currX <= prevX) return false
    prevX = currX
  }
  
  return true
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

// Re-export types for convenience
export * from './types'