import { useState, useRef, useCallback, useLayoutEffect, useEffect, RefObject } from 'react'
import * as d3 from 'd3'
import { ChartComponent } from '@/types'

interface Position {
  x: number
  y: number
}

interface Ratio {
  xRatio: number
  yRatio: number
}

interface UseChartLabelDragProps {
  chart: ChartComponent
  setEditingChart?: (chart: ChartComponent) => void
  containerRef: RefObject<HTMLDivElement>
  svgRef: RefObject<SVGSVGElement>
  dimensions: { width: number; height: number }
}

export const useChartLabelDrag = ({
  chart,
  setEditingChart,
  containerRef,
  svgRef,
  dimensions
}: UseChartLabelDragProps) => {
  // States for draggable labels
  const [titlePos, setTitlePos] = useState<Position | null>(null)
  const [xLabelPos, setXLabelPos] = useState<Position | null>(null)
  const [yLabelPos, setYLabelPos] = useState<Position | null>(null)
  
  // Refs for storing position ratios
  const titleRatioRef = useRef<Ratio | null>(chart.titlePosition ?? null)
  const xLabelRatioRef = useRef<Ratio | null>(chart.xLabelPosition ?? null)
  const yLabelRatioRef = useRef<Ratio | null>(chart.yLabelPosition ?? null)
  
  // Update ratio refs when chart positions change
  useEffect(() => {
    titleRatioRef.current = chart.titlePosition ?? null
    xLabelRatioRef.current = chart.xLabelPosition ?? null
    yLabelRatioRef.current = chart.yLabelPosition ?? null
  }, [chart.titlePosition, chart.xLabelPosition, chart.yLabelPosition])
  
  // Add drag handlers for chart labels
  const addLabelDragHandlers = useCallback(() => {
    if (!svgRef.current || !containerRef.current) return
    
    const svg = d3.select(svgRef.current)
    const containerRect = containerRef.current.getBoundingClientRect()
    
    // Helper function to setup drag behavior for a label
    const setupLabelDrag = (
      selector: string,
      posRef: React.MutableRefObject<Ratio | null>,
      setPos: React.Dispatch<React.SetStateAction<Position | null>>,
      updateKey: 'titlePosition' | 'xLabelPosition' | 'yLabelPosition',
      isRotated: boolean = false
    ) => {
      const label = svg.select(selector)
      if (label.empty()) return
      
      label.on('pointerdown', function(event: PointerEvent) {
        event.preventDefault()
        event.stopPropagation()
        
        const element = this as SVGTextElement
        const currentX = +(element.getAttribute('x') || 0) || 0
        const currentY = +(element.getAttribute('y') || 0) || 0
        
        // Get the group transform to calculate absolute position
        const mainGroup = svg.select('g')
        const groupTransform = mainGroup.attr('transform')
        const translateMatch = groupTransform?.match(/translate\(([^,]+),([^)]+)\)/)
        const groupX = translateMatch ? +translateMatch[1] : 0
        const groupY = translateMatch ? +translateMatch[2] : 0
        
        let startX: number, startY: number
        if (isRotated) {
          // For rotated Y-label (-90 degrees), the element's x,y are in rotated space
          // After -90 rotation: element at (x,y) appears at screen position (y, -x)
          startX = groupX + currentY  // Screen X = rotated Y
          startY = groupY - currentX  // Screen Y = -rotated X
        } else {
          startX = groupX + currentX
          startY = groupY + currentY
        }
        
        const initialMouseX = event.clientX
        const initialMouseY = event.clientY
        
        const handleMove = (ev: PointerEvent) => {
          const deltaX = ev.clientX - initialMouseX
          const deltaY = ev.clientY - initialMouseY
          
          let newX: number, newY: number
          if (isRotated) {
            // For rotated label, calculate new screen position
            newX = startX + deltaX
            newY = startY + deltaY
            
            // Convert screen position to rotated coordinate system
            // For -90 rotation: to move right on screen (deltaX), increase Y in rotated space
            // For -90 rotation: to move down on screen (deltaY), decrease X in rotated space
            const rotatedX = currentX - deltaY  // Screen Y movement -> rotated -X
            const rotatedY = currentY + deltaX  // Screen X movement -> rotated Y
            
            element.setAttribute('x', String(rotatedX))
            element.setAttribute('y', String(rotatedY))
          } else {
            newX = startX + deltaX
            newY = startY + deltaY
            
            // Update element position
            element.setAttribute('x', String(newX - groupX))
            element.setAttribute('y', String(newY - groupY))
          }
          
          // Calculate and store ratio
          const ratio = {
            xRatio: containerRect.width ? newX / containerRect.width : 0.5,
            yRatio: containerRect.height ? newY / containerRect.height : 0.5
          }
          
          posRef.current = ratio
          setPos({ x: newX, y: newY })
        }
        
        const handleUp = () => {
          document.removeEventListener('pointermove', handleMove)
          document.removeEventListener('pointerup', handleUp)
          
          if (posRef.current && setEditingChart) {
            setEditingChart({ ...chart, [updateKey]: posRef.current })
          }
        }
        
        document.addEventListener('pointermove', handleMove)
        document.addEventListener('pointerup', handleUp)
      })
    }
    
    // Setup drag for each label
    setupLabelDrag('.chart-title', titleRatioRef, setTitlePos, 'titlePosition')
    setupLabelDrag('.x-axis-label', xLabelRatioRef, setXLabelPos, 'xLabelPosition')
    setupLabelDrag('.y-axis-label', yLabelRatioRef, setYLabelPos, 'yLabelPosition', true)
  }, [chart, setEditingChart, containerRef, svgRef])
  
  // Calculate label positions from ratios
  const calculateLabelPositions = useCallback((margin: { top: number; right: number; bottom: number; left: number }) => {
    const labelPositions: any = {}
    
    if (titleRatioRef.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      labelPositions.title = {
        x: titleRatioRef.current.xRatio * containerRect.width - margin.left,
        y: titleRatioRef.current.yRatio * containerRect.height - margin.top
      }
    }
    
    if (xLabelRatioRef.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      labelPositions.xLabel = {
        x: xLabelRatioRef.current.xRatio * containerRect.width - margin.left,
        y: xLabelRatioRef.current.yRatio * containerRect.height - margin.top
      }
    }
    
    if (yLabelRatioRef.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      labelPositions.yLabel = {
        x: yLabelRatioRef.current.xRatio * containerRect.width - margin.left,
        y: yLabelRatioRef.current.yRatio * containerRect.height - margin.top
      }
    }
    
    return Object.keys(labelPositions).length > 0 ? labelPositions : undefined
  }, [containerRef])
  
  return {
    titlePos,
    xLabelPos,
    yLabelPos,
    titleRatioRef,
    xLabelRatioRef,
    yLabelRatioRef,
    addLabelDragHandlers,
    calculateLabelPositions,
    setTitlePos,
    setXLabelPos,
    setYLabelPos
  }
}