/**
 * Nth-point sampling algorithm
 * Simple decimation by taking every nth point
 * Fast but may miss important features in the data
 */

import { DataPoint } from './types'

/**
 * Simple nth-point sampling
 * @param data - Input data points
 * @param targetPoints - Target number of points after sampling
 * @returns Sampled data points
 */
export function nthPointSample<T extends DataPoint>(
  data: T[],
  targetPoints: number
): T[] {
  if (data.length <= targetPoints) {
    return data
  }
  
  const sampled: T[] = []
  const step = Math.max(1, Math.floor(data.length / targetPoints))
  
  // Always include first point
  sampled.push(data[0])
  
  // Sample at regular intervals
  for (let i = step; i < data.length - 1; i += step) {
    sampled.push(data[i])
  }
  
  // Always include last point if not already included
  const lastPoint = data[data.length - 1]
  const lastSampled = sampled[sampled.length - 1]
  
  if (lastSampled !== lastPoint) {
    sampled.push(lastPoint)
  }
  
  return sampled
}

/**
 * Stratified nth-point sampling
 * Ensures even distribution by dividing data into strata
 * @param data - Input data points
 * @param targetPoints - Target number of points after sampling
 * @returns Sampled data points with better distribution
 */
export function stratifiedNthPointSample<T extends DataPoint>(
  data: T[],
  targetPoints: number
): T[] {
  if (data.length <= targetPoints) {
    return data
  }
  
  const sampled: T[] = []
  const strataSize = data.length / targetPoints
  
  for (let i = 0; i < targetPoints; i++) {
    const startIdx = Math.floor(i * strataSize)
    const endIdx = Math.floor((i + 1) * strataSize)
    
    // Pick middle point from each stratum
    const middleIdx = Math.floor((startIdx + endIdx) / 2)
    
    if (middleIdx < data.length) {
      sampled.push(data[middleIdx])
    }
  }
  
  return sampled
}

/**
 * Random nth-point sampling
 * Adds randomization to avoid systematic bias
 * @param data - Input data points
 * @param targetPoints - Target number of points after sampling
 * @param seed - Optional seed for reproducible randomization
 * @returns Sampled data points
 */
export function randomNthPointSample<T extends DataPoint>(
  data: T[],
  targetPoints: number,
  seed?: number
): T[] {
  if (data.length <= targetPoints) {
    return data
  }
  
  // Simple seeded random number generator
  let random = seed || Math.random()
  const nextRandom = () => {
    random = (random * 9301 + 49297) % 233280
    return random / 233280
  }
  
  const sampled: T[] = []
  const avgStep = data.length / targetPoints
  
  // Always include first point
  sampled.push(data[0])
  
  let currentIndex = 0
  for (let i = 1; i < targetPoints - 1; i++) {
    // Add some randomness to the step size (±25% of average step)
    const randomFactor = 0.75 + nextRandom() * 0.5
    const step = Math.floor(avgStep * randomFactor)
    
    currentIndex += step
    
    // Ensure we don't go out of bounds
    if (currentIndex >= data.length - 1) {
      currentIndex = data.length - 2
    }
    
    sampled.push(data[currentIndex])
  }
  
  // Always include last point
  sampled.push(data[data.length - 1])
  
  return sampled
}

/**
 * Calculate the quality score for nth-point sampling
 * Based on how evenly distributed the samples are
 */
export function calculateNthPointQuality<T extends DataPoint>(
  original: T[],
  sampled: T[]
): number {
  if (original.length === 0 || sampled.length === 0) return 0
  if (sampled.length >= original.length) return 1
  
  // Calculate distribution uniformity
  const idealStep = original.length / sampled.length
  let totalDeviation = 0
  
  for (let i = 1; i < sampled.length; i++) {
    const prevIndex = original.indexOf(sampled[i - 1])
    const currIndex = original.indexOf(sampled[i])
    
    if (prevIndex !== -1 && currIndex !== -1) {
      const actualStep = currIndex - prevIndex
      const deviation = Math.abs(actualStep - idealStep) / idealStep
      totalDeviation += deviation
    }
  }
  
  const avgDeviation = totalDeviation / (sampled.length - 1)
  
  // Convert to quality score (0-1, higher is better)
  return Math.max(0, 1 - avgDeviation)
}