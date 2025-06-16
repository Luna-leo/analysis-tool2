"use client"

import React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MarkerType } from "@/types"
import { MarkerSettings } from "@/types/plot-style"

interface MarkerSettingsPopoverProps {
  marker?: MarkerSettings
  onUpdate: (marker: MarkerSettings) => void
}

export const MarkerSettingsPopover = React.memo(({ marker, onUpdate }: MarkerSettingsPopoverProps) => {
  const currentMarker = marker || {
    type: "circle" as MarkerType,
    size: 6,
    borderColor: "#0066cc",
    fillColor: "#0066cc"
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <div className="flex items-center gap-1">
            <div 
              className="w-3 h-3 border rounded-full" 
              style={{
                backgroundColor: currentMarker.fillColor,
                borderColor: currentMarker.borderColor
              }}
            />
            <span>{currentMarker.type}</span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Marker Settings</h4>
          
          <div>
            <Label className="text-xs">Type</Label>
            <select
              value={currentMarker.type}
              onChange={(e) => onUpdate({
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
              onChange={(e) => onUpdate({
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
                onChange={(e) => onUpdate({
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
                onChange={(e) => onUpdate({
                  ...currentMarker,
                  fillColor: e.target.value
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

MarkerSettingsPopover.displayName = "MarkerSettingsPopover"