import { DataPoint, SamplingFunction } from './types'

/**
 * Simple nth-point sampling for very large datasets
 * Takes every nth point to achieve the target count
 * Fast but may miss important features in the data
 */
export const nthPointSample: SamplingFunction<any> = <T extends DataPoint>(
  data: T[],
  targetPoints: number
): T[] => {
  if (data.length <= targetPoints) {
    return data
  }
  
  const step = Math.floor(data.length / targetPoints)
  const sampled: T[] = []
  
  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i])
    if (sampled.length >= targetPoints - 1) break
  }
  
  // Always include last point if not already included
  if (sampled[sampled.length - 1] !== data[data.length - 1]) {
    sampled.push(data[data.length - 1])
  }
  
  return sampled
}

/**
 * Stratified nth-point sampling
 * Divides data into equal strata and picks one point from each
 * Better distribution than simple nth-point
 */
export const stratifiedNthPointSample: SamplingFunction<any> = <T extends DataPoint>(
  data: T[],
  targetPoints: number
): T[] => {
  if (data.length <= targetPoints) {
    return data
  }
  
  const sampled: T[] = []
  const strataSize = data.length / targetPoints
  
  for (let i = 0; i < targetPoints; i++) {
    const strataStart = Math.floor(i * strataSize)
    const strataEnd = Math.floor((i + 1) * strataSize)
    
    // Pick middle point from each stratum
    const midPoint = Math.floor((strataStart + strataEnd) / 2)
    if (midPoint < data.length) {
      sampled.push(data[midPoint])
    }
  }
  
  return sampled
}