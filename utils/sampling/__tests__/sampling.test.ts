import { describe, it, expect } from 'vitest'
import { 
  sampleData, 
  lttbSample, 
  nthPointSample, 
  douglasPeuckerWithTarget,
  adaptiveSample,
  evaluateSamplingMethods
} from '../index'
import { DataPoint, SamplingOptions } from '../types'

// Test data generation
function generateTestData(count: number, type: 'linear' | 'sine' | 'random' = 'linear'): DataPoint[] {
  const data: DataPoint[] = []
  
  for (let i = 0; i < count; i++) {
    let y: number
    switch (type) {
      case 'linear':
        y = i + Math.random() * 10
        break
      case 'sine':
        y = Math.sin(i / 10) * 50 + 50
        break
      case 'random':
        y = Math.random() * 100
        break
    }
    
    data.push({
      x: new Date(Date.now() + i * 1000 * 60), // 1 minute intervals
      y
    })
  }
  
  return data
}

describe('sampleData', () => {
  it('should return empty array for empty input', () => {
    const result = sampleData([], { method: 'auto', targetPoints: 100 })
    expect(result.data).toEqual([])
    expect(result.originalCount).toBe(0)
    expect(result.sampledCount).toBe(0)
  })
  
  it('should return original data when below target points', () => {
    const data = generateTestData(50)
    const result = sampleData(data, { method: 'auto', targetPoints: 100 })
    expect(result.data).toEqual(data)
    expect(result.method).toBe('none')
    expect(result.sampledCount).toBe(50)
  })
  
  it('should apply LTTB sampling when specified', () => {
    const data = generateTestData(1000, 'sine')
    const result = sampleData(data, { method: 'lttb', targetPoints: 100 })
    expect(result.method).toBe('lttb')
    expect(result.sampledCount).toBeLessThanOrEqual(100)
    expect(result.sampledCount).toBeGreaterThan(0)
    expect(result.originalCount).toBe(1000)
  })
  
  it('should apply nth-point sampling when specified', () => {
    const data = generateTestData(500)
    const result = sampleData(data, { method: 'nth-point', targetPoints: 50 })
    expect(result.method).toBe('nth-point')
    expect(result.sampledCount).toBeLessThanOrEqual(50)
    expect(result.sampledCount).toBeGreaterThan(0)
  })
  
  it('should apply Douglas-Peucker sampling when specified', () => {
    const data = generateTestData(200, 'linear')
    const result = sampleData(data, { method: 'douglas-peucker', targetPoints: 20 })
    expect(result.method).toBe('douglas-peucker')
    expect(result.sampledCount).toBeLessThanOrEqual(20)
    expect(result.sampledCount).toBeGreaterThan(0)
  })
  
  it('should handle none method correctly', () => {
    const data = generateTestData(1000)
    const result = sampleData(data, { method: 'none', targetPoints: 100 })
    expect(result.data).toEqual(data)
    expect(result.method).toBe('none')
    expect(result.sampledCount).toBe(1000)
  })
})

describe('LTTB sampling', () => {
  it('should preserve first and last points', () => {
    const data = generateTestData(100)
    const sampled = lttbSample(data, 10)
    expect(sampled[0]).toEqual(data[0])
    expect(sampled[sampled.length - 1]).toEqual(data[data.length - 1])
  })
  
  it('should handle minimum target points', () => {
    const data = generateTestData(100)
    const sampled = lttbSample(data, 3)
    expect(sampled.length).toBe(3)
  })
  
  it('should preserve visual characteristics of sine wave', () => {
    const data = generateTestData(1000, 'sine')
    const sampled = lttbSample(data, 100)
    
    // Check that peaks and valleys are preserved
    const originalMax = Math.max(...data.map(d => d.y))
    const originalMin = Math.min(...data.map(d => d.y))
    const sampledMax = Math.max(...sampled.map(d => d.y))
    const sampledMin = Math.min(...sampled.map(d => d.y))
    
    expect(Math.abs(sampledMax - originalMax)).toBeLessThan(5)
    expect(Math.abs(sampledMin - originalMin)).toBeLessThan(5)
  })
})

describe('nth-point sampling', () => {
  it('should sample at regular intervals', () => {
    const data = generateTestData(100)
    const sampled = nthPointSample(data, 10)
    expect(sampled.length).toBeLessThanOrEqual(11) // May include last point
  })
  
  it('should always include first and last points', () => {
    const data = generateTestData(100)
    const sampled = nthPointSample(data, 20)
    expect(sampled[0]).toEqual(data[0])
    expect(sampled[sampled.length - 1]).toEqual(data[data.length - 1])
  })
})

describe('Douglas-Peucker sampling', () => {
  it('should simplify linear data effectively', () => {
    const data: DataPoint[] = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
      { x: 2, y: 2 },
      { x: 3, y: 3 },
      { x: 4, y: 4 }
    ]
    const sampled = douglasPeuckerWithTarget(data, 2)
    expect(sampled.length).toBe(2)
    expect(sampled[0]).toEqual(data[0])
    expect(sampled[1]).toEqual(data[4])
  })
  
  it('should preserve important features', () => {
    const data: DataPoint[] = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 10 }, // Peak
      { x: 3, y: 0 },
      { x: 4, y: 0 }
    ]
    const sampled = douglasPeuckerWithTarget(data, 3)
    expect(sampled.length).toBeGreaterThanOrEqual(3)
    // Should include the peak
    expect(sampled.some(p => p.y === 10)).toBe(true)
  })
})

describe('adaptive sampling', () => {
  it('should choose appropriate method based on data', () => {
    const options: SamplingOptions = {
      method: 'auto',
      targetPoints: 100,
      chartType: 'line',
      isTimeSeries: true
    }
    
    const data = generateTestData(1000, 'sine')
    const sampled = adaptiveSample(data, options)
    expect(sampled.length).toBeLessThanOrEqual(100)
    expect(sampled.length).toBeGreaterThan(0)
  })
  
  it('should handle very large datasets with multi-stage sampling', () => {
    const options: SamplingOptions = {
      method: 'auto',
      targetPoints: 100,
      threshold: 1000
    }
    
    const data = generateTestData(20000, 'random')
    const sampled = adaptiveSample(data, options)
    expect(sampled.length).toBeLessThanOrEqual(100)
    expect(sampled.length).toBeGreaterThan(0)
  })
})

describe('evaluateSamplingMethods', () => {
  it('should evaluate different methods and return scores', () => {
    const data = generateTestData(500, 'sine')
    const result = evaluateSamplingMethods(data, 50)
    
    expect(result.bestMethod).toBeDefined()
    expect(result.scores['lttb']).toBeGreaterThanOrEqual(0)
    expect(result.scores['lttb']).toBeLessThanOrEqual(1)
    expect(result.scores['nth-point']).toBeGreaterThanOrEqual(0)
    expect(result.scores['douglas-peucker']).toBeGreaterThanOrEqual(0)
  })
  
  it('should handle edge cases gracefully', () => {
    const data = generateTestData(10)
    const result = evaluateSamplingMethods(data, 20)
    
    expect(result.bestMethod).toBe('none')
    expect(result.scores['none']).toBe(1)
  })
})