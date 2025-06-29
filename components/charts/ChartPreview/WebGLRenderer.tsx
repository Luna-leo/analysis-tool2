import React, { useRef, useEffect, useMemo } from 'react'
import { Deck } from '@deck.gl/core'
import { ScatterplotLayer } from '@deck.gl/layers'
import { ChartComponent } from '@/types'
import { getXValueForScale } from '@/utils/chartAxisUtils'
import { webglMemoryManager, estimateDataMemory, canHandleDataSize } from '@/utils/webglMemoryManager'

interface WebGLRendererProps {
  containerRef: React.RefObject<HTMLDivElement>
  data: Array<{
    x: number | string | Date
    y: number
    series: string
    seriesIndex: number
    dataSourceId?: string
    dataSourceIndex?: number
    paramIndex?: number
  }>
  width: number
  height: number
  margin: { top: number; right: number; bottom: number; left: number }
  xScale: d3.ScaleTime<number, number> | d3.ScaleLinear<number, number>
  yScale: d3.ScaleLinear<number, number>
  editingChart: ChartComponent
  colorScale: (series: string) => string
  plotStyles?: ChartComponent['plotStyles']
  onHover?: (info: any) => void
  onClick?: (info: any) => void
}

// Convert hex color to RGB array for deck.gl
function hexToRgba(hex: string, alpha: number = 255): [number, number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result 
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
        alpha
      ]
    : [0, 0, 255, alpha]
}

export const WebGLRenderer: React.FC<WebGLRendererProps> = ({
  containerRef,
  data,
  width,
  height,
  margin,
  xScale,
  yScale,
  editingChart,
  colorScale,
  plotStyles,
  onHover,
  onClick
}) => {
  const deckRef = useRef<any | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Transform data for deck.gl
  const transformedData = useMemo(() => {
    return data.map(d => {
      const scaledX = getXValueForScale(d.x, editingChart.xAxisType || 'parameter')
      const pixelX = xScale(scaledX) + margin.left
      const pixelY = yScale(d.y) + margin.top
      
      // Get color from plot styles or default color scale
      let color: [number, number, number, number] = [59, 130, 246, 200] // Default blue
      
      if (plotStyles) {
        const mode = plotStyles.mode || 'datasource'
        let style: any
        
        if (mode === 'datasource' && d.dataSourceId) {
          style = plotStyles.byDataSource?.[d.dataSourceId]
        } else if (mode === 'parameter' && d.paramIndex !== undefined) {
          style = plotStyles.byParameter?.[d.paramIndex]
        } else if (mode === 'both' && d.dataSourceId && d.paramIndex !== undefined) {
          const key = `${d.dataSourceId}-${d.paramIndex}`
          style = plotStyles.byBoth?.[key]
        }
        
        if (style?.marker?.fillColor) {
          color = hexToRgba(style.marker.fillColor, 200)
        } else if (style?.line?.color) {
          color = hexToRgba(style.line.color, 200)
        }
      } else {
        // Use default color scale
        const hexColor = colorScale(d.series)
        color = hexToRgba(hexColor, 200)
      }
      
      return {
        position: [pixelX, pixelY],
        color,
        radius: 3,
        // Store original data for interactions
        originalData: d
      }
    })
  }, [data, xScale, yScale, margin, editingChart.xAxisType, plotStyles, colorScale])

  // Initialize deck.gl
  useEffect(() => {
    if (!containerRef.current) return

    // Check if we can handle the data size
    if (!canHandleDataSize(data.length)) {
      console.warn('Data too large for WebGL memory:', data.length)
      return
    }

    // Create canvas element
    const canvas = document.createElement('canvas')
    canvas.style.position = 'absolute'
    canvas.style.left = '0'
    canvas.style.top = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.pointerEvents = 'auto'
    containerRef.current.appendChild(canvas)
    canvasRef.current = canvas

    // Initialize deck.gl instance
    const deckInstance = new Deck({
      canvas,
      width,
      height,
      controller: false, // We handle interactions separately
      layers: [],
      onHover: (info: any) => {
        if (onHover) {
          onHover(info)
        }
      },
      onClick: (info: any) => {
        if (onClick) {
          onClick(info)
        }
      }
    } as any)
    
    deckRef.current = deckInstance
    
    // Register with memory manager
    const memoryId = `deck-${editingChart.id}-${Date.now()}`
    webglMemoryManager.register(
      memoryId,
      'deck-instance',
      deckInstance,
      estimateDataMemory(data.length)
    )

    return () => {
      if (deckRef.current) {
        webglMemoryManager.unregister(memoryId)
        deckRef.current.finalize()
        deckRef.current = null
      }
      if (canvasRef.current && containerRef.current) {
        containerRef.current.removeChild(canvasRef.current)
        canvasRef.current = null
      }
    }
  }, [containerRef, width, height, onHover, onClick, data.length, editingChart.id])

  // Update layers when data changes
  useEffect(() => {
    if (!deckRef.current) return

    const layers = [
      new ScatterplotLayer({
        id: 'scatterplot',
        data: transformedData,
        getPosition: (d: any) => d.position,
        getRadius: (d: any) => d.radius,
        getFillColor: (d: any) => d.color,
        getLineColor: (d: any) => d.color,
        stroked: true,
        lineWidthMinPixels: 1,
        radiusMinPixels: 1,
        radiusMaxPixels: 10,
        pickable: true,
        autoHighlight: true,
        highlightColor: [255, 255, 255, 100],
        // Performance optimizations
        parameters: {
          depthTest: false,
          depthMask: false,
          blend: true,
          blendFunc: [770, 771], // GL.SRC_ALPHA, GL.ONE_MINUS_SRC_ALPHA
          blendEquation: 32774 // GL.FUNC_ADD
        },
        // GPU memory optimization
        updateTriggers: {
          getPosition: transformedData.length,
          getFillColor: transformedData.length
        },
        transitions: {
          getPosition: 300,
          getRadius: 300,
          getFillColor: 300
        }
      })
    ]

    deckRef.current.setProps({
      layers,
      width,
      height
    })
  }, [transformedData, width, height])

  return null // Canvas is added directly to container
}

/**
 * Check if WebGL is supported
 */
export function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    return !!gl
  } catch (e) {
    return false
  }
}

/**
 * Get render method including WebGL option
 */
export function getRenderMethodWithWebGL(
  dataPointCount: number,
  viewportSize: { width: number; height: number }
): 'svg' | 'canvas' | 'webgl' {
  // Use WebGL for very large datasets
  if (dataPointCount > 10000 && isWebGLSupported()) {
    return 'webgl'
  }
  
  const pixelCount = viewportSize.width * viewportSize.height
  const pointDensity = dataPointCount / pixelCount
  
  // Use canvas for medium datasets
  if (pointDensity > 0.01 || dataPointCount > 100) {
    return 'canvas'
  }
  
  // Use SVG for small datasets
  return 'svg'
}