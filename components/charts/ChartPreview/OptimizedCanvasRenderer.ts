import { ChartComponent, DataSourceStyle } from "@/types"
import { getXValueForScale } from "@/utils/chartAxisUtils"

interface OptimizedCanvasRendererProps {
  canvas: HTMLCanvasElement
  data: Array<{
    x: number | string | Date
    y: number
    series: string
    seriesIndex: number
    dataSourceId?: string
  }>
  width: number
  height: number
  margin: { top: number; right: number; bottom: number; left: number }
  xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number>
  yScale: d3.ScaleLinear<number, number>
  editingChart: ChartComponent
  colorScale: (series: string) => string
  dataSourceStyles?: { [dataSourceId: string]: DataSourceStyle }
}

// Canvas rendering pool to reuse canvases
const canvasPool: HTMLCanvasElement[] = []
const maxPoolSize = 5

function getPooledCanvas(): HTMLCanvasElement {
  if (canvasPool.length > 0) {
    return canvasPool.pop()!
  }
  return document.createElement('canvas')
}

function returnCanvasToPool(canvas: HTMLCanvasElement) {
  if (canvasPool.length < maxPoolSize) {
    // Clear canvas before returning to pool
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    }
    canvasPool.push(canvas)
  }
}

/**
 * Optimized canvas renderer with performance improvements
 */
export function renderWithOptimizedCanvas({
  canvas,
  data,
  width,
  height,
  margin,
  xScale,
  yScale,
  editingChart,
  colorScale,
  dataSourceStyles = {}
}: OptimizedCanvasRendererProps): void {
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) return
  
  // Use lower pixel ratio for better performance
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = (width + margin.left + margin.right) * dpr
  canvas.height = (height + margin.top + margin.bottom) * dpr
  canvas.style.width = `${width + margin.left + margin.right}px`
  canvas.style.height = `${height + margin.top + margin.bottom}px`
  
  // Scale for device pixel ratio
  ctx.scale(dpr, dpr)
  
  // Set white background for performance (no transparency)
  ctx.fillStyle = 'white'
  ctx.fillRect(0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom)
  
  // Enable image smoothing for better performance
  ctx.imageSmoothingEnabled = false
  
  // Translate to account for margins
  ctx.save()
  ctx.translate(margin.left, margin.top)
  
  // Skip grid for very large datasets
  if (data.length < 5000) {
    drawOptimizedGrid(ctx, width, height, xScale, yScale)
  }
  
  // Always draw axes
  drawOptimizedAxes(ctx, width, height, xScale, yScale, editingChart)
  
  // Group data by series for batch rendering
  const dataBySeriesIndex = new Map<number, typeof data>()
  data.forEach(d => {
    if (!dataBySeriesIndex.has(d.seriesIndex)) {
      dataBySeriesIndex.set(d.seriesIndex, [])
    }
    dataBySeriesIndex.get(d.seriesIndex)!.push(d)
  })
  
  // Render each series with optimizations
  dataBySeriesIndex.forEach((seriesData, seriesIndex) => {
    const firstDataPoint = seriesData[0]
    const dataSourceStyle = firstDataPoint.dataSourceId ? dataSourceStyles[firstDataPoint.dataSourceId] : undefined
    
    // Apply DataSource styles with priority
    const defaultColor = colorScale(firstDataPoint.series)
    const color = dataSourceStyle?.markerColor || dataSourceStyle?.lineColor || defaultColor
    const opacity = dataSourceStyle?.markerOpacity !== undefined ? dataSourceStyle.markerOpacity : 0.7
    const markerSize = dataSourceStyle?.markerSize || 2
    
    drawOptimizedSeries(ctx, seriesData, xScale, yScale, color, editingChart, null, width, height, opacity, markerSize)
  })
  
  ctx.restore()
}

/**
 * Optimized grid drawing - fewer lines for better performance
 */
function drawOptimizedGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  xScale: any,
  yScale: any
): void {
  ctx.save()
  ctx.strokeStyle = 'rgba(224, 224, 224, 0.5)'
  ctx.lineWidth = 0.5
  
  // Reduce grid lines for performance
  const xTicks = xScale.ticks(5)
  const yTicks = yScale.ticks(5)
  
  ctx.beginPath()
  
  // Draw all vertical lines in one path
  xTicks.forEach((tick: any) => {
    const x = Math.round(xScale(tick))
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
  })
  
  // Draw all horizontal lines in one path
  yTicks.forEach((tick: number) => {
    const y = Math.round(yScale(tick))
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
  })
  
  ctx.stroke()
  ctx.restore()
}

/**
 * Optimized axes drawing
 */
function drawOptimizedAxes(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  xScale: any,
  yScale: any,
  editingChart: ChartComponent
): void {
  ctx.save()
  ctx.strokeStyle = '#000'
  ctx.lineWidth = 1
  ctx.font = '11px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  
  // Draw axes in one path
  ctx.beginPath()
  ctx.moveTo(0, height)
  ctx.lineTo(width, height)
  ctx.moveTo(0, 0)
  ctx.lineTo(0, height)
  ctx.stroke()
  
  // Reduce number of labels for performance
  const xTicks = xScale.ticks(5)
  const yTicks = yScale.ticks(5)
  
  // X-axis labels
  ctx.fillStyle = '#666'
  xTicks.forEach((tick: any) => {
    const x = xScale(tick)
    const label = formatTickValue(tick, editingChart.xAxisType)
    ctx.fillText(label, x, height + 5)
  })
  
  // Y-axis labels
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  yTicks.forEach((tick: number) => {
    const y = yScale(tick)
    ctx.fillText(tick.toFixed(1), -5, y)
  })
  
  ctx.restore()
}

/**
 * Optimized series rendering with level of detail
 */
function drawOptimizedSeries(
  ctx: CanvasRenderingContext2D,
  data: any[],
  xScale: any,
  yScale: any,
  color: string,
  editingChart: ChartComponent,
  yParam: any,
  width: number,
  height: number,
  opacity: number = 0.7,
  markerSize: number = 2
): void {
  ctx.save()
  
  const pointsPerPixel = data.length / width
  
  // For very high density, use pixel-based rendering
  if (pointsPerPixel > 2) {
    renderAsPixels(ctx, data, xScale, yScale, color, editingChart, width, height)
  } 
  // For medium density, use lines
  else if (data.length > 1000) {
    renderAsLine(ctx, data, xScale, yScale, color, editingChart)
  } 
  // For low density, render individual points
  else {
    renderAsPoints(ctx, data, xScale, yScale, color, editingChart, yParam, opacity, markerSize)
  }
  
  ctx.restore()
}

/**
 * Render as pixels for maximum performance with high-density data
 */
function renderAsPixels(
  ctx: CanvasRenderingContext2D,
  data: any[],
  xScale: any,
  yScale: any,
  color: string,
  editingChart: ChartComponent,
  width: number,
  height: number
): void {
  // Create image data for direct pixel manipulation
  const imageData = ctx.createImageData(width, height)
  const pixels = imageData.data
  
  // Parse color to RGB
  const rgb = hexToRgb(color) || { r: 0, g: 0, b: 255 }
  
  // Plot each point as a pixel
  data.forEach(d => {
    const scaledX = getXValueForScale(d.x, editingChart.xAxisType || 'parameter')
    const x = Math.round(xScale(scaledX))
    const y = Math.round(yScale(d.y))
    
    if (x >= 0 && x < width && y >= 0 && y < height) {
      const index = (y * width + x) * 4
      pixels[index] = rgb.r
      pixels[index + 1] = rgb.g
      pixels[index + 2] = rgb.b
      pixels[index + 3] = 255
    }
  })
  
  ctx.putImageData(imageData, 0, 0)
}

/**
 * Render as continuous line for medium density
 */
function renderAsLine(
  ctx: CanvasRenderingContext2D,
  data: any[],
  xScale: any,
  yScale: any,
  color: string,
  editingChart: ChartComponent
): void {
  ctx.strokeStyle = color
  ctx.lineWidth = 1
  ctx.globalAlpha = 0.8
  
  ctx.beginPath()
  
  // Use every nth point for very large datasets
  const step = Math.max(1, Math.floor(data.length / 2000))
  
  for (let i = 0; i < data.length; i += step) {
    const d = data[i]
    const scaledX = getXValueForScale(d.x, editingChart.xAxisType || 'parameter')
    const x = xScale(scaledX)
    const y = yScale(d.y)
    
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  
  ctx.stroke()
}

/**
 * Render as individual points for low density
 */
function renderAsPoints(
  ctx: CanvasRenderingContext2D,
  data: any[],
  xScale: any,
  yScale: any,
  color: string,
  editingChart: ChartComponent,
  yParam: any,
  opacity: number = 0.7,
  markerSizeParam: number = 2
): void {
  ctx.fillStyle = color
  ctx.globalAlpha = opacity
  
  const markerSize = markerSizeParam
  
  // Batch render all points
  ctx.beginPath()
  data.forEach(d => {
    const scaledX = getXValueForScale(d.x, editingChart.xAxisType || 'parameter')
    const x = xScale(scaledX)
    const y = yScale(d.y)
    
    ctx.moveTo(x + markerSize, y)
    ctx.arc(x, y, markerSize, 0, 2 * Math.PI)
  })
  ctx.fill()
}

/**
 * Format tick value based on axis type
 */
function formatTickValue(value: any, axisType?: string): string {
  if (axisType === 'datetime' && value instanceof Date) {
    return value.toLocaleDateString()
  }
  
  if (typeof value === 'number') {
    return value.toFixed(1)
  }
  
  return String(value)
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

/**
 * Cleanup function to return canvas to pool
 */
export function cleanupCanvas(canvas: HTMLCanvasElement) {
  returnCanvasToPool(canvas)
}