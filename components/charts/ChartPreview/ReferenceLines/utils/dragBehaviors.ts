import * as d3 from "d3"
import { ReferenceLine } from "@/types"

interface CreateLineDragOptions {
  direction: 'vertical' | 'horizontal'
  width: number
  height: number
  onDragStart: () => void
  onDrag: (position: number) => void
  onDragEnd: (newValue: string | number) => void
  xScale?: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number>
  yScale?: d3.ScaleLinear<number, number>
  xAxisType?: string
}

interface CreateLabelDragOptions {
  onDragStart: () => void
  onDrag: (x: number, y: number) => void
  onDragEnd: (offsetX: number, offsetY: number) => void
  getLinePosition: () => number
  direction: 'vertical' | 'horizontal'
}

/**
 * Creates a drag behavior for reference lines
 */
export function createLineDragBehavior({
  direction,
  width,
  height,
  onDragStart,
  onDrag,
  onDragEnd,
  xScale,
  yScale,
  xAxisType
}: CreateLineDragOptions) {
  let labelOffset: number | null = null
  
  return d3.drag<SVGLineElement, ReferenceLine>()
    .on("start", function() {
      onDragStart()
      
      // Store the current label offset at drag start
      const currentGroup = d3.select(this.parentNode as SVGGElement)
      const currentLabelGroup = currentGroup.select(".line-label-group")
      
      if (!currentLabelGroup.empty()) {
        const currentLabel = currentLabelGroup.select(".line-label")
        const mainLine = currentGroup.select(".main-line")
        
        if (direction === 'vertical') {
          const labelX = parseFloat(currentLabel.attr("x"))
          const lineX = parseFloat(mainLine.attr("x1"))
          labelOffset = labelX - lineX
        } else {
          const labelY = parseFloat(currentLabel.attr("y"))
          const lineY = parseFloat(mainLine.attr("y1"))
          labelOffset = labelY - lineY
        }
      }
    })
    .on("drag", function(event) {
      const [x, y] = d3.pointer(event, this.parentNode as SVGGElement)
      const position = direction === 'vertical' 
        ? Math.max(0, Math.min(width, x))
        : Math.max(0, Math.min(height, y))
      
      onDrag(position)
      
      // Update visual elements directly without re-render
      const currentGroup = d3.select(this.parentNode as SVGGElement)
      const mainLine = currentGroup.select(".main-line")
      const interactiveLine = currentGroup.select(".interactive-line")
      
      if (direction === 'vertical') {
        mainLine.attr("x1", position).attr("x2", position)
        interactiveLine.attr("x1", position).attr("x2", position)
      } else {
        mainLine.attr("y1", position).attr("y2", position)
        interactiveLine.attr("y1", position).attr("y2", position)
      }
      
      // Update label position if it exists
      const currentLabelGroup = currentGroup.select(".line-label-group")
      if (!currentLabelGroup.empty() && labelOffset !== null) {
        const currentLabel = currentLabelGroup.select(".line-label")
        
        if (direction === 'vertical') {
          currentLabel.attr("x", position + labelOffset)
        } else {
          currentLabel.attr("y", position + labelOffset)
        }
        
        // Update background position
        const textBBox = (currentLabel.node() as SVGTextElement).getBBox()
        currentLabelGroup.select(".line-label-background")
          .attr("x", textBBox.x - 4)
          .attr("y", textBBox.y - 2)
          .attr("width", textBBox.width + 8)
          .attr("height", textBBox.height + 4)
      }
    })
    .on("end", function(event) {
      const [x, y] = d3.pointer(event, this.parentNode as SVGGElement)
      const position = direction === 'vertical' 
        ? Math.max(0, Math.min(width, x))
        : Math.max(0, Math.min(height, y))
      
      let newValue: string | number
      
      if (direction === 'vertical' && xScale) {
        if ((xAxisType || "datetime") === "datetime") {
          const newDate = (xScale as d3.ScaleTime<number, number>).invert(position)
          // Format date in local timezone to match the data
          const localISOString = new Date(newDate.getTime() - newDate.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 19)
          newValue = localISOString
        } else {
          const numValue = (xScale as d3.ScaleLinear<number, number>).invert(position)
          newValue = Math.round(numValue * 1000) / 1000 // 3 decimal places
        }
      } else if (direction === 'horizontal' && yScale) {
        const numValue = yScale.invert(position)
        newValue = Math.round(numValue * 1000) / 1000 // 3 decimal places
      } else {
        // Fallback, should not happen
        newValue = position
      }
      
      onDragEnd(newValue)
    })
}

/**
 * Creates a drag behavior for reference line labels
 */
export function createLabelDragBehavior({
  onDragStart,
  onDrag,
  onDragEnd,
  getLinePosition,
  direction
}: CreateLabelDragOptions) {
  return d3.drag<SVGGElement, ReferenceLine>()
    .on("start", function() {
      onDragStart()
    })
    .on("drag", function(event) {
      const [x, y] = d3.pointer(event, this)
      onDrag(x, y)
      
      const g = d3.select(this)
      g.select(".line-label")
        .attr("x", x)
        .attr("y", y)
      
      // Update background position based on text
      const textBBox = (g.select(".line-label").node() as SVGTextElement).getBBox()
      g.select(".line-label-background")
        .attr("x", textBBox.x - 4)
        .attr("y", textBBox.y - 2)
        .attr("width", textBBox.width + 8)
        .attr("height", textBBox.height + 4)
    })
    .on("end", function(event) {
      const [x, y] = d3.pointer(event, this)
      const linePos = getLinePosition()
      
      const offsetX = direction === 'vertical' ? x - linePos : x
      const offsetY = direction === 'vertical' ? y : y - linePos
      
      onDragEnd(offsetX, offsetY)
    })
}