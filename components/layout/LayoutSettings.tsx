"use client"

import React from "react"
import { LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
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
}

export function LayoutSettings({ fileId }: LayoutSettingsProps) {
  const { layoutSettingsMap, updateLayoutSettings } = useLayoutStore()
  
  const defaultSettings = {
    showFileName: true,
    showDataSources: true,
    columns: 2,
    rows: 2,
    pagination: true,
  }
  
  const currentSettings = {
    ...defaultSettings,
    ...(layoutSettingsMap[fileId] || {})
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <LayoutGrid className="h-4 w-4" />
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
                value={currentSettings.columns || 2}
                onChange={(e) => {
                  updateLayoutSettings(fileId, {
                    columns: parseInt(e.target.value),
                  })
                }}
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
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
                value={currentSettings.rows || 2}
                onChange={(e) => {
                  updateLayoutSettings(fileId, {
                    rows: parseInt(e.target.value),
                  })
                }}
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
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
              checked={currentSettings.pagination ?? true}
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

        {/* Display Settings */}
        <div className="p-3">
          <h4 className="text-sm font-medium mb-3">Display Options</h4>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showFileName"
                checked={currentSettings.showFileName ?? true}
                onChange={(e) => {
                  updateLayoutSettings(fileId, {
                    showFileName: e.target.checked,
                  })
                }}
                className="rounded"
              />
              <label htmlFor="showFileName" className="text-xs">
                Show file name
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="showDataSources"
                checked={currentSettings.showDataSources ?? true}
                onChange={(e) => {
                  updateLayoutSettings(fileId, {
                    showDataSources: e.target.checked,
                  })
                }}
                className="rounded"
              />
              <label htmlFor="showDataSources" className="text-xs">
                Show data sources
              </label>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}