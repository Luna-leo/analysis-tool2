"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { LineStyle } from "@/types"
import { LineSettings } from "@/types/plot-style"

interface LineSettingsPopoverProps {
  line?: LineSettings
  onUpdate: (line: LineSettings) => void
}

export const LineSettingsPopover = React.memo(({ line, onUpdate }: LineSettingsPopoverProps) => {
  const currentLine = line || {
    style: "solid" as LineStyle,
    width: 2,
    color: "#0066cc"
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <div className="flex items-center gap-1">
            <div 
              className="w-4 h-0 border-b-2"
              style={{
                borderColor: currentLine.color,
                borderStyle: currentLine.style
              }}
            />
            <span>{currentLine.style}</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Line Settings</h4>
          
          <div>
            <Label className="text-xs">Style</Label>
            <select
              value={currentLine.style}
              onChange={(e) => onUpdate({
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
              onChange={(e) => onUpdate({
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
              onChange={(e) => onUpdate({
                ...currentLine,
                color: e.target.value
              })}
              className="h-7 w-full"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
})

LineSettingsPopover.displayName = "LineSettingsPopover"