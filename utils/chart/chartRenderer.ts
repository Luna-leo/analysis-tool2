import * as d3 from 'd3'
import { ChartComponent, EventInfo } from '@/types'
import { renderScatterPlot } from '@/components/charts/ChartPreview/ScatterPlot'
import { hideAllTooltips } from '@/utils/chartTooltip'

interface ScaleRefs {
  xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number> | null
  yScale: d3.ScaleLinear<number, number> | null
}

interface RenderChartOptions {
  svg: SVGSVGElement
  data: any[]
  dimensions: { width: number; height: number }
  margin: { top: number; right: number; bottom: number; left: number }
  chart: ChartComponent
  scalesToUse: React.MutableRefObject<ScaleRefs>
  dataSourceStyles?: { [dataSourceId: string]: any }
  enableSampling?: boolean
  qualityRenderOptions?: {
    samplingRate: number
    enableMarkers: boolean
  }
  selectionState?: {
    isSelecting: boolean
    startX: number
    startY: number
    endX: number
    endY: number
  }
  isShiftPressed?: boolean
  isRangeSelectionMode?: boolean
  labelPositions?: any
  canvas?: HTMLCanvasElement
  editingChartId: string
}

export const renderChart = ({
  svg,
  data,
  dimensions,
  margin,
  chart,
  scalesToUse,
  dataSourceStyles = {},
  enableSampling = true,
  qualityRenderOptions = { samplingRate: 1, enableMarkers: true },
  selectionState,
  isShiftPressed = false,
  isRangeSelectionMode = false,
  labelPositions,
  canvas,
  editingChartId
}: RenderChartOptions) => {
  const svgSelection = d3.select(svg)
  
  // Clear everything except reference lines layer and defs
  const svgNode = svg
  if (svgNode) {
    const children = Array.from(svgNode.children)
    children.forEach(child => {
      const elem = d3.select(child)
      const tagName = child.tagName?.toLowerCase()
      
      // Keep defs (for clipPaths) and reference-lines-layer
      if (tagName === 'defs' || elem.classed('reference-lines-layer')) {
        return // Keep these elements
      }
      
      // Remove everything else
      child.remove()
    })
  }
  
  const width = dimensions.width - margin.left - margin.right
  const height = dimensions.height - margin.top - margin.bottom
  
  // Set viewBox to ensure content stays within bounds
  svgSelection
    .attr("viewBox", `0 0 ${dimensions.width} ${dimensions.height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
  
  // Main group with margin transform
  const mainGroup = svgSelection.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)
  
  if (data && data.length > 0) {
    // Debug log scales information
    if (process.env.NODE_ENV === 'development' && scalesToUse.current.xScale) {
      const domain = scalesToUse.current.xScale.domain()
      console.log('[chartRenderer] Rendering with scales:', {
        chartId: editingChartId,
        baseScaleDomain: domain,
        baseScaleDomainStart: domain[0] instanceof Date ? domain[0].toISOString() : domain[0],
        baseScaleDomainEnd: domain[1] instanceof Date ? domain[1].toISOString() : domain[1],
      })
    }
    
    // Apply quality optimization if enabled
    const dataToRender = qualityRenderOptions.samplingRate < 1
      ? data.filter((_, i) => i % Math.round(1 / qualityRenderOptions.samplingRate) === 0)
      : data
    
    // Override chart display options based on quality level
    const optimizedChart = {
      ...chart,
      margins: margin, // Use calculated pixel values instead of percentage strings
      showMarkers: qualityRenderOptions.enableMarkers && chart.showMarkers,
    }
    
    // Render chart with current scales
    renderScatterPlot({ 
      g: mainGroup, 
      data: dataToRender, 
      width, 
      height, 
      editingChart: optimizedChart, 
      scalesRef: scalesToUse, 
      dataSourceStyles: dataSourceStyles, 
      canvas: canvas,
      plotStyles: chart.plotStyles,
      enableSampling: enableSampling,
      disableTooltips: selectionState?.isSelecting || isShiftPressed,
      labelPositions: labelPositions
    })
    
    // Add selection overlay if selecting or shift is pressed or in range selection mode
    if (selectionState?.isSelecting || isShiftPressed || isRangeSelectionMode) {
      // Create an invisible overlay that captures all mouse events during selection
      svgSelection.append("rect")
        .attr("class", "selection-overlay")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", dimensions.width)
        .attr("height", dimensions.height)
        .attr("fill", "transparent")
        .style("cursor", "crosshair")
        .style("pointer-events", "all")
      
      // Draw selection rectangle within the plot area (only if actively selecting)
      if (selectionState?.isSelecting) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`[chartRenderer ${editingChartId}] Drawing selection rect:`, {
            selectionState,
            plotDimensions: { width, height },
            margin
          })
        }
        
        // Create a unique clip path for selection
        const selectionClipId = `selection-clip-${Math.random().toString(36).substr(2, 9)}`
        mainGroup.append("clipPath")
          .attr("id", selectionClipId)
          .append("rect")
          .attr("x", 0)
          .attr("y", 0)
          .attr("width", width)
          .attr("height", height)
        
        const selectionGroup = mainGroup.append("g")
          .attr("class", "selection-rect")
          .attr("clip-path", `url(#${selectionClipId})`)
        
        const rectX = Math.min(selectionState.startX, selectionState.endX) - margin.left
        const rectY = Math.min(selectionState.startY, selectionState.endY) - margin.top
        const rectWidth = Math.abs(selectionState.endX - selectionState.startX)
        const rectHeight = Math.abs(selectionState.endY - selectionState.startY)
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`[chartRenderer ${editingChartId}] Selection rect attributes:`, {
            x: rectX,
            y: rectY,
            width: rectWidth,
            height: rectHeight
          })
        }
        
        selectionGroup.append("rect")
          .attr("x", rectX)
          .attr("y", rectY)
          .attr("width", rectWidth)
          .attr("height", rectHeight)
          .attr("fill", "rgba(59, 130, 246, 0.1)")
          .attr("stroke", "rgb(59, 130, 246)")
          .attr("stroke-width", "2")
          .attr("stroke-dasharray", "4,2")
          .style("pointer-events", "none")
      }
    }
  }
  
  return {
    cleanup: () => {
      hideAllTooltips()
    }
  }
}