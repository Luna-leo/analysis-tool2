"use client"

import React from "react"
import { DataSourceStyle } from "@/types"

interface DataSourceBadgePreviewProps {
  dataSourceStyle?: DataSourceStyle
  defaultColor: string
  plotStyle?: {
    marker: {
      type: string
      size: number
      borderColor: string
      fillColor: string
    }
    line: {
      width: number
      color: string
      style: string
    }
  }
  showStylePreview?: boolean
}

export function DataSourceBadgePreview({ dataSourceStyle, defaultColor, plotStyle, showStylePreview = true }: DataSourceBadgePreviewProps) {
  // If showStylePreview is false, just show a colored dot
  if (!showStylePreview) {
    const color = dataSourceStyle?.lineColor || defaultColor
    return (
      <div className="flex items-center" style={{ width: '12px', height: '12px' }}>
        <div 
          className="w-2 h-2 rounded-full" 
          style={{ backgroundColor: color }}
        />
      </div>
    )
  }

  // Use plotStyle if provided, otherwise fall back to dataSourceStyle
  const lineEnabled = plotStyle ? true : (dataSourceStyle?.lineEnabled || false)
  const lineColor = plotStyle?.line?.color || dataSourceStyle?.lineColor || defaultColor
  const lineStyle = plotStyle?.line?.style || dataSourceStyle?.lineStyle || 'solid'
  const lineWidth = plotStyle?.line?.width || dataSourceStyle?.lineWidth || 2
  const markerEnabled = plotStyle ? true : (dataSourceStyle?.markerEnabled !== undefined ? dataSourceStyle.markerEnabled : true)
  const markerShape = plotStyle?.marker?.type || dataSourceStyle?.markerShape || 'circle'
  const markerSize = Math.min(plotStyle?.marker?.size || dataSourceStyle?.markerSize || 4, 5) // Cap size for badge
  const markerColor = plotStyle?.marker?.fillColor || dataSourceStyle?.markerColor || lineColor

  // Create line style pattern
  const getLinePattern = () => {
    switch (lineStyle) {
      case 'dashed':
        return '3,2'
      case 'dotted':
        return '1,2'
      case 'dashdot':
        return '3,2,1,2'
      default:
        return 'none'
    }
  }

  return (
    <div className="flex items-center gap-1" style={{ width: '24px', height: '12px', position: 'relative' }}>
      <svg width="24" height="12" style={{ position: 'absolute', left: 0 }}>
        {/* Line if enabled */}
        {lineEnabled && (
          <line
            x1="0"
            y1="6"
            x2="24"
            y2="6"
            stroke={lineColor}
            strokeWidth={Math.min(lineWidth, 2)}
            strokeDasharray={getLinePattern()}
          />
        )}
        
        {/* Marker - position at center or end of line */}
        {markerEnabled && (
          <>
            {markerShape === 'circle' && (
              <circle
                cx={lineEnabled ? "12" : "12"}
                cy="6"
                r={markerSize}
                fill={markerColor}
                stroke={markerColor}
                strokeWidth="0.5"
              />
            )}
            {markerShape === 'square' && (
              <rect
                x={12 - markerSize}
                y={6 - markerSize}
                width={markerSize * 2}
                height={markerSize * 2}
                fill={markerColor}
                stroke={markerColor}
                strokeWidth="0.5"
              />
            )}
            {markerShape === 'triangle' && (
              <polygon
                points={`12,${6 - markerSize} ${12 - markerSize},${6 + markerSize} ${12 + markerSize},${6 + markerSize}`}
                fill={markerColor}
                stroke={markerColor}
                strokeWidth="0.5"
              />
            )}
            {markerShape === 'diamond' && (
              <polygon
                points={`12,${6 - markerSize} ${12 + markerSize},6 12,${6 + markerSize} ${12 - markerSize},6`}
                fill={markerColor}
                stroke={markerColor}
                strokeWidth="0.5"
              />
            )}
            {markerShape === 'cross' && (
              <g>
                <line
                  x1={12 - markerSize}
                  y1="6"
                  x2={12 + markerSize}
                  y2="6"
                  stroke={markerColor}
                  strokeWidth="1"
                />
                <line
                  x1="12"
                  y1={6 - markerSize}
                  x2="12"
                  y2={6 + markerSize}
                  stroke={markerColor}
                  strokeWidth="1"
                />
              </g>
            )}
            {markerShape === 'star' && (
              <polygon
                points={generateStarPoints(12, 6, markerSize, markerSize * 0.5)}
                fill={markerColor}
                stroke={markerColor}
                strokeWidth="0.5"
              />
            )}
          </>
        )}
        
        {/* Show dash if nothing is enabled */}
        {!markerEnabled && !lineEnabled && (
          <text x="12" y="9" textAnchor="middle" className="text-xs fill-muted-foreground">
            —
          </text>
        )}
      </svg>
    </div>
  )
}

// Helper function to generate star points
function generateStarPoints(cx: number, cy: number, outerRadius: number, innerRadius: number): string {
  const points: string[] = []
  const numSpikes = 5
  
  for (let i = 0; i < numSpikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius
    const angle = (i * Math.PI) / numSpikes - Math.PI / 2
    const x = cx + Math.cos(angle) * radius
    const y = cy + Math.sin(angle) * radius
    points.push(`${x},${y}`)
  }
  
  return points.join(' ')
}