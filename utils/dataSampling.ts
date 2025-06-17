/**
 * Legacy data sampling utilities
 * This file now re-exports from the new unified sampling module
 * for backward compatibility
 */

import { 
  lttbSample as newLttbSample,
  nthPointSample as newNthPointSample,
  adaptiveSample as newAdaptiveSample,
  DataPoint
} from './sampling'

/**
 * @deprecated Use import from './sampling' instead
 * LTTB (Largest Triangle Three Buckets) algorithm for data sampling
 */
export function lttbSample<T extends { x: number; y: number }>(
  data: T[],
  targetPoints: number
): T[] {
  return newLttbSample(data as DataPoint[], targetPoints) as T[]
}

/**
 * @deprecated Use import from './sampling' instead
 * Simple nth-point sampling for very large datasets
 */
export function nthPointSample<T>(data: T[], targetPoints: number): T[] {
  return newNthPointSample(data as DataPoint[], targetPoints) as T[]
}

/**
 * @deprecated Use import from './sampling' instead
 * Adaptive sampling based on data characteristics
 */
export function adaptiveSample<T extends { x: number; y: number }>(
  data: T[],
  targetPoints: number,
  threshold = 1000
): T[] {
  return newAdaptiveSample(data as DataPoint[], targetPoints) as T[]
}