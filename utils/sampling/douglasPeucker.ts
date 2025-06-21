/**
 * Douglas-Peucker algorithm for line simplification
 * Best suited for simplifying polylines while preserving shape
 * Commonly used in geographic data and line chart optimization
 */

import { DataPoint } from './types'

interface NumericDataPoint extends DataPoint {
  x: number
  y: number
}

/**
 * Convert data point to numeric values for calculation
 */
function toNumericPoint<T extends DataPoint>(point: T): NumericDataPoint & T {
  let numericX: number
  
  if (typeof point.x === 'number') {
    numericX = point.x
  } else if (point.x instanceof Date) {
    numericX = point.x.getTime()
  } else if (typeof point.x === 'string') {
    const parsed = Date.parse(point.x)
    numericX = isNaN(parsed) ? parseFloat(point.x) || 0 : parsed
  } else {
    numericX = 0
  }
  
  return {
    ...point,
    x: numericX,
    y: point.y
  }
}

/**
 * Calculate perpendicular distance from point to line
 */
function perpendicularDistance(
  point: NumericDataPoint,
  lineStart: NumericDataPoint,
  lineEnd: NumericDataPoint
): number {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y
  
  // Handle case where line is a point
  if (dx === 0 && dy === 0) {
    return Math.sqrt(
      Math.pow(point.x - lineStart.x, 2) + 
      Math.pow(point.y - lineStart.y, 2)
    )
  }
  
  const normalLength = Math.sqrt(dx * dx + dy * dy)
  
  return Math.abs(
    (dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / 
    normalLength
  )
}

/**
 * Douglas-Peucker algorithm implementation
 */
function douglasPeuckerRecursive<T extends DataPoint>(
  points: T[],
  startIndex: number,
  endIndex: number,
  epsilon: number,
  numericPoints: NumericDataPoint[]
): number[] {
  if (endIndex - startIndex <= 1) {
    return [startIndex, endIndex]
  }
  
  // Find the point with maximum distance
  let maxDistance = 0
  let maxIndex = startIndex
  
  const startPoint = numericPoints[startIndex]
  const endPoint = numericPoints[endIndex]
  
  for (let i = startIndex + 1; i < endIndex; i++) {
    const distance = perpendicularDistance(
      numericPoints[i],
      startPoint,
      endPoint
    )
    
    if (distance > maxDistance) {
      maxDistance = distance
      maxIndex = i
    }
  }
  
  // If max distance is greater than epsilon, recursively simplify
  if (maxDistance > epsilon) {
    const leftIndices = douglasPeuckerRecursive(
      points,
      startIndex,
      maxIndex,
      epsilon,
      numericPoints
    )
    
    const rightIndices = douglasPeuckerRecursive(
      points,
      maxIndex,
      endIndex,
      epsilon,
      numericPoints
    )
    
    // Combine results, avoiding duplicate middle point
    return [...leftIndices.slice(0, -1), ...rightIndices]
  } else {
    return [startIndex, endIndex]
  }
}

/**
 * Douglas-Peucker algorithm for line simplification
 * @param data - Input data points
 * @param epsilon - Distance threshold for simplification
 * @returns Simplified data points
 */
export function douglasPeucker<T extends DataPoint>(
  data: T[],
  epsilon: number
): T[] {
  if (data.length <= 2 || epsilon <= 0) {
    return data
  }
  
  // Convert to numeric points for calculation
  const numericPoints = data.map(toNumericPoint)
  
  // Get indices of points to keep
  const indices = douglasPeuckerRecursive(
    data,
    0,
    data.length - 1,
    epsilon,
    numericPoints
  )
  
  // Return selected points
  return indices.map(i => data[i])
}

/**
 * Douglas-Peucker with target point count
 * Uses binary search to find optimal epsilon
 * @param data - Input data points
 * @param targetPoints - Target number of points after simplification
 * @returns Simplified data points
 */
export function douglasPeuckerWithTarget<T extends DataPoint>(
  data: T[],
  targetPoints: number
): T[] {
  if (data.length <= targetPoints || targetPoints < 2) {
    return data
  }
  
  // Convert to numeric points for range calculation
  const numericPoints = data.map(toNumericPoint)
  
  // Calculate data range for initial epsilon bounds
  const xMin = Math.min(...numericPoints.map(p => p.x))
  const xMax = Math.max(...numericPoints.map(p => p.x))
  const yMin = Math.min(...numericPoints.map(p => p.y))
  const yMax = Math.max(...numericPoints.map(p => p.y))
  
  const dataRange = Math.sqrt(
    Math.pow(xMax - xMin, 2) + Math.pow(yMax - yMin, 2)
  )
  
  // Binary search for optimal epsilon
  let low = 0
  let high = dataRange / 2
  let bestEpsilon = 0
  let bestResult = data
  
  // Maximum iterations to prevent infinite loop
  const maxIterations = 50
  let iterations = 0
  
  while (low <= high && iterations < maxIterations) {
    const mid = (low + high) / 2
    const simplified = douglasPeucker(data, mid)
    
    if (simplified.length > targetPoints) {
      low = mid + dataRange / 1000
    } else {
      bestEpsilon = mid
      bestResult = simplified
      high = mid - dataRange / 1000
    }
    
    // Stop if we're close enough
    if (Math.abs(simplified.length - targetPoints) <= 1) {
      return simplified
    }
    
    iterations++
  }
  
  return bestResult
}

/**
 * Calculate the quality score for Douglas-Peucker simplification
 * Based on maximum deviation from original line
 */
export function calculateDouglasPeuckerQuality<T extends DataPoint>(
  original: T[],
  simplified: T[]
): number {
  if (original.length === 0 || simplified.length === 0) return 0
  if (simplified.length >= original.length) return 1
  
  const numericOriginal = original.map(toNumericPoint)
  const numericSimplified = simplified.map(toNumericPoint)
  
  let maxDeviation = 0
  let simplifiedIndex = 0
  
  // For each original point, find distance to simplified line
  for (let i = 0; i < numericOriginal.length; i++) {
    // Find the simplified segment containing this point
    while (simplifiedIndex < numericSimplified.length - 1 &&
           numericSimplified[simplifiedIndex + 1].x <= numericOriginal[i].x) {
      simplifiedIndex++
    }
    
    if (simplifiedIndex < numericSimplified.length - 1) {
      const distance = perpendicularDistance(
        numericOriginal[i],
        numericSimplified[simplifiedIndex],
        numericSimplified[simplifiedIndex + 1]
      )
      
      maxDeviation = Math.max(maxDeviation, distance)
    }
  }
  
  // Normalize by data range
  const yMin = Math.min(...numericOriginal.map(p => p.y))
  const yMax = Math.max(...numericOriginal.map(p => p.y))
  const yRange = yMax - yMin || 1
  
  const normalizedDeviation = maxDeviation / yRange
  
  // Convert to quality score (0-1, higher is better)
  // Use exponential decay for better sensitivity
  return Math.exp(-normalizedDeviation * 2)
}