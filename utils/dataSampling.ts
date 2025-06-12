/**
 * LTTB (Largest Triangle Three Buckets) algorithm for data sampling
 * This algorithm preserves the visual characteristics of the data while reducing points
 */
export function lttbSample<T extends { x: number; y: number }>(
  data: T[],
  targetPoints: number
): T[] {
  if (data.length <= targetPoints || targetPoints < 3) {
    return data
  }

  const sampled: T[] = []
  
  // Always keep first and last points
  sampled.push(data[0])
  
  // Calculate bucket size
  const bucketSize = (data.length - 2) / (targetPoints - 2)
  
  let a = 0 // Previous selected point
  
  for (let i = 0; i < targetPoints - 2; i++) {
    // Calculate bucket boundaries
    const bucketStart = Math.floor((i + 1) * bucketSize) + 1
    const bucketEnd = Math.floor((i + 2) * bucketSize) + 1
    const bucketMiddle = Math.floor((bucketStart + bucketEnd) / 2)
    
    // Calculate average point for next bucket
    let avgX = 0
    let avgY = 0
    let avgCount = 0
    
    for (let j = bucketEnd; j < Math.min(data.length, Math.floor((i + 3) * bucketSize) + 1); j++) {
      avgX += data[j].x
      avgY += data[j].y
      avgCount++
    }
    
    if (avgCount > 0) {
      avgX /= avgCount
      avgY /= avgCount
    }
    
    // Find point in current bucket with largest triangle area
    let maxArea = -1
    let maxAreaIndex = bucketMiddle
    
    for (let j = bucketStart; j < bucketEnd && j < data.length; j++) {
      // Calculate triangle area
      const area = Math.abs(
        (data[a].x - avgX) * (data[j].y - data[a].y) -
        (data[a].x - data[j].x) * (avgY - data[a].y)
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

/**
 * Simple nth-point sampling for very large datasets
 */
export function nthPointSample<T>(data: T[], targetPoints: number): T[] {
  if (data.length <= targetPoints) {
    return data
  }
  
  const step = Math.floor(data.length / targetPoints)
  const sampled: T[] = []
  
  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i])
  }
  
  // Always include last point
  if (sampled[sampled.length - 1] !== data[data.length - 1]) {
    sampled.push(data[data.length - 1])
  }
  
  return sampled
}

/**
 * Adaptive sampling based on data characteristics
 */
export function adaptiveSample<T extends { x: number; y: number }>(
  data: T[],
  targetPoints: number,
  threshold = 1000
): T[] {
  // For small datasets, return as-is
  if (data.length <= targetPoints) {
    return data
  }
  
  // For moderate datasets, use LTTB
  if (data.length <= threshold) {
    return lttbSample(data, targetPoints)
  }
  
  // For very large datasets, use nth-point sampling first, then LTTB
  const presampled = nthPointSample(data, threshold)
  return lttbSample(presampled, targetPoints)
}