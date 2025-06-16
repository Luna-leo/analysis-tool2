"use client"

import React from "react"
import { PlotStyle } from "@/types/plot-style"
import { MarkerType } from "@/types"

interface PlotStyleBadgeProps {
  plotStyle: PlotStyle
}

export function PlotStyleBadge({ plotStyle }: PlotStyleBadgeProps) {
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

  return (
    <div className="flex items-center gap-1" style={{ width: '24px', height: '12px', position: 'relative' }}>
      <svg width="24" height="12" style={{ position: 'absolute', left: 0 }}>
        {/* Line */}
        <line
          x1="0"
          y1="6"
          x2="24"
          y2="6"
          stroke={line.color}
          strokeWidth={Math.min(line.width, 2)}
          strokeDasharray={getLinePattern()}
        />
        
        {/* Marker at center */}
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
        {marker.type === 'triangle' && (
          <polygon
            points={`12,${6 - displaySize} ${12 - displaySize},${6 + displaySize} ${12 + displaySize},${6 + displaySize}`}
            fill={marker.fillColor}
            stroke={marker.borderColor}
            strokeWidth="0.5"
          />
        )}
        {marker.type === 'diamond' && (
          <polygon
            points={`12,${6 - displaySize} ${12 + displaySize},6 12,${6 + displaySize} ${12 - displaySize},6`}
            fill={marker.fillColor}
            stroke={marker.borderColor}
            strokeWidth="0.5"
          />
        )}
        {marker.type === 'cross' && (
          <g>
            <line
              x1={12 - displaySize}
              y1="6"
              x2={12 + displaySize}
              y2="6"
              stroke={marker.borderColor}
              strokeWidth="1"
            />
            <line
              x1="12"
              y1={6 - displaySize}
              x2="12"
              y2={6 + displaySize}
              stroke={marker.borderColor}
              strokeWidth="1"
            />
          </g>
        )}
        {marker.type === 'plus' && (
          <g>
            <line
              x1={12 - displaySize}
              y1="6"
              x2={12 + displaySize}
              y2="6"
              stroke={marker.borderColor}
              strokeWidth="1.5"
            />
            <line
              x1="12"
              y1={6 - displaySize}
              x2="12"
              y2={6 + displaySize}
              stroke={marker.borderColor}
              strokeWidth="1.5"
            />
          </g>
        )}
      </svg>
    </div>
  )
}