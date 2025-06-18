"use client"

import React, { useEffect } from "react"
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
import { calculateAutoMargins, calculateAutoLabelOffsets, getLayoutKey } from "@/utils/chart/marginCalculator"

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
      bottom: 60,
      left: 60
    },
    xLabelOffset: 35,
    yLabelOffset: 35,
    marginMode: 'auto' as const,
    autoMarginScale: 1.0,
    marginOverrides: {}
  }
  
  const currentLayoutSettings = {
    ...defaultLayoutSettings,
    ...(layoutSettingsMap[fileId] || {})
  }
  
  const currentChartSettings = {
    ...defaultChartSettings,
    ...(chartSettingsMap[fileId] || {})
  }
  
  // Handle grid preset click with auto margin calculation
  const handleGridPreset = (columns: number, rows: number) => {
    updateLayoutSettings(fileId, { columns, rows })
    
    // If in auto mode, update margins based on new layout
    if (currentChartSettings.marginMode === 'auto') {
      // Get container dimensions (approximate)
      const containerWidth = window.innerWidth * 0.8 // Rough estimate
      const containerHeight = window.innerHeight * 0.7
      
      const autoMargins = calculateAutoMargins(
        columns,
        rows,
        containerWidth,
        containerHeight,
        currentChartSettings.autoMarginScale || 1.0,
        {
          top: currentChartSettings.margins?.top || defaultChartSettings.margins.top,
          right: currentChartSettings.margins?.right || defaultChartSettings.margins.right
        }
      )
      
      const autoOffsets = calculateAutoLabelOffsets(columns, rows)
      
      updateChartSettings(fileId, {
        margins: autoMargins,
        ...autoOffsets
      })
    } else {
      // In manual mode, check for saved overrides for this layout
      const layoutKey = getLayoutKey(columns, rows)
      const overrides = currentChartSettings.marginOverrides as Record<string, any>
      const override = overrides?.[layoutKey]
      
      if (override) {
        updateChartSettings(fileId, {
          margins: override.margins,
          xLabelOffset: override.xLabelOffset,
          yLabelOffset: override.yLabelOffset
        })
      }
    }
  }
  
  // Save current settings as override when switching to manual mode
  const handleMarginModeChange = (mode: 'auto' | 'manual') => {
    if (mode === 'manual' && currentChartSettings.marginMode === 'auto') {
      // Save current settings as override for current layout
      const layoutKey = getLayoutKey(currentLayoutSettings.columns, currentLayoutSettings.rows)
      const currentOverrides = currentChartSettings.marginOverrides || {}
      
      updateChartSettings(fileId, {
        marginMode: mode,
        marginOverrides: {
          ...currentOverrides,
          [layoutKey]: {
            margins: currentChartSettings.margins || defaultChartSettings.margins,
            xLabelOffset: currentChartSettings.xLabelOffset || defaultChartSettings.xLabelOffset,
            yLabelOffset: currentChartSettings.yLabelOffset || defaultChartSettings.yLabelOffset
          }
        }
      })
    } else {
      updateChartSettings(fileId, { marginMode: mode })
    }
  }
  
  // Save margin changes to overrides when in manual mode
  const handleMarginChange = (marginType: 'top' | 'right' | 'bottom' | 'left', value: number) => {
    const newMargins = {
      ...(currentChartSettings.margins || defaultChartSettings.margins),
      [marginType]: value
    }
    
    updateChartSettings(fileId, { margins: newMargins })
    
    // If in manual mode, save to overrides
    if (currentChartSettings.marginMode === 'manual') {
      const layoutKey = getLayoutKey(currentLayoutSettings.columns, currentLayoutSettings.rows)
      const currentOverrides = (currentChartSettings.marginOverrides || {}) as Record<string, any>
      
      updateChartSettings(fileId, {
        marginOverrides: {
          ...currentOverrides,
          [layoutKey]: {
            ...currentOverrides[layoutKey],
            margins: newMargins
          }
        }
      })
    }
  }
  
  // Save label offset changes to overrides when in manual mode
  const handleLabelOffsetChange = (offsetType: 'xLabelOffset' | 'yLabelOffset', value: number) => {
    updateChartSettings(fileId, { [offsetType]: value })
    
    // If in manual mode, save to overrides
    if (currentChartSettings.marginMode === 'manual') {
      const layoutKey = getLayoutKey(currentLayoutSettings.columns, currentLayoutSettings.rows)
      const currentOverrides = (currentChartSettings.marginOverrides || {}) as Record<string, any>
      const currentOverride = currentOverrides[layoutKey] || {
        margins: currentChartSettings.margins || defaultChartSettings.margins,
        xLabelOffset: currentChartSettings.xLabelOffset || defaultChartSettings.xLabelOffset,
        yLabelOffset: currentChartSettings.yLabelOffset || defaultChartSettings.yLabelOffset
      }
      
      updateChartSettings(fileId, {
        marginOverrides: {
          ...currentOverrides,
          [layoutKey]: {
            ...currentOverride,
            [offsetType]: value
          }
        }
      })
    }
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
              variant="outline"
              size="sm"
              className="h-7 text-xs flex-1"
              onClick={() => handleGridPreset(1, 1)}
            >
              1×1
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs flex-1"
              onClick={() => handleGridPreset(2, 2)}
            >
              2×2
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs flex-1"
              onClick={() => handleGridPreset(3, 3)}
            >
              3×3
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs flex-1"
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

        {/* Margin Mode */}
        <div className="px-3 py-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Margin Mode</span>
            <div className="flex gap-1">
              <Button
                variant={currentChartSettings.marginMode === 'auto' ? 'default' : 'outline'}
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => handleMarginModeChange('auto')}
              >
                Auto
              </Button>
              <Button
                variant={currentChartSettings.marginMode === 'manual' ? 'default' : 'outline'}
                size="sm"
                className="h-6 text-xs px-2"
                onClick={() => handleMarginModeChange('manual')}
              >
                Manual
              </Button>
            </div>
          </div>
          
          {currentChartSettings.marginMode === 'auto' && (
            <div className="flex items-center justify-between">
              <label className="text-xs">Label Area Scale</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={currentChartSettings.autoMarginScale || 1.0}
                  className="w-20 h-4"
                  onChange={(e) => updateChartSettings(fileId, { 
                    autoMarginScale: parseFloat(e.target.value) 
                  })}
                />
                <span className="text-xs w-8 text-right">{(currentChartSettings.autoMarginScale || 1.0).toFixed(1)}x</span>
              </div>
            </div>
          )}
          
          {currentChartSettings.marginMode === 'auto' && (
            <p className="text-xs text-muted-foreground">
              Adjusts bottom and left margins for axis labels
            </p>
          )}
        </div>

        <DropdownMenuSeparator />

        {/* Chart Margins */}
        <div className="px-3 py-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Chart Margins (px)</span>
            {currentChartSettings.marginMode === 'auto' && (
              <span className="text-xs text-muted-foreground">Auto-adjusted: Bottom & Left</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between">
              <label htmlFor="marginTop" className="text-xs">Top</label>
              <input
                id="marginTop"
                type="number"
                className={cn(
                  "w-14 h-7 px-1.5 text-xs border rounded text-center",
                  currentChartSettings.marginMode === 'auto' && "bg-muted cursor-not-allowed"
                )}
                value={currentChartSettings.margins?.top || 20}
                disabled={currentChartSettings.marginMode === 'auto'}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  handleMarginChange('top', value)
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="marginRight" className="text-xs">Right</label>
              <input
                id="marginRight"
                type="number"
                className={cn(
                  "w-14 h-7 px-1.5 text-xs border rounded text-center",
                  currentChartSettings.marginMode === 'auto' && "bg-muted cursor-not-allowed"
                )}
                value={currentChartSettings.margins?.right || 40}
                disabled={currentChartSettings.marginMode === 'auto'}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  handleMarginChange('right', value)
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="marginBottom" className={cn(
                "text-xs",
                currentChartSettings.marginMode === 'auto' && "text-foreground font-medium"
              )}>Bottom</label>
              <input
                id="marginBottom"
                type="number"
                className={cn(
                  "w-14 h-7 px-1.5 text-xs border rounded text-center",
                  currentChartSettings.marginMode === 'auto' && "bg-muted cursor-not-allowed"
                )}
                value={currentChartSettings.margins?.bottom || 60}
                disabled={currentChartSettings.marginMode === 'auto'}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  handleMarginChange('bottom', value)
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="marginLeft" className={cn(
                "text-xs",
                currentChartSettings.marginMode === 'auto' && "text-foreground font-medium"
              )}>Left</label>
              <input
                id="marginLeft"
                type="number"
                className={cn(
                  "w-14 h-7 px-1.5 text-xs border rounded text-center",
                  currentChartSettings.marginMode === 'auto' && "bg-muted cursor-not-allowed"
                )}
                value={currentChartSettings.margins?.left || 60}
                disabled={currentChartSettings.marginMode === 'auto'}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  handleMarginChange('left', value)
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
                className={cn(
                  "w-14 h-7 px-1.5 text-xs border rounded text-center",
                  currentChartSettings.marginMode === 'auto' && "bg-muted cursor-not-allowed"
                )}
                value={currentChartSettings.xLabelOffset || 35}
                disabled={currentChartSettings.marginMode === 'auto'}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  handleLabelOffsetChange('xLabelOffset', value)
                }}
              />
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="yLabelOffset" className="text-xs">Y-axis label</label>
              <input
                id="yLabelOffset"
                type="number"
                className={cn(
                  "w-14 h-7 px-1.5 text-xs border rounded text-center",
                  currentChartSettings.marginMode === 'auto' && "bg-muted cursor-not-allowed"
                )}
                value={currentChartSettings.yLabelOffset || 35}
                disabled={currentChartSettings.marginMode === 'auto'}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  handleLabelOffsetChange('yLabelOffset', value)
                }}
              />
            </div>
          </div>
          {currentChartSettings.marginMode === 'auto' && (
            <p className="text-xs text-muted-foreground italic">
              Switch to Manual mode to edit values
            </p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}