"use client"

import React, { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings } from "lucide-react"
import { LineStyle, ReferenceLine } from "@/types"
import { ReferenceLineConfig } from "@/types/reference-line"
import { REFERENCE_LINE_STYLES, REFERENCE_LINE_DEFAULTS } from "@/constants/referenceLine"

interface ReferenceLineStylePopoverProps {
  line: ReferenceLineConfig
  onUpdate: (updates: Partial<ReferenceLine>) => void
}

export const ReferenceLineStylePopover = React.memo(({ 
  line, 
  onUpdate 
}: ReferenceLineStylePopoverProps) => {
  
  // Get stroke dasharray for preview
  const getStrokeDasharray = (style: LineStyle) => {
    return REFERENCE_LINE_STYLES.STYLES[style] === "none" ? "" : REFERENCE_LINE_STYLES.STYLES[style]
  }

  // Handle style updates
  const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ color: e.target.value })
  }, [onUpdate])

  const handleStyleChange = useCallback((value: string) => {
    onUpdate({ style: value as LineStyle })
  }, [onUpdate])

  const handleStrokeWidthChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1
    onUpdate({ strokeWidth: Math.max(1, Math.min(10, value)) })
  }, [onUpdate])

  const handleFontSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 12
    onUpdate({ 
      labelStyle: {
        ...line.labelStyle,
        fontSize: Math.max(10, Math.min(20, value))
      }
    })
  }, [onUpdate, line.labelStyle])

  // Current values with defaults
  const currentStrokeWidth = line.strokeWidth ?? REFERENCE_LINE_DEFAULTS.STROKE_WIDTH
  const currentFontSize = line.labelStyle?.fontSize ?? REFERENCE_LINE_DEFAULTS.LABEL_STYLE.FONT_SIZE
  const currentColor = line.color ?? REFERENCE_LINE_STYLES.DEFAULT_COLOR
  const currentStyle = line.style ?? 'solid'

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 w-7 p-0">
          <Settings className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Line Style</h4>
          
          {/* Color */}
          <div>
            <Label className="text-xs">Color</Label>
            <Input
              type="color"
              value={currentColor}
              onChange={handleColorChange}
              className="h-7"
            />
          </div>
          
          {/* Style and Width */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Style</Label>
              <Select value={currentStyle} onValueChange={handleStyleChange}>
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Width</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={currentStrokeWidth}
                onChange={handleStrokeWidthChange}
                className="h-7 text-xs"
              />
            </div>
          </div>
          
          {/* Font Size */}
          <div>
            <Label className="text-xs">Label Size</Label>
            <Input
              type="number"
              min={10}
              max={20}
              value={currentFontSize}
              onChange={handleFontSizeChange}
              className="h-7 text-xs"
            />
          </div>
          
          {/* Preview */}
          <div className="border rounded p-3">
            <Label className="text-xs mb-2 block">Preview</Label>
            <svg width="100%" height="30" className="overflow-visible">
              <line
                x1="0"
                y1="15"
                x2="100%"
                y2="15"
                stroke={currentColor}
                strokeWidth={currentStrokeWidth}
                strokeDasharray={getStrokeDasharray(currentStyle)}
              />
              <text
                x="10"
                y="10"
                fill={currentColor}
                fontSize={currentFontSize}
                dominantBaseline="middle"
              >
                {line.label || "Reference"}
              </text>
            </svg>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
})

ReferenceLineStylePopover.displayName = "ReferenceLineStylePopover"