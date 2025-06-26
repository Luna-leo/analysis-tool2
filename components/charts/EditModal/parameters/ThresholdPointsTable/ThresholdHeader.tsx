"use client"

import React from "react"
import { Label } from "@/components/ui/label"

interface ThresholdHeaderProps {
  lineType?: string
  onLineTypeChange?: (lineType: string) => void
}

export function ThresholdHeader({ lineType, onLineTypeChange }: ThresholdHeaderProps) {
  return (
    <div className="shrink-0 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-900">Threshold Points</h4>
        
        {lineType !== undefined && onLineTypeChange && (
          <div className="flex items-center gap-2">
            <Label htmlFor="line-type" className="text-sm font-medium text-gray-700">
              Line Type:
            </Label>
            <select
              id="line-type"
              value={lineType}
              onChange={(e) => onLineTypeChange(e.target.value)}
              className="h-8 w-36 text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
            >
              <option value="linear">Linear</option>
              <option value="step">Step</option>
              <option value="stepBefore">Step Before</option>
              <option value="stepAfter">Step After</option>
            </select>
          </div>
        )}
      </div>
    </div>
  )
}