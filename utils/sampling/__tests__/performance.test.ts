import { describe, it, expect } from 'vitest'
import { 
  sampleData,
  sampleMultipleSeries,
  lttbSample, 
  nthPointSample,
  stratifiedNthPointSample,
  douglasPeuckerWithTarget,
  adaptiveSample
} from '../index'
import { DataPoint, SamplingOptions } from '../types'

// Generate large dataset for performance testing
function generateLargeDataset(size: number): DataPoint[] {
  const data: DataPoint[] = []
  const startTime = Date.now()
  
  for (let i = 0; i < size; i++) {
    data.push({
      x: new Date(startTime + i * 1000), // 1 second intervals
      y: Math.sin(i / 100) * 50 + Math.random() * 10 + 50
    })
  }
  
  return data
}

describe('Performance Tests', () => {
  it('should handle 10k points efficiently', () => {
    const data = generateLargeDataset(10000)
    const start = performance.now()
    
    const result = sampleData(data, {
      method: 'auto',
      targetPoints: 500
    })
    
    const elapsed = performance.now() - start
    
    expect(result.sampledCount).toBeLessThanOrEqual(500)
    expect(elapsed).toBeLessThan(100) // Should complete within 100ms
    console.log(`10k points sampled in ${elapsed.toFixed(2)}ms`)
  })
  
  it('should handle 100k points with multi-stage sampling', () => {
    const data = generateLargeDataset(100000)
    const start = performance.now()
    
    const result = sampleData(data, {
      method: 'auto',
      targetPoints: 1000,
      threshold: 10000
    })
    
    const elapsed = performance.now() - start
    
    expect(result.sampledCount).toBeLessThanOrEqual(1000)
    expect(elapsed).toBeLessThan(500) // Should complete within 500ms
    console.log(`100k points sampled in ${elapsed.toFixed(2)}ms`)
  })
  
  it('should efficiently sample multiple series', () => {
    const seriesCount = 10
    const pointsPerSeries = 5000
    const seriesData = new Map<string, DataPoint[]>()
    
    // Generate multiple series
    for (let s = 0; s < seriesCount; s++) {
      const data = generateLargeDataset(pointsPerSeries)
      seriesData.set(`series-${s}`, data)
    }
    
    const start = performance.now()
    
    const results = sampleMultipleSeries(seriesData, {
      method: 'auto',
      targetPoints: 2000
    })
    
    const elapsed = performance.now() - start
    
    let totalSampled = 0
    results.forEach(result => {
      totalSampled += result.sampledCount
    })
    
    expect(totalSampled).toBeLessThanOrEqual(2000)
    expect(elapsed).toBeLessThan(200) // Should complete within 200ms
    console.log(`${seriesCount} series (${pointsPerSeries} points each) sampled in ${elapsed.toFixed(2)}ms`)
  })
  
  it('should compare performance of different algorithms', () => {
    const data = generateLargeDataset(5000)
    const targetPoints = 500
    
    const algorithms = [
      { name: 'LTTB', method: 'lttb' as const },
      { name: 'Nth-Point', method: 'nth-point' as const },
      { name: 'Douglas-Peucker', method: 'douglas-peucker' as const },
      { name: 'Auto', method: 'auto' as const }
    ]
    
    const results = algorithms.map(algo => {
      const start = performance.now()
      const result = sampleData(data, {
        method: algo.method,
        targetPoints
      })
      const elapsed = performance.now() - start
      
      return {
        name: algo.name,
        elapsed,
        sampledCount: result.sampledCount
      }
    })
    
    console.log('\nAlgorithm Performance Comparison:')
    results.forEach(r => {
      console.log(`${r.name}: ${r.elapsed.toFixed(2)}ms (${r.sampledCount} points)`)
    })
    
    // All algorithms should complete reasonably fast
    results.forEach(r => {
      expect(r.elapsed).toBeLessThan(50)
    })
  })
  
  it('should demonstrate memory efficiency', () => {
    const data = generateLargeDataset(50000)
    
    // Measure initial memory (approximate)
    const before = process.memoryUsage().heapUsed
    
    const result = sampleData(data, {
      method: 'lttb',
      targetPoints: 1000
    })
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }
    
    const after = process.memoryUsage().heapUsed
    const memoryIncrease = (after - before) / 1024 / 1024 // Convert to MB
    
    console.log(`Memory increase: ${memoryIncrease.toFixed(2)} MB`)
    
    expect(result.sampledCount).toBeLessThanOrEqual(1000)
    // Memory increase should be reasonable (less than 50MB for this operation)
    expect(Math.abs(memoryIncrease)).toBeLessThan(50)
  })
})