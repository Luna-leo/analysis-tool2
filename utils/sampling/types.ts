/**
 * Common types for data sampling
 */

export interface DataPoint {
  x: number | Date | string
  y: number
  [key: string]: any
}

export type SamplingMethod = 'lttb' | 'nth-point' | 'adaptive' | 'douglas-peucker' | 'auto' | 'none'

export interface SamplingOptions {
  method: SamplingMethod
  targetPoints: number
  preserveExtremes?: boolean
  chartType?: string
  isTimeSeries?: boolean
}

export interface SamplingResult<T extends DataPoint> {
  data: T[]
  originalCount: number
  sampledCount: number
  method: SamplingMethod
}

export type SamplingFunction<T extends DataPoint> = (
  data: T[],
  targetPoints: number
) => T[]