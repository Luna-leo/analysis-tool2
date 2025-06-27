"use client"

import { useCallback } from 'react'
import * as d3 from 'd3'
import { ReferenceLine } from '@/types'

interface LineDragCallbacks {
  onDragStart: () => void
  onDrag: (position: number) => void
  onDragEnd: (newValue: number | string) => void
}

interface LabelDragCallbacks {
  onLabelDragStart: () => void
  onLabelDrag: (x: number, y: number) => void
  onLabelDragEnd: (offsetX: number, offsetY: number) => void
}

export function useReferenceLineDrag() {
  
  const createVerticalLineDrag = useCallback((
    xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number>,
    width: number,
    xAxisType: string,
    callbacks: LineDragCallbacks
  ) => {
    let labelOffsetX: number | null = null
    
    return d3.drag<SVGLineElement, unknown>()
      .on("start", function() {
        callbacks.onDragStart()
        // Store the current label offset at drag start
        const currentGroup = d3.select(this.parentNode as SVGGElement)
        const currentLabelGroup = currentGroup.select(".line-label-group")
        if (!currentLabelGroup.empty()) {
          const currentLabel = currentLabelGroup.select(".line-label")
          const labelX = parseFloat(currentLabel.attr("x"))
          const lineX = parseFloat(currentGroup.select(".main-line").attr("x1"))
          labelOffsetX = labelX - lineX
        }
      })
      .on("drag", function(event) {
        // Use d3.pointer to get accurate coordinates relative to the parent group
        const [x, _] = d3.pointer(event, this.parentNode as SVGGElement)
        const clampedX = Math.max(0, Math.min(width, x))
        
        callbacks.onDrag(clampedX)
        
        // Update visual elements directly without re-render
        const currentGroup = d3.select(this.parentNode as SVGGElement)
        currentGroup.select(".main-line")
          .attr("x1", clampedX)
          .attr("x2", clampedX)
        currentGroup.select(".interactive-line")
          .attr("x1", clampedX)
          .attr("x2", clampedX)
        const currentLabelGroup = currentGroup.select(".line-label-group")
        if (!currentLabelGroup.empty() && labelOffsetX !== null) {
          // Update label and background position maintaining the offset
          const currentLabel = currentLabelGroup.select(".line-label")
          currentLabel.attr("x", clampedX + labelOffsetX)
          
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
        // Use d3.pointer to get accurate coordinates relative to the parent group
        const [x, _] = d3.pointer(event, this.parentNode as SVGGElement)
        const clampedX = Math.max(0, Math.min(width, x))
        
        let newValue: string | number
        if ((xAxisType || "datetime") === "datetime") {
          const newDate = (xScale as d3.ScaleTime<number, number>).invert(clampedX)
          
          // Format date in local timezone to match the data
          const localISOString = new Date(newDate.getTime() - newDate.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 19)
          
          newValue = localISOString
        } else {
          // For time or parameter axis
          const numValue = (xScale as d3.ScaleLinear<number, number>).invert(clampedX)
          // Keep decimal precision
          newValue = Math.round(numValue * 1000) / 1000 // 3 decimal places
        }
        
        callbacks.onDragEnd(newValue)
      })
  }, [])

  const createHorizontalLineDrag = useCallback((
    yScale: d3.ScaleLinear<number, number>,
    height: number,
    callbacks: LineDragCallbacks
  ) => {
    let labelOffsetY: number | null = null
    
    return d3.drag<SVGLineElement, unknown>()
      .on("start", function() {
        callbacks.onDragStart()
        // Store the current label offset at drag start
        const currentGroup = d3.select(this.parentNode as SVGGElement)
        const currentLabelGroup = currentGroup.select(".line-label-group")
        if (!currentLabelGroup.empty()) {
          const currentLabel = currentLabelGroup.select(".line-label")
          const labelY = parseFloat(currentLabel.attr("y"))
          const lineY = parseFloat(currentGroup.select(".main-line").attr("y1"))
          labelOffsetY = labelY - lineY
        }
      })
      .on("drag", function(event) {
        // Use d3.pointer to get accurate coordinates relative to the parent group
        const [_, y] = d3.pointer(event, this.parentNode as SVGGElement)
        const clampedY = Math.max(0, Math.min(height, y))
        callbacks.onDrag(clampedY)
        
        // Update visual elements directly without re-render
        const currentGroup = d3.select(this.parentNode as SVGGElement)
        currentGroup.select(".main-line")
          .attr("y1", clampedY)
          .attr("y2", clampedY)
        currentGroup.select(".interactive-line")
          .attr("y1", clampedY)
          .attr("y2", clampedY)
        const currentLabelGroup = currentGroup.select(".line-label-group")
        if (!currentLabelGroup.empty() && labelOffsetY !== null) {
          // Update label and background position maintaining the offset
          const currentLabel = currentLabelGroup.select(".line-label")
          currentLabel.attr("y", clampedY + labelOffsetY)
          
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
        // Use d3.pointer to get accurate coordinates relative to the parent group
        const [_, y] = d3.pointer(event, this.parentNode as SVGGElement)
        const clampedY = Math.max(0, Math.min(height, y))
        const numValue = yScale.invert(clampedY)
        // Keep decimal precision
        const newValue = Math.round(numValue * 1000) / 1000 // 3 decimal places
        callbacks.onDragEnd(newValue)
      })
  }, [])

  const createLabelDrag = useCallback((
    isVertical: boolean,
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    callbacks: LabelDragCallbacks
  ) => {
    return d3.drag<SVGGElement, unknown>()
      .on("start", function() {
        callbacks.onLabelDragStart()
      })
      .on("drag", function(event) {
        // Use d3.pointer for label drag as well
        const [x, y] = d3.pointer(event, this)
        callbacks.onLabelDrag(x, y)
        
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
        // Use d3.pointer for accurate coordinates
        const [x, y] = d3.pointer(event, this)
        
        // Get the current line position from DOM
        const mainLine = group.select(".main-line")
        
        if (isVertical) {
          const lineX = parseFloat(mainLine.attr("x1"))
          // Calculate offset from actual line position
          const offsetX = x - lineX
          const offsetY = y
          callbacks.onLabelDragEnd(offsetX, offsetY)
        } else {
          const lineY = parseFloat(mainLine.attr("y1"))
          // Calculate offset from actual line position
          const offsetX = x
          const offsetY = y - lineY
          callbacks.onLabelDragEnd(offsetX, offsetY)
        }
      })
  }, [])

  return {
    createVerticalLineDrag,
    createHorizontalLineDrag,
    createLabelDrag
  }
}