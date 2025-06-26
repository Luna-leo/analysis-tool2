import * as d3 from "d3"
import { MarkerType } from "@/types"

export interface MarkerConfig {
  x: number
  y: number
  type: MarkerType
  size: number
  fillColor: string
  borderColor: string
  opacity?: number
  data?: any // Additional data for tooltips
}

export interface MarkerRenderOptions {
  container: d3.Selection<SVGGElement, unknown, null, undefined> | CanvasRenderingContext2D
  markers: MarkerConfig[]
  onMouseOver?: (event: MouseEvent, data: any) => void
  onMouseMove?: (event: MouseEvent, data: any) => void
  onMouseOut?: (event: MouseEvent, data: any) => void
}

/**
 * Unified marker renderer that supports both SVG and Canvas rendering
 * Eliminates duplication between LineChart and ScatterPlot
 */
export class MarkerRenderer {
  /**
   * Render markers to either SVG or Canvas
   */
  static render(options: MarkerRenderOptions): void {
    const { container, markers } = options
    
    if (this.isCanvas(container)) {
      this.renderToCanvas(container as CanvasRenderingContext2D, markers)
    } else {
      this.renderToSVG(
        container as d3.Selection<SVGGElement, unknown, null, undefined>, 
        markers, 
        options
      )
    }
  }

  /**
   * Check if container is a Canvas context
   */
  private static isCanvas(container: any): boolean {
    return container && 'beginPath' in container
  }

  /**
   * Render markers to Canvas
   */
  private static renderToCanvas(ctx: CanvasRenderingContext2D, markers: MarkerConfig[]): void {
    ctx.save()
    
    markers.forEach(marker => {
      ctx.fillStyle = marker.fillColor
      ctx.strokeStyle = marker.borderColor
      ctx.lineWidth = 1
      ctx.globalAlpha = marker.opacity || 1
      
      this.drawMarkerShape(ctx, marker)
    })
    
    ctx.restore()
  }

  /**
   * Render markers to SVG with event handling
   */
  private static renderToSVG(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    markers: MarkerConfig[],
    options: MarkerRenderOptions
  ): void {
    const markerGroup = container.append("g")
      .attr("class", "markers")
    
    markers.forEach((marker, index) => {
      // Create a larger invisible hit area for better hover stability
      const hitAreaSize = Math.max(marker.size * 2, 20) // At least 20px hit area
      const hitArea = markerGroup.append("rect")
        .attr("x", marker.x - hitAreaSize / 2)
        .attr("y", marker.y - hitAreaSize / 2)
        .attr("width", hitAreaSize)
        .attr("height", hitAreaSize)
        .style("fill", "transparent")
        .style("pointer-events", "all")
        .style("cursor", "pointer")
      
      const element = this.createSVGMarker(markerGroup, marker, index)
      
      if (element && (options.onMouseOver || options.onMouseMove || options.onMouseOut)) {
        element
          .style("pointer-events", "none") // Disable pointer events on visual element
        
        // Apply events to hit area instead of visual element
        if (options.onMouseOver) {
          hitArea.on("mouseenter", function(event) {
            event.stopPropagation() // Prevent event bubbling
            element
              .style("opacity", 1)
              .style("stroke-width", 2)
            options.onMouseOver!(event, marker.data ?? marker)
          })
        }
        
        if (options.onMouseMove) {
          hitArea.on("mousemove", (event) => {
            event.stopPropagation()
            options.onMouseMove!(event, marker.data ?? marker)
          })
        }
        
        if (options.onMouseOut) {
          hitArea.on("mouseleave", function(event) {
            event.stopPropagation()
            element
              .style("opacity", marker.opacity || 0.7)
              .style("stroke-width", 1)
            options.onMouseOut!(event, marker.data ?? marker)
          })
        }
      }
    })
  }

  /**
   * Create SVG marker element based on type
   */
  private static createSVGMarker(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    marker: MarkerConfig,
    index: number
  ): d3.Selection<any, unknown, null, undefined> | null {
    const { x, y, type, size, fillColor, borderColor, opacity = 1 } = marker
    const halfSize = size / 2
    
    switch (type) {
      case "circle":
        return container.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", halfSize)
          .style("fill", fillColor)
          .style("stroke", borderColor)
          .style("stroke-width", 1)
          .style("opacity", opacity)
      
      case "square":
        return container.append("rect")
          .attr("x", x - halfSize)
          .attr("y", y - halfSize)
          .attr("width", size)
          .attr("height", size)
          .style("fill", fillColor)
          .style("stroke", borderColor)
          .style("stroke-width", 1)
          .style("opacity", opacity)
      
      case "triangle":
        return container.append("path")
          .attr("d", d3.symbol().type(d3.symbolTriangle).size(size * size)())
          .attr("transform", `translate(${x},${y})`)
          .style("fill", fillColor)
          .style("stroke", borderColor)
          .style("stroke-width", 1)
          .style("opacity", opacity)
      
      case "diamond":
        return container.append("path")
          .attr("d", d3.symbol().type(d3.symbolDiamond).size(size * size * 1.25)())
          .attr("transform", `translate(${x},${y})`)
          .style("fill", fillColor)
          .style("stroke", borderColor)
          .style("stroke-width", 1)
          .style("opacity", opacity)
      
      case "star":
        return container.append("path")
          .attr("d", d3.symbol().type(d3.symbolStar).size(size * size)())
          .attr("transform", `translate(${x},${y})`)
          .style("fill", fillColor)
          .style("stroke", borderColor)
          .style("stroke-width", 1)
          .style("opacity", opacity)
      
      case "cross":
        return container.append("path")
          .attr("d", d3.symbol().type(d3.symbolCross).size(size * size)())
          .attr("transform", `translate(${x},${y})`)
          .style("fill", fillColor)
          .style("stroke", borderColor)
          .style("stroke-width", 1)
          .style("opacity", opacity)
      
      default:
        // Default to circle for unknown types
        return this.createSVGMarker(container, { ...marker, type: "circle" }, index)
    }
  }

  /**
   * Draw marker shape on Canvas
   */
  private static drawMarkerShape(ctx: CanvasRenderingContext2D, marker: MarkerConfig): void {
    const { x, y, type, size } = marker
    const halfSize = size / 2
    
    switch (type) {
      case "circle":
        ctx.beginPath()
        ctx.arc(x, y, halfSize, 0, 2 * Math.PI)
        ctx.fill()
        ctx.stroke()
        break
      
      case "square":
        ctx.fillRect(x - halfSize, y - halfSize, size, size)
        ctx.strokeRect(x - halfSize, y - halfSize, size, size)
        break
      
      case "triangle":
        ctx.beginPath()
        ctx.moveTo(x, y - halfSize)
        ctx.lineTo(x - halfSize, y + halfSize)
        ctx.lineTo(x + halfSize, y + halfSize)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        break
      
      case "diamond":
        ctx.beginPath()
        ctx.moveTo(x, y - halfSize)
        ctx.lineTo(x + halfSize, y)
        ctx.lineTo(x, y + halfSize)
        ctx.lineTo(x - halfSize, y)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        break
      
      case "star":
        const spikes = 5
        const outerRadius = halfSize
        const innerRadius = halfSize * 0.5
        ctx.beginPath()
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius
          const angle = (i * Math.PI) / spikes - Math.PI / 2
          const px = x + Math.cos(angle) * radius
          const py = y + Math.sin(angle) * radius
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        break
      
      case "cross":
        const crossSize = halfSize * 0.8
        ctx.beginPath()
        ctx.moveTo(x - crossSize, y)
        ctx.lineTo(x + crossSize, y)
        ctx.moveTo(x, y - crossSize)
        ctx.lineTo(x, y + crossSize)
        ctx.stroke()
        break
      
      default:
        // Default to circle
        this.drawMarkerShape(ctx, { ...marker, type: "circle" })
    }
  }

  /**
   * Create markers configuration from chart data
   */
  static createMarkersFromData<T extends { x: number; y: number }>(
    data: T[],
    xScale: d3.ScaleLinear<number, number> | d3.ScaleTime<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    markerConfig: {
      type: MarkerType
      size: number
      fillColor: string
      borderColor: string
      opacity?: number
    }
  ): MarkerConfig[] {
    return data.map(d => ({
      x: xScale(d.x as any),
      y: yScale(d.y),
      type: markerConfig.type,
      size: markerConfig.size,
      fillColor: markerConfig.fillColor,
      borderColor: markerConfig.borderColor,
      opacity: markerConfig.opacity,
      data: d
    }))
  }
}