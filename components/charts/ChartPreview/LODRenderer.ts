import * as d3 from 'd3'
import { ChartComponent } from '@/types'

export interface LODConfig {
  level: 'low' | 'medium' | 'high'
  maxPoints: number
  showGrid: boolean
  showLabels: boolean
  showMarkers: boolean
  markerSize: number
  lineWidth: number
}

/**
 * Determine LOD level based on data size and zoom level
 */
export function determineLODLevel(
  dataPointCount: number,
  zoomLevel: number = 1,
  viewportSize: { width: number; height: number }
): LODConfig {
  const effectiveDataPoints = dataPointCount / zoomLevel
  const pixelsPerPoint = (viewportSize.width * viewportSize.height) / effectiveDataPoints
  
  if (pixelsPerPoint < 10 || effectiveDataPoints > 5000) {
    // Low detail for high density
    return {
      level: 'low',
      maxPoints: 500,
      showGrid: false,
      showLabels: false,
      showMarkers: false,
      markerSize: 0,
      lineWidth: 1
    }
  } else if (pixelsPerPoint < 50 || effectiveDataPoints > 1000) {
    // Medium detail
    return {
      level: 'medium',
      maxPoints: 1000,
      showGrid: true,
      showLabels: true,
      showMarkers: false,
      markerSize: 0,
      lineWidth: 1.5
    }
  } else {
    // High detail for low density
    return {
      level: 'high',
      maxPoints: 5000,
      showGrid: true,
      showLabels: true,
      showMarkers: true,
      markerSize: 3,
      lineWidth: 2
    }
  }
}

/**
 * Simplify data based on LOD level using Douglas-Peucker algorithm
 */
export function simplifyData<T extends { x: number | string | Date; y: number }>(
  data: T[],
  lodConfig: LODConfig
): T[] {
  if (data.length <= lodConfig.maxPoints) {
    return data
  }
  
  // Use Douglas-Peucker algorithm for line simplification
  const epsilon = calculateEpsilon(data, lodConfig.maxPoints)
  return douglasPeucker(data, epsilon)
}

/**
 * Calculate epsilon for Douglas-Peucker based on desired point count
 */
function calculateEpsilon<T extends { x: number | string | Date; y: number }>(
  data: T[],
  targetPoints: number
): number {
  // Binary search for optimal epsilon
  let low = 0
  let high = 1000
  let bestEpsilon = 0
  
  while (low <= high) {
    const mid = (low + high) / 2
    const simplified = douglasPeucker(data, mid)
    
    if (simplified.length > targetPoints) {
      low = mid + 0.1
    } else {
      bestEpsilon = mid
      high = mid - 0.1
    }
    
    if (high - low < 0.1) break
  }
  
  return bestEpsilon
}

/**
 * Douglas-Peucker algorithm for line simplification
 */
function douglasPeucker<T extends { x: number | string | Date; y: number }>(
  points: T[],
  epsilon: number
): T[] {
  if (points.length <= 2) return points
  
  // Find the point with maximum distance
  let maxDistance = 0
  let maxIndex = 0
  
  for (let i = 1; i < points.length - 1; i++) {
    const distance = perpendicularDistance(
      { x: convertToNumber(points[i].x), y: points[i].y },
      { x: convertToNumber(points[0].x), y: points[0].y },
      { x: convertToNumber(points[points.length - 1].x), y: points[points.length - 1].y }
    )
    
    if (distance > maxDistance) {
      maxDistance = distance
      maxIndex = i
    }
  }
  
  // If max distance is greater than epsilon, recursively simplify
  if (maxDistance > epsilon) {
    const left = douglasPeucker(points.slice(0, maxIndex + 1), epsilon)
    const right = douglasPeucker(points.slice(maxIndex), epsilon)
    
    return left.slice(0, -1).concat(right)
  } else {
    return [points[0], points[points.length - 1]]
  }
}

/**
 * Calculate perpendicular distance from point to line
 */
function perpendicularDistance(
  point: { x: number; y: number },
  lineStart: { x: number; y: number },
  lineEnd: { x: number; y: number }
): number {
  const dx = lineEnd.x - lineStart.x
  const dy = lineEnd.y - lineStart.y
  
  if (dx === 0 && dy === 0) {
    return Math.sqrt(
      Math.pow(point.x - lineStart.x, 2) + 
      Math.pow(point.y - lineStart.y, 2)
    )
  }
  
  const normalLength = Math.sqrt(dx * dx + dy * dy)
  
  return Math.abs(
    (dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x) / 
    normalLength
  )
}

/**
 * Render grid lines based on LOD level
 */
export function renderLODGrid(
  g: d3.Selection<SVGGElement, unknown, null, undefined>,
  width: number,
  height: number,
  xScale: d3.ScaleLinear<number, number> | d3.ScaleTime<number, number>,
  yScale: d3.ScaleLinear<number, number>,
  lodConfig: LODConfig
): void {
  if (!lodConfig.showGrid) return
  
  // Adjust tick count based on LOD level
  const xTickCount = lodConfig.level === 'high' ? 10 : 5
  const yTickCount = lodConfig.level === 'high' ? 8 : 4
  
  // X grid lines
  const xTicks = (xScale as any).ticks(xTickCount)
  g.selectAll('.grid-line-x')
    .data(xTicks)
    .enter()
    .append('line')
    .attr('class', 'grid-line-x')
    .attr('x1', d => xScale(d as any))
    .attr('x2', d => xScale(d as any))
    .attr('y1', 0)
    .attr('y2', height)
    .style('stroke', '#e0e0e0')
    .style('stroke-width', 0.5)
    .style('opacity', lodConfig.level === 'low' ? 0.3 : 0.5)
    
  // Y grid lines
  const yTicks = yScale.ticks(yTickCount)
  g.selectAll('.grid-line-y')
    .data(yTicks)
    .enter()
    .append('line')
    .attr('class', 'grid-line-y')
    .attr('x1', 0)
    .attr('x2', width)
    .attr('y1', d => yScale(d))
    .attr('y2', d => yScale(d))
    .style('stroke', '#e0e0e0')
    .style('stroke-width', 0.5)
    .style('opacity', lodConfig.level === 'low' ? 0.3 : 0.5)
}

/**
 * Convert x value to number for calculations
 */
function convertToNumber(x: number | string | Date): number {
  if (typeof x === 'number') return x
  if (x instanceof Date) return x.getTime()
  if (typeof x === 'string') {
    const parsed = Date.parse(x)
    return isNaN(parsed) ? parseFloat(x) || 0 : parsed
  }
  return 0
}

/**
 * Get render method based on data density
 */
export function getRenderMethod(
  dataPointCount: number,
  viewportSize: { width: number; height: number }
): 'svg' | 'canvas' {
  const pixelCount = viewportSize.width * viewportSize.height
  const pointDensity = dataPointCount / pixelCount
  
  // Use canvas for high density data
  return pointDensity > 0.1 ? 'canvas' : 'svg'
}