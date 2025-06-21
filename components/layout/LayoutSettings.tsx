"use client"

import React from "react"
import { LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useLayoutStore } from "@/stores/useLayoutStore"
import { getDefaultChartSettings } from "@/utils/chart/marginCalculator"

interface LayoutSettingsProps {
  fileId: string
  size?: "default" | "sm"
}

export function LayoutSettings({ fileId, size = "sm" }: LayoutSettingsProps) {
  const { layoutSettingsMap, chartSettingsMap, updateLayoutSettings, updateChartSettings } = useLayoutStore()
  
  const defaultLayoutSettings = {
    showFileName: true,
    showDataSources: true,
    columns: 2,
    rows: 2,
    pagination: true,
  }
  
  const defaultChartSettings = {
    showXAxis: true,
    showYAxis: true,
    showGrid: true,
    showLegend: true,
    showChartTitle: true,
    margins: {
      top: 20,
      right: 40,
      bottom: 50,
      left: 55
    },
    xLabelOffset: 35,
    yLabelOffset: 35
  }
  
  const currentLayoutSettings = {
    ...defaultLayoutSettings,
    ...(layoutSettingsMap[fileId] || {})
  }
  
  const currentChartSettings = {
    ...defaultChartSettings,
    ...(chartSettingsMap[fileId] || {})
  }
  
  // Check if current layout matches a preset
  const isPresetActive = (presetColumns: number, presetRows: number) => {
    return currentLayoutSettings.columns === presetColumns && 
           currentLayoutSettings.rows === presetRows
  }
  
  // Margin presets
  const marginPresets = {
    compact: { top: 10, right: 20, bottom: 30, left: 40 },
    normal: { top: 20, right: 40, bottom: 50, left: 55 },
    spacious: { top: 30, right: 50, bottom: 60, left: 70 }
  }
  
  // Check if current margins match a preset
  const isMarginPresetActive = (presetName: keyof typeof marginPresets) => {
    const preset = marginPresets[presetName]
    const current = currentChartSettings.margins
    return current &&
      current.top === preset.top &&
      current.right === preset.right &&
      current.bottom === preset.bottom &&
      current.left === preset.left
  }
  
  // Apply margin preset
  const applyMarginPreset = (presetName: keyof typeof marginPresets) => {
    const preset = marginPresets[presetName]
    updateChartSettings(fileId, {
      margins: preset
    })
  }
  
  // Handle grid preset click and apply layout-specific margins
  const handleGridPreset = (columns: number, rows: number) => {
    updateLayoutSettings(fileId, { columns, rows })
    
    // Get default chart settings for the new layout
    const newChartSettings = getDefaultChartSettings(columns, rows)
    
    // Update chart settings with the new layout-specific values
    updateChartSettings(fileId, {
      margins: newChartSettings.margins,
      xLabelOffset: newChartSettings.xLabelOffset,
      yLabelOffset: newChartSettings.yLabelOffset,
      marginMode: newChartSettings.marginMode
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size={size} 
          className={cn(
            "flex items-center justify-center gap-1.5",
            size === "sm" ? "h-8 px-3 text-xs" : "h-9 w-24"
          )}
        >
          <LayoutGrid className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
          <span className={size === "sm" ? "" : "text-sm font-medium"}>Layout</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs">Layout Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Quick Grid Presets - At the top in a single row */}
        <div className="px-3 py-2">
          <span className="text-xs font-medium">Quick Grid Presets</span>
          <div className="flex gap-1.5 mt-2">
            <Button
              variant={isPresetActive(1, 1) ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-7 text-xs flex-1",
                isPresetActive(1, 1) && "ring-2 ring-primary ring-offset-1"
              )}
              onClick={() => handleGridPreset(1, 1)}
            >
              1×1
            </Button>
            <Button
              variant={isPresetActive(2, 2) ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-7 text-xs flex-1",
                isPresetActive(2, 2) && "ring-2 ring-primary ring-offset-1"
              )}
              onClick={() => handleGridPreset(2, 2)}
            >
              2×2
            </Button>
            <Button
              variant={isPresetActive(3, 3) ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-7 text-xs flex-1",
                isPresetActive(3, 3) && "ring-2 ring-primary ring-offset-1"
              )}
              onClick={() => handleGridPreset(3, 3)}
            >
              3×3
            </Button>
            <Button
              variant={isPresetActive(4, 4) ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-7 text-xs flex-1",
                isPresetActive(4, 4) && "ring-2 ring-primary ring-offset-1"
              )}
              onClick={() => handleGridPreset(4, 4)}
            >
              4×4
            </Button>
          </div>
        </div>

        <DropdownMenuSeparator />
        
        {/* Grid Layout */}
        <div className="px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium">Grid</span>
            <div className="flex gap-2">
              <select
                id="columns"
                className="h-7 w-14 px-1.5 text-xs border rounded"
                value={currentLayoutSettings.columns || 2}
                onChange={(e) => {
                  const columns = parseInt(e.target.value)
                  updateLayoutSettings(fileId, { columns })
                  handleGridPreset(columns, currentLayoutSettings.rows)
                }}
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}×
                  </option>
                ))}
              </select>
              <select
                id="rows"
                className="h-7 w-14 px-1.5 text-xs border rounded"
                value={currentLayoutSettings.rows || 2}
                onChange={(e) => {
                  const rows = parseInt(e.target.value)
                  updateLayoutSettings(fileId, { rows })
                  handleGridPreset(currentLayoutSettings.columns, rows)
                }}
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    ×{n}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Pagination */}
          <div className="flex items-center justify-between mt-2">
            <label htmlFor="pagination" className="text-xs">
              Pagination
            </label>
            <input
              type="checkbox"
              id="pagination"
              checked={currentLayoutSettings.pagination ?? true}
              onChange={(e) => {
                updateLayoutSettings(fileId, {
                  pagination: e.target.checked,
                })
              }}
              className="rounded h-3.5 w-3.5"
            />
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Display Options */}
        <div className="px-3 py-2 space-y-1.5">
          <span className="text-xs font-medium">Display</span>
          <div className="flex items-center justify-between">
            <label htmlFor="showLegend" className="text-xs">
              Legend
            </label>
            <input
              type="checkbox"
              id="showLegend"
              checked={currentChartSettings.showLegend ?? true}
              onChange={(e) => {
                updateChartSettings(fileId, {
                  showLegend: e.target.checked,
                })
              }}
              className="rounded h-3.5 w-3.5"
            />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="showChartTitle" className="text-xs">
              Chart title
            </label>
            <input
              type="checkbox"
              id="showChartTitle"
              checked={currentChartSettings.showChartTitle ?? true}
              onChange={(e) => {
                updateChartSettings(fileId, {
                  showChartTitle: e.target.checked,
                })
              }}
              className="rounded h-3.5 w-3.5"
            />
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Chart Margins */}
        <div className="px-3 py-2 space-y-2">
          <div>
            <span className="text-xs font-medium">Grid-wide Chart Margins (px)</span>
            <p className="text-xs text-muted-foreground mt-0.5">
              Apply to all charts in this grid
            </p>
          </div>
          
          {/* Margin Presets */}
          <div className="flex gap-1">
            <Button
              variant={isMarginPresetActive('compact') ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "h-6 text-xs flex-1",
                isMarginPresetActive('compact') && "ring-1 ring-primary ring-offset-1"
              )}
              onClick={() => applyMarginPreset('compact')}
            >
              Compact
            </Button>
            <Button
              variant={isMarginPresetActive('normal') ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "h-6 text-xs flex-1",
                isMarginPresetActive('normal') && "ring-1 ring-primary ring-offset-1"
              )}
              onClick={() => applyMarginPreset('normal')}
            >
              Normal
            </Button>
            <Button
              variant={isMarginPresetActive('spacious') ? 'default' : 'outline'}
              size="sm"
              className={cn(
                "h-6 text-xs flex-1",
                isMarginPresetActive('spacious') && "ring-1 ring-primary ring-offset-1"
              )}
              onClick={() => applyMarginPreset('spacious')}
            >
              Spacious
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="marginTop" className="text-xs">Top</label>
              <input
                id="marginTop"
                type="number"
                className="w-14 h-7 px-1.5 text-xs border rounded text-center"
                value={currentChartSettings.margins?.top || 20}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  updateChartSettings(fileId, {
                    margins: {
                      ...currentChartSettings.margins,
                      top: value
                    }
                  })
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="marginRight" className="text-xs">Right</label>
              <input
                id="marginRight"
                type="number"
                className="w-14 h-7 px-1.5 text-xs border rounded text-center"
                value={currentChartSettings.margins?.right || 40}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  updateChartSettings(fileId, {
                    margins: {
                      ...currentChartSettings.margins,
                      right: value
                    }
                  })
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="marginBottom" className="text-xs">Bottom</label>
              <input
                id="marginBottom"
                type="number"
                className="w-14 h-7 px-1.5 text-xs border rounded text-center"
                value={currentChartSettings.margins?.bottom || 60}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  updateChartSettings(fileId, {
                    margins: {
                      ...currentChartSettings.margins,
                      bottom: value
                    }
                  })
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="marginLeft" className="text-xs">Left</label>
              <input
                id="marginLeft"
                type="number"
                className="w-14 h-7 px-1.5 text-xs border rounded text-center"
                value={currentChartSettings.margins?.left || 60}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  updateChartSettings(fileId, {
                    margins: {
                      ...currentChartSettings.margins,
                      left: value
                    }
                  })
                }}
              />
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Axis Label Distance */}
        <div className="px-3 py-2 space-y-2">
          <span className="text-xs font-medium">Axis Label Distance (px)</span>
          <p className="text-xs text-muted-foreground">
            Adjust to avoid overlap with tick labels
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="xLabelOffset" className="text-xs">X-axis label</label>
              <input
                id="xLabelOffset"
                type="number"
                className="w-14 h-7 px-1.5 text-xs border rounded text-center"
                value={currentChartSettings.xLabelOffset || 35}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  updateChartSettings(fileId, {
                    xLabelOffset: value
                  })
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="yLabelOffset" className="text-xs">Y-axis label</label>
              <input
                id="yLabelOffset"
                type="number"
                className="w-14 h-7 px-1.5 text-xs border rounded text-center"
                value={currentChartSettings.yLabelOffset || 35}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  updateChartSettings(fileId, {
                    yLabelOffset: value
                  })
                }}
              />
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}