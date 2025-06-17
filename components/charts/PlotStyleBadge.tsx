"use client"

import React from "react"
import * as d3 from "d3"
import { PlotStyle } from "@/types/plot-style"
import { MarkerType } from "@/types"

interface PlotStyleBadgeProps {
  plotStyle: PlotStyle
  showLines?: boolean
  showMarkers?: boolean
}

export function PlotStyleBadge({ plotStyle, showLines = true, showMarkers = true }: PlotStyleBadgeProps) {
  const { marker, line } = plotStyle
  
  // Create line style pattern
  const getLinePattern = () => {
    switch (line.style) {
      case 'dashed':
        return '3,2'
      case 'dotted':
        return '1,2'
      default:
        return 'none'
    }
  }

  // Cap marker size for badge display
  const displaySize = Math.min(marker.size, 5)

  // Get D3 symbol path
  const getSymbolPath = (type: MarkerType) => {
    let symbolType
    let symbolSize = displaySize * displaySize
    
    switch (type) {
      case 'circle':
        return null // Handle circle separately for better control
      case 'square':
        return null // Handle square separately for better control
      case 'triangle':
        symbolType = d3.symbolTriangle
        break
      case 'diamond':
        symbolType = d3.symbolDiamond
        symbolSize = symbolSize * 1.25 // Match MarkerRenderer scaling
        break
      case 'star':
        symbolType = d3.symbolStar
        break
      case 'cross':
        symbolType = d3.symbolCross
        break
      default:
        return null
    }
    
    return d3.symbol().type(symbolType).size(symbolSize)()
  }

  return (
    <div className="flex items-center gap-1" style={{ width: '24px', height: '12px', position: 'relative' }}>
      <svg width="24" height="12" style={{ position: 'absolute', left: 0 }}>
        {/* Line - only show if showLines is true */}
        {showLines && (
          <line
            x1="0"
            y1="6"
            x2="24"
            y2="6"
            stroke={line.color}
            strokeWidth={Math.min(line.width, 2)}
            strokeDasharray={getLinePattern()}
          />
        )}
        
        {/* Marker at center - only show if showMarkers is true */}
        {showMarkers && (
          <>
            {marker.type === 'circle' && (
              <circle
                cx="12"
                cy="6"
                r={displaySize}
                fill={marker.fillColor}
                stroke={marker.borderColor}
                strokeWidth="0.5"
              />
            )}
            {marker.type === 'square' && (
              <rect
                x={12 - displaySize}
                y={6 - displaySize}
                width={displaySize * 2}
                height={displaySize * 2}
                fill={marker.fillColor}
                stroke={marker.borderColor}
                strokeWidth="0.5"
              />
            )}
            {/* Use D3 symbols for other shapes to match MarkerRenderer */}
            {(marker.type === 'triangle' || marker.type === 'diamond' || marker.type === 'star' || marker.type === 'cross') && (
              <path
                d={getSymbolPath(marker.type) || ''}
                transform={`translate(12, 6)`}
                fill={marker.fillColor}
                stroke={marker.borderColor}
                strokeWidth="0.5"
              />
            )}
          </>
        )}
        
        {/* If both are false, show a simple colored rect */}
        {!showLines && !showMarkers && (
          <rect
            x="8"
            y="4"
            width="8"
            height="4"
            fill={marker.fillColor || line.color}
          />
        )}
      </svg>
    </div>
  )
}