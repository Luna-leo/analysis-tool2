import React from 'react'
import ReactDOM from 'react-dom/client'
import { ScatterPlotRenderer } from './ScatterPlot'
import { WebGLRenderer, getRenderMethodWithWebGL, isWebGLSupported } from './WebGLRenderer'
import { performanceTracker } from '@/utils/performanceTracking'

interface RenderScatterPlotProps {
  g: d3.Selection<SVGGElement, unknown, null, undefined>
  data: any[]
  width: number
  height: number
  editingChart: any
  scalesRef: any
  dataSourceStyles?: any
  canvas?: HTMLCanvasElement
  plotStyles?: any
  enableSampling?: boolean
  disableTooltips?: boolean
  labelPositions?: any
}

let webglRoot: ReactDOM.Root | null = null
let webglContainer: HTMLDivElement | null = null

export function renderScatterPlot(props: RenderScatterPlotProps) {
  const {
    g,
    data,
    width,
    height,
    editingChart,
    scalesRef,
    dataSourceStyles,
    canvas,
    plotStyles,
    enableSampling,
    disableTooltips,
    labelPositions
  } = props

  // Clean up previous WebGL instance if exists
  if (webglRoot) {
    webglRoot.unmount()
    webglRoot = null
  }
  if (webglContainer && g.node()?.parentNode) {
    const svgNode = g.node()?.ownerSVGElement
    if (svgNode?.parentNode?.contains(webglContainer)) {
      svgNode.parentNode.removeChild(webglContainer)
    }
    webglContainer = null
  }

  // Determine render method
  const viewportSize = { width, height }
  const renderMethod = getRenderMethodWithWebGL(data.length, viewportSize)

  performanceTracker.mark('render-method-selected')

  if (renderMethod === 'webgl' && isWebGLSupported()) {
    // Create WebGL renderer
    const svgNode = g.node()?.ownerSVGElement
    const containerNode = svgNode?.parentNode as HTMLElement

    if (containerNode) {
      // Create container for WebGL
      webglContainer = document.createElement('div')
      webglContainer.style.position = 'absolute'
      webglContainer.style.left = '0'
      webglContainer.style.top = '0'
      webglContainer.style.width = '100%'
      webglContainer.style.height = '100%'
      webglContainer.style.pointerEvents = 'none'
      containerNode.appendChild(webglContainer)

      // Hide SVG elements during WebGL rendering
      g.style('visibility', 'hidden')

      // Get color scale from base implementation
      const colorScale = (series: string) => {
        const seriesIndex = data.findIndex(d => d.series === series)
        const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']
        return colors[seriesIndex % colors.length]
      }

      // Create React root and render WebGL component
      webglRoot = ReactDOM.createRoot(webglContainer)
      webglRoot.render(
        <WebGLRenderer
          containerRef={{ current: webglContainer } as React.RefObject<HTMLDivElement>}
          data={data}
          width={width + editingChart.margins.left + editingChart.margins.right}
          height={height + editingChart.margins.top + editingChart.margins.bottom}
          margin={editingChart.margins}
          xScale={scalesRef.current.xScale}
          yScale={scalesRef.current.yScale}
          editingChart={editingChart}
          colorScale={colorScale}
          plotStyles={plotStyles}
          onHover={!disableTooltips ? (info: any) => {
            // Handle hover for tooltips
            if (info.object) {
              const d = info.object.originalData
              // Implement tooltip display
              console.log('Hover:', d)
            }
          } : undefined}
        />
      )

      // Still need to render axes and grid using SVG
      g.style('visibility', 'visible')
      // Clear data elements but keep axes
      g.selectAll('.data-element').remove()
    }
  } else {
    // Use existing ScatterPlot implementation for Canvas/SVG
    const scatterPlot = new ScatterPlotRenderer({
      g,
      data,
      width,
      height,
      editingChart,
      scalesRef,
      dataSourceStyles,
      canvas,
      plotStyles,
      enableSampling,
      disableTooltips
    })

    scatterPlot.render()
  }
}

// Export cleanup function
export function cleanupWebGLRenderer() {
  if (webglRoot) {
    webglRoot.unmount()
    webglRoot = null
  }
  if (webglContainer && webglContainer.parentNode) {
    webglContainer.parentNode.removeChild(webglContainer)
    webglContainer = null
  }
}