import { DataPoint } from './types'

/**
 * Check if data points are collinear (form a straight line)
 * This is particularly important for cases where X and Y are the same parameter
 */
export function isCollinear<T extends DataPoint>(
  data: T[],
  tolerance: number = 1e-10
): boolean {
  if (data.length < 3) return true
  
  // Convert first few points to check collinearity
  const sampleSize = Math.min(100, data.length)
  const step = Math.max(1, Math.floor(data.length / sampleSize))
  
  // Get first three distinct points
  let p1: T | null = null
  let p2: T | null = null
  let p3: T | null = null
  
  for (let i = 0; i < data.length; i += step) {
    const point = data[i]
    const x = convertToNumber(point.x)
    const y = point.y
    
    if (p1 === null) {
      p1 = point
    } else if (p2 === null && (x !== convertToNumber(p1.x) || y !== p1.y)) {
      p2 = point
    } else if (p3 === null && p2 !== null) {
      // Check if this point is different from both p1 and p2
      if ((x !== convertToNumber(p1.x) || y !== p1.y) && 
          (x !== convertToNumber(p2.x) || y !== p2.y)) {
        p3 = point
        break
      }
    }
  }
  
  // If we don't have three distinct points, data is collinear
  if (p1 === null || p2 === null || p3 === null) {
    return true
  }
  
  // Calculate the area of the triangle formed by the three points
  // If the area is close to zero, the points are collinear
  const x1 = convertToNumber(p1.x)
  const y1 = p1.y
  const x2 = convertToNumber(p2.x)
  const y2 = p2.y
  const x3 = convertToNumber(p3.x)
  const y3 = p3.y
  
  const area = Math.abs(
    (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2)) / 2
  )
  
  // Also check if all sampled points lie on the same line
  // by checking additional points if the first three are collinear
  if (area < tolerance) {
    // If first three points are collinear, check more points
    // to ensure it's not just a coincidence
    let allCollinear = true
    
    for (let i = 0; i < data.length && allCollinear; i += step) {
      const x = convertToNumber(data[i].x)
      const y = data[i].y
      
      // Check if point lies on the line defined by p1 and p2
      // Using the cross product method
      const crossProduct = (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1)
      
      if (Math.abs(crossProduct) > tolerance) {
        allCollinear = false
      }
    }
    
    return allCollinear
  }
  
  return false
}

/**
 * Check if X and Y values are identical (perfect diagonal)
 */
export function isXYIdentical<T extends DataPoint>(
  data: T[],
  tolerance: number = 1e-10
): boolean {
  if (data.length === 0) return false
  
  const sampleSize = Math.min(100, data.length)
  const step = Math.max(1, Math.floor(data.length / sampleSize))
  
  for (let i = 0; i < data.length; i += step) {
    const x = convertToNumber(data[i].x)
    const y = data[i].y
    
    if (Math.abs(x - y) > tolerance) {
      return false
    }
  }
  
  return true
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