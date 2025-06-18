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
  }
  
  const currentLayoutSettings = {
    ...defaultLayoutSettings,
    ...(layoutSettingsMap[fileId] || {})
  }
  
  const currentChartSettings = {
    ...defaultChartSettings,
    ...(chartSettingsMap[fileId] || {})
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
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Layout Settings</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Grid Settings */}
        <div className="p-3">
          <h4 className="text-sm font-medium mb-3">Grid Layout</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="columns" className="text-xs text-muted-foreground">
                Columns
              </label>
              <select
                id="columns"
                className="w-full h-8 px-2 text-sm border rounded"
                value={currentLayoutSettings.columns || 2}
                onChange={(e) => {
                  updateLayoutSettings(fileId, {
                    columns: parseInt(e.target.value),
                  })
                }}
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="rows" className="text-xs text-muted-foreground">
                Rows
              </label>
              <select
                id="rows"
                className="w-full h-8 px-2 text-sm border rounded"
                value={currentLayoutSettings.rows || 2}
                onChange={(e) => {
                  updateLayoutSettings(fileId, {
                    rows: parseInt(e.target.value),
                  })
                }}
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Pagination Settings */}
        <div className="p-3">
          <h4 className="text-sm font-medium mb-3">Pagination</h4>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="pagination"
              checked={currentLayoutSettings.pagination ?? true}
              onChange={(e) => {
                updateLayoutSettings(fileId, {
                  pagination: e.target.checked,
                })
              }}
              className="rounded"
            />
            <label htmlFor="pagination" className="text-xs">
              Enable pagination
            </label>
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Display Options */}
        <div className="p-3">
          <h4 className="text-sm font-medium mb-3">Display Options</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showLegend"
                checked={currentChartSettings.showLegend ?? true}
                onChange={(e) => {
                  updateChartSettings(fileId, {
                    showLegend: e.target.checked,
                  })
                }}
                className="rounded"
              />
              <label htmlFor="showLegend" className="text-xs">
                Show legend
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showChartTitle"
                checked={currentChartSettings.showChartTitle ?? true}
                onChange={(e) => {
                  updateChartSettings(fileId, {
                    showChartTitle: e.target.checked,
                  })
                }}
                className="rounded"
              />
              <label htmlFor="showChartTitle" className="text-xs">
                Show chart title
              </label>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}