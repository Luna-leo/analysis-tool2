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
  
  if (pixelsPerPoint < 10 || effectiveDataPoints > 2000) {
    // Low detail for high density
    return {
      level: 'low',
      maxPoints: 300,
      showGrid: false,
      showLabels: false,
      showMarkers: false,
      markerSize: 0,
      lineWidth: 1
    }
  } else if (pixelsPerPoint < 50 || effectiveDataPoints > 500) {
    // Medium detail
    return {
      level: 'medium',
      maxPoints: 500,
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
      maxPoints: 1000,
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
 * This is now only used for rendering optimization, not data reduction
 */
export function simplifyData<T extends { x: number | string | Date; y: number }>(
  data: T[],
  lodConfig: LODConfig
): T[] {
  if (data.length <= lodConfig.maxPoints) {
    return data
  }
  
  // Use Douglas-Peucker algorithm for line simplification
  return douglasPeuckerWithTarget(data, lodConfig.maxPoints)
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
    .style('stroke', '#9ca3af')
    .style('stroke-width', 0.5)
    .style('stroke-dasharray', '2,2')
    .style('opacity', lodConfig.level === 'low' ? 0.5 : 0.7)
    
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
    .style('stroke', '#9ca3af')
    .style('stroke-width', 0.5)
    .style('stroke-dasharray', '2,2')
    .style('opacity', lodConfig.level === 'low' ? 0.5 : 0.7)
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
  
  // Use canvas more aggressively for better performance
  return pointDensity > 0.05 || dataPointCount > 500 ? 'canvas' : 'svg'
}