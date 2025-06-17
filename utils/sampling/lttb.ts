import { DataPoint, SamplingFunction } from './types'

/**
 * LTTB (Largest Triangle Three Buckets) algorithm for data sampling
 * This algorithm preserves the visual characteristics of the data while reducing points
 * Best for time series data where maintaining visual fidelity is important
 */
export const lttbSample: SamplingFunction<any> = <T extends DataPoint>(
  data: T[],
  targetPoints: number
): T[] => {
  if (data.length <= targetPoints || targetPoints < 3) {
    return data
  }

  const sampled: T[] = []
  
  // Always keep first and last points
  sampled.push(data[0])
  
  // Calculate bucket size
  const bucketSize = (data.length - 2) / (targetPoints - 2)
  
  let a = 0 // Previous selected point index
  
  for (let i = 0; i < targetPoints - 2; i++) {
    // Calculate bucket boundaries
    const bucketStart = Math.floor((i + 1) * bucketSize) + 1
    const bucketEnd = Math.floor((i + 2) * bucketSize) + 1
    
    // Calculate average point for next bucket
    let avgX = 0
    let avgY = 0
    let avgCount = 0
    
    for (let j = bucketEnd; j < Math.min(data.length, Math.floor((i + 3) * bucketSize) + 1); j++) {
      const x = typeof data[j].x === 'number' ? data[j].x : 
                data[j].x instanceof Date ? data[j].x.getTime() : 
                Date.parse(data[j].x as string)
      avgX += x
      avgY += data[j].y
      avgCount++
    }
    
    if (avgCount > 0) {
      avgX /= avgCount
      avgY /= avgCount
    }
    
    // Find point in current bucket with largest triangle area
    let maxArea = -1
    let maxAreaIndex = bucketStart
    
    const aX = typeof data[a].x === 'number' ? data[a].x : 
              data[a].x instanceof Date ? data[a].x.getTime() : 
              Date.parse(data[a].x as string)
    const aY = data[a].y
    
    for (let j = bucketStart; j < bucketEnd && j < data.length; j++) {
      const x = typeof data[j].x === 'number' ? data[j].x : 
                data[j].x instanceof Date ? data[j].x.getTime() : 
                Date.parse(data[j].x as string)
      
      // Calculate triangle area
      const area = Math.abs(
        (aX - avgX) * (data[j].y - aY) -
        (aX - x) * (avgY - aY)
      ) * 0.5
      
      if (area > maxArea) {
        maxArea = area
        maxAreaIndex = j
      }
    }
    
    sampled.push(data[maxAreaIndex])
    a = maxAreaIndex
  }
  
  // Add last point
  sampled.push(data[data.length - 1])
  
  return sampled
}