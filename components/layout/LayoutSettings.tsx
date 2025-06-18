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
    margins: {
      top: 20,
      right: 40,
      bottom: 60,
      left: 60
    }
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
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs">Layout Settings</DropdownMenuLabel>
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
                  updateLayoutSettings(fileId, {
                    columns: parseInt(e.target.value),
                  })
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
                  updateLayoutSettings(fileId, {
                    rows: parseInt(e.target.value),
                  })
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

        {/* Chart Margins - Visual Layout */}
        <div className="px-3 py-2">
          <span className="text-xs font-medium">Margins (px)</span>
          <div className="flex flex-col items-center gap-1.5 mt-2">
            {/* Top margin */}
            <input
              id="marginTop"
              type="number"
              className="w-14 h-7 px-1.5 text-xs border rounded text-center"
              value={currentChartSettings.margins?.top || 20}
              placeholder="Top"
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0
                updateChartSettings(fileId, {
                  margins: {
                    ...(currentChartSettings.margins || { top: 20, right: 40, bottom: 60, left: 60 }),
                    top: value
                  }
                })
              }}
            />
            
            {/* Middle row with left, chart visual, and right */}
            <div className="flex items-center gap-2 mx-3">
              <input
                id="marginLeft"
                type="number"
                className="w-14 h-7 px-1.5 text-xs border rounded text-center"
                value={currentChartSettings.margins?.left || 60}
                placeholder="Left"
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  updateChartSettings(fileId, {
                    margins: {
                      ...(currentChartSettings.margins || { top: 20, right: 40, bottom: 60, left: 60 }),
                      left: value
                    }
                  })
                }}
              />
              
              {/* Chart visualization - more compact */}
              <div className="w-24 h-16 relative bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-md shadow-sm">
                <svg className="w-full h-full" viewBox="0 0 96 64">
                  {/* Outer container to show margins */}
                  <rect x="0" y="0" width="96" height="64" fill="transparent" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2,2"/>
                  
                  {/* Chart area with margins */}
                  <rect x="14" y="10" width="68" height="44" fill="white" stroke="#d1d5db" strokeWidth="1"/>
                  
                  {/* Y axis */}
                  <line x1="14" y1="10" x2="14" y2="54" stroke="#6b7280" strokeWidth="1.5"/>
                  {/* X axis */}
                  <line x1="14" y1="54" x2="82" y2="54" stroke="#6b7280" strokeWidth="1.5"/>
                  
                  {/* Y axis ticks and labels */}
                  <line x1="11" y1="10" x2="14" y2="10" stroke="#6b7280" strokeWidth="1"/>
                  <line x1="11" y1="21" x2="14" y2="21" stroke="#6b7280" strokeWidth="1"/>
                  <line x1="11" y1="32" x2="14" y2="32" stroke="#6b7280" strokeWidth="1"/>
                  <line x1="11" y1="43" x2="14" y2="43" stroke="#6b7280" strokeWidth="1"/>
                  <line x1="11" y1="54" x2="14" y2="54" stroke="#6b7280" strokeWidth="1"/>
                  
                  {/* X axis ticks */}
                  <line x1="14" y1="54" x2="14" y2="57" stroke="#6b7280" strokeWidth="1"/>
                  <line x1="31" y1="54" x2="31" y2="57" stroke="#6b7280" strokeWidth="1"/>
                  <line x1="48" y1="54" x2="48" y2="57" stroke="#6b7280" strokeWidth="1"/>
                  <line x1="65" y1="54" x2="65" y2="57" stroke="#6b7280" strokeWidth="1"/>
                  <line x1="82" y1="54" x2="82" y2="57" stroke="#6b7280" strokeWidth="1"/>
                  
                  {/* Grid lines */}
                  <line x1="14" y1="21" x2="82" y2="21" stroke="#f3f4f6" strokeWidth="0.5"/>
                  <line x1="14" y1="32" x2="82" y2="32" stroke="#f3f4f6" strokeWidth="0.5"/>
                  <line x1="14" y1="43" x2="82" y2="43" stroke="#f3f4f6" strokeWidth="0.5"/>
                  <line x1="31" y1="10" x2="31" y2="54" stroke="#f3f4f6" strokeWidth="0.5"/>
                  <line x1="48" y1="10" x2="48" y2="54" stroke="#f3f4f6" strokeWidth="0.5"/>
                  <line x1="65" y1="10" x2="65" y2="54" stroke="#f3f4f6" strokeWidth="0.5"/>
                  
                  {/* Sample line chart */}
                  <polyline 
                    points="18,40 28,28 38,32 48,22 58,26 68,18 78,24" 
                    fill="none" 
                    stroke="#3b82f6" 
                    strokeWidth="2"
                  />
                  
                  {/* Data points */}
                  <circle cx="18" cy="40" r="2" fill="#3b82f6"/>
                  <circle cx="28" cy="28" r="2" fill="#3b82f6"/>
                  <circle cx="38" cy="32" r="2" fill="#3b82f6"/>
                  <circle cx="48" cy="22" r="2" fill="#3b82f6"/>
                  <circle cx="58" cy="26" r="2" fill="#3b82f6"/>
                  <circle cx="68" cy="18" r="2" fill="#3b82f6"/>
                  <circle cx="78" cy="24" r="2" fill="#3b82f6"/>
                </svg>
              </div>
              
              <input
                id="marginRight"
                type="number"
                className="w-14 h-7 px-1.5 text-xs border rounded text-center"
                value={currentChartSettings.margins?.right || 40}
                placeholder="Right"
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  updateChartSettings(fileId, {
                    margins: {
                      ...(currentChartSettings.margins || { top: 20, right: 40, bottom: 60, left: 60 }),
                      right: value
                    }
                  })
                }}
              />
            </div>
            
            {/* Bottom margin */}
            <input
              id="marginBottom"
              type="number"
              className="w-14 h-7 px-1.5 text-xs border rounded text-center"
              value={currentChartSettings.margins?.bottom || 60}
              placeholder="Bottom"
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0
                updateChartSettings(fileId, {
                  margins: {
                    ...(currentChartSettings.margins || { top: 20, right: 40, bottom: 60, left: 60 }),
                    bottom: value
                  }
                })
              }}
            />
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}