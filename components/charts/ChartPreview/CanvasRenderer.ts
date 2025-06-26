import { ChartComponent } from "@/types"
import { getXValueForScale } from "@/utils/chartAxisUtils"

interface CanvasRendererProps {
  canvas: HTMLCanvasElement
  data: Array<{
    x: number | string | Date
    y: number
    series: string
    seriesIndex: number
  }>
  width: number
  height: number
  margin: { top: number; right: number; bottom: number; left: number }
  xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number>
  yScale: d3.ScaleLinear<number, number>
  editingChart: ChartComponent
  colorScale: (series: string) => string
}

/**
 * Render chart using Canvas for better performance with large datasets
 */
export function renderWithCanvas({
  canvas,
  data,
  width,
  height,
  margin,
  xScale,
  yScale,
  editingChart,
  colorScale
}: CanvasRendererProps): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // Set canvas size with device pixel ratio for crisp rendering
  const dpr = window.devicePixelRatio || 1
  canvas.width = (width + margin.left + margin.right) * dpr
  canvas.height = (height + margin.top + margin.bottom) * dpr
  canvas.style.width = `${width + margin.left + margin.right}px`
  canvas.style.height = `${height + margin.top + margin.bottom}px`
  
  // Scale for device pixel ratio
  ctx.scale(dpr, dpr)
  
  // Clear canvas
  ctx.clearRect(0, 0, width + margin.left + margin.right, height + margin.top + margin.bottom)
  
  // Translate to account for margins
  ctx.save()
  ctx.translate(margin.left, margin.top)
  
  // Draw grid lines
  drawGrid(ctx, width, height, xScale, yScale)
  
  // Draw axes
  drawAxes(ctx, width, height, xScale, yScale, editingChart)
  
  // Group data by series
  const dataBySeriesIndex = new Map<number, typeof data>()
  data.forEach(d => {
    if (!dataBySeriesIndex.has(d.seriesIndex)) {
      dataBySeriesIndex.set(d.seriesIndex, [])
    }
    dataBySeriesIndex.get(d.seriesIndex)!.push(d)
  })
  
  // Draw data for each series
  dataBySeriesIndex.forEach((seriesData, seriesIndex) => {
    const yParam = editingChart.yAxisParams?.[seriesIndex]
    const color = yParam?.marker?.fillColor || colorScale(seriesData[0].series)
    
    drawSeries(ctx, seriesData, xScale, yScale, color, editingChart, yParam)
  })
  
  ctx.restore()
}

/**
 * Draw grid lines
 */
function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  xScale: any,
  yScale: any
): void {
  ctx.save()
  ctx.strokeStyle = '#e0e0e0'
  ctx.lineWidth = 0.5
  ctx.setLineDash([2, 2])
  
  // Vertical grid lines
  const xTicks = xScale.ticks()
  xTicks.forEach((tick: any) => {
    const x = xScale(tick)
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  })
  
  // Horizontal grid lines
  const yTicks = yScale.ticks()
  yTicks.forEach((tick: number) => {
    const y = yScale(tick)
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  })
  
  ctx.restore()
}

/**
 * Draw axes
 */
function drawAxes(
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
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  
  // X-axis
  ctx.beginPath()
  ctx.moveTo(0, height)
  ctx.lineTo(width, height)
  ctx.stroke()
  
  // X-axis labels
  const xTicks = xScale.ticks()
  xTicks.forEach((tick: any) => {
    const x = xScale(tick)
    ctx.fillText(formatTickValue(tick, editingChart.xAxisType), x, height + 5)
  })
  
  // Y-axis
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(0, height)
  ctx.stroke()
  
  // Y-axis labels
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  const yTicks = yScale.ticks()
  yTicks.forEach((tick: number) => {
    const y = yScale(tick)
    ctx.fillText(tick.toFixed(2), -5, y)
  })
  
  ctx.restore()
}

/**
 * Draw data series
 */
function drawSeries(
  ctx: CanvasRenderingContext2D,
  data: any[],
  xScale: any,
  yScale: any,
  color: string,
  editingChart: ChartComponent,
  yParam: any
): void {
  ctx.save()
  
  const markerType = yParam?.marker?.type || 'circle'
  const markerSize = yParam?.marker?.size || 2
  
  // For large datasets, use more efficient rendering
  if (data.length > 1000) {
    // Draw as connected line for performance
    ctx.strokeStyle = color
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.7
    
    ctx.beginPath()
    data.forEach((d, i) => {
      const scaledX = getXValueForScale(d.x, editingChart.xAxisType || 'parameter')
      const x = xScale(scaledX)
      const y = yScale(d.y)
      
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.stroke()
  } else {
    // Draw individual markers
    ctx.fillStyle = color
    ctx.strokeStyle = color
    ctx.globalAlpha = 0.7
    
    data.forEach(d => {
      const scaledX = getXValueForScale(d.x, editingChart.xAxisType || 'parameter')
      const x = xScale(scaledX)
      const y = yScale(d.y)
      
      drawMarker(ctx, x, y, markerType, markerSize)
    })
  }
  
  ctx.restore()
}

/**
 * Draw individual marker
 */
function drawMarker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: string,
  size: number
): void {
  ctx.beginPath()
  
  switch (type) {
    case 'circle':
      ctx.arc(x, y, size, 0, 2 * Math.PI)
      ctx.fill()
      break
      
    case 'square':
      ctx.rect(x - size, y - size, size * 2, size * 2)
      ctx.fill()
      break
      
    case 'triangle':
      ctx.moveTo(x, y - size)
      ctx.lineTo(x - size, y + size)
      ctx.lineTo(x + size, y + size)
      ctx.closePath()
      ctx.fill()
      break
      
    case 'diamond':
      ctx.moveTo(x, y - size)
      ctx.lineTo(x + size, y)
      ctx.lineTo(x, y + size)
      ctx.lineTo(x - size, y)
      ctx.closePath()
      ctx.fill()
      break
      
    default:
      // Default to circle
      ctx.arc(x, y, size, 0, 2 * Math.PI)
      ctx.fill()
  }
}

/**
 * Format tick value based on axis type
 */
function formatTickValue(value: any, axisType?: string): string {
  if (axisType === 'datetime' && value instanceof Date) {
    return value.toLocaleDateString()
  }
  
  if (typeof value === 'number') {
    return value.toFixed(2)
  }
  
  return String(value)
}