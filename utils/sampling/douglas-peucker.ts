import { DataPoint, SamplingFunction } from './types'

/**
 * Douglas-Peucker algorithm for line simplification
 * Preserves the shape of lines by keeping points that deviate most from simplified version
 * Good for preserving sharp turns and important features
 */
export const douglasPeuckerSample: SamplingFunction<any> = <T extends DataPoint>(
  data: T[],
  targetPoints: number
): T[] => {
  if (data.length <= targetPoints) {
    return data
  }
  
  // Binary search for optimal epsilon
  let low = 0
  let high = 1000
  let bestResult = data
  
  while (low <= high) {
    const epsilon = (low + high) / 2
    const simplified = douglasPeuckerRecursive(data, epsilon)
    
    if (simplified.length > targetPoints) {
      low = epsilon + 0.1
    } else {
      bestResult = simplified
      high = epsilon - 0.1
    }
    
    if (high - low < 0.1) break
  }
  
  return bestResult
}

function douglasPeuckerRecursive<T extends DataPoint>(
  points: T[],
  epsilon: number
): T[] {
  if (points.length <= 2) return points
  
  // Find the point with maximum distance
  let maxDistance = 0
  let maxIndex = 0
  
  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(
      points[i],
      points[0],
      points[points.length - 1]
    )
    
    if (distance > maxDistance) {
      maxDistance = distance
      maxIndex = i
    }
  }
  
  // If max distance is greater than epsilon, recursively simplify
  if (maxDistance > epsilon) {
    const left = douglasPeuckerRecursive(points.slice(0, maxIndex + 1), epsilon)
    const right = douglasPeuckerRecursive(points.slice(maxIndex), epsilon)
    
    return left.slice(0, -1).concat(right)
  } else {
    return [points[0], points[points.length - 1]]
  }
}

function perpendicularDistance<T extends DataPoint>(
  point: T,
  lineStart: T,
  lineEnd: T
): number {
  const x = convertToNumber(point.x)
  const y = point.y
  const x1 = convertToNumber(lineStart.x)
  const y1 = lineStart.y
  const x2 = convertToNumber(lineEnd.x)
  const y2 = lineEnd.y
  
  const dx = x2 - x1
  const dy = y2 - y1
  
  if (dx === 0 && dy === 0) {
    return Math.sqrt(Math.pow(x - x1, 2) + Math.pow(y - y1, 2))
  }
  
  const normalLength = Math.sqrt(dx * dx + dy * dy)
  
  return Math.abs((dy * x - dx * y + x2 * y1 - y2 * x1) / normalLength)
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