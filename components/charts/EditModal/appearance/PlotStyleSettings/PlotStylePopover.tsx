"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { MarkerType, LineStyle } from "@/types"
import { MarkerSettings, LineSettings } from "@/types/plot-style"
import { getDefaultColor } from "@/utils/chartColors"

interface PlotStylePopoverProps {
  marker?: MarkerSettings
  line?: LineSettings
  colorIndex: number
  onUpdateMarker: (marker: MarkerSettings) => void
  onUpdateLine: (line: LineSettings) => void
}

export const PlotStylePopover = React.memo(({ 
  marker, 
  line, 
  colorIndex,
  onUpdateMarker, 
  onUpdateLine 
}: PlotStylePopoverProps) => {
  const defaultColor = getDefaultColor(colorIndex)
  
  const currentMarker = marker || {
    type: "circle" as MarkerType,
    size: 6,
    borderColor: defaultColor,
    fillColor: defaultColor
  }

  const currentLine = line || {
    style: "solid" as LineStyle,
    width: 2,
    color: defaultColor
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 px-2">
          <div className="flex items-center gap-1.5">
            {/* Marker and Line preview */}
            <svg width="20" height="12" className="flex-shrink-0">
              {/* Line */}
              <line
                x1="0"
                y1="6"
                x2="20"
                y2="6"
                stroke={currentLine.color}
                strokeWidth={Math.min(currentLine.width, 2)}
                strokeDasharray={currentLine.style === 'dashed' ? '3,2' : currentLine.style === 'dotted' ? '1,2' : 'none'}
              />
              
              {/* Marker at center */}
              {currentMarker.type === 'circle' && (
                <circle
                  cx="10"
                  cy="6"
                  r="4"
                  fill={currentMarker.fillColor}
                  stroke={currentMarker.borderColor}
                  strokeWidth="0.5"
                />
              )}
              {currentMarker.type === 'square' && (
                <rect
                  x="6"
                  y="2"
                  width="8"
                  height="8"
                  fill={currentMarker.fillColor}
                  stroke={currentMarker.borderColor}
                  strokeWidth="0.5"
                />
              )}
              {currentMarker.type === 'triangle' && (
                <polygon
                  points="10,2 14,10 6,10"
                  fill={currentMarker.fillColor}
                  stroke={currentMarker.borderColor}
                  strokeWidth="0.5"
                />
              )}
              {currentMarker.type === 'diamond' && (
                <polygon
                  points="10,2 14,6 10,10 6,6"
                  fill={currentMarker.fillColor}
                  stroke={currentMarker.borderColor}
                  strokeWidth="0.5"
                />
              )}
              {currentMarker.type === 'star' && (
                <polygon
                  points="10,2 11.8,5.5 15.5,5.5 12.3,7.8 13.9,11.5 10,9 6.1,11.5 7.7,7.8 4.5,5.5 8.2,5.5"
                  fill={currentMarker.fillColor}
                  stroke={currentMarker.borderColor}
                  strokeWidth="0.5"
                />
              )}
              {currentMarker.type === 'cross' && (
                <g>
                  <line
                    x1="6"
                    y1="6"
                    x2="14"
                    y2="6"
                    stroke={currentMarker.borderColor}
                    strokeWidth="1"
                  />
                  <line
                    x1="10"
                    y1="2"
                    x2="10"
                    y2="10"
                    stroke={currentMarker.borderColor}
                    strokeWidth="1"
                  />
                </g>
              )}
            </svg>
            <span className="text-xs">Style</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Plot Style Settings</h4>
          
          {/* Marker Section */}
          <div className="space-y-3">
            <h5 className="text-xs font-medium text-muted-foreground">MARKER</h5>
            
            <div>
              <Label className="text-xs">Type</Label>
              <select
                value={currentMarker.type}
                onChange={(e) => onUpdateMarker({
                  ...currentMarker,
                  type: e.target.value as MarkerType
                })}
                className="w-full h-7 px-2 py-1 border rounded-md text-xs"
              >
                <option value="circle">Circle</option>
                <option value="square">Square</option>
                <option value="triangle">Triangle</option>
                <option value="diamond">Diamond</option>
                <option value="star">Star</option>
                <option value="cross">Cross</option>
              </select>
            </div>
            
            <div>
              <Label className="text-xs">Size</Label>
              <Input
                type="number"
                min="1"
                max="20"
                value={currentMarker.size}
                onChange={(e) => onUpdateMarker({
                  ...currentMarker,
                  size: parseInt(e.target.value) || 6
                })}
                className="h-7 text-xs"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Border Color</Label>
                <Input
                  type="color"
                  value={currentMarker.borderColor}
                  onChange={(e) => onUpdateMarker({
                    ...currentMarker,
                    borderColor: e.target.value
                  })}
                  className="h-7 w-full"
                />
              </div>
              <div>
                <Label className="text-xs">Fill Color</Label>
                <Input
                  type="color"
                  value={currentMarker.fillColor}
                  onChange={(e) => onUpdateMarker({
                    ...currentMarker,
                    fillColor: e.target.value
                  })}
                  className="h-7 w-full"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Line Section */}
          <div className="space-y-3">
            <h5 className="text-xs font-medium text-muted-foreground">LINE</h5>
            
            <div>
              <Label className="text-xs">Style</Label>
              <select
                value={currentLine.style}
                onChange={(e) => onUpdateLine({
                  ...currentLine,
                  style: e.target.value as LineStyle
                })}
                className="w-full h-7 px-2 py-1 border rounded-md text-xs"
              >
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>
            </div>
            
            <div>
              <Label className="text-xs">Width</Label>
              <Input
                type="number"
                min="1"
                max="10"
                value={currentLine.width}
                onChange={(e) => onUpdateLine({
                  ...currentLine,
                  width: parseInt(e.target.value) || 2
                })}
                className="h-7 text-xs"
              />
            </div>
            
            <div>
              <Label className="text-xs">Color</Label>
              <Input
                type="color"
                value={currentLine.color}
                onChange={(e) => onUpdateLine({
                  ...currentLine,
                  color: e.target.value
                })}
                className="h-7 w-full"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
})

PlotStylePopover.displayName = "PlotStylePopover"