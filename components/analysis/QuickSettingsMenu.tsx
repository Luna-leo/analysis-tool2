"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Settings2 } from "lucide-react"
import { useLayoutStore } from "@/stores/useLayoutStore"
import { useFileStore } from "@/stores/useFileStore"

interface QuickSettingsMenuProps {
  fileId: string
}

export function QuickSettingsMenu({ fileId }: QuickSettingsMenuProps) {
  const { layoutSettingsMap, updateLayoutSettings } = useLayoutStore()
  const { openTabs, updateFileCharts } = useFileStore()

  const layout = layoutSettingsMap[fileId] || { columns: 2, rows: 2, pagination: true }
  const currentFile = openTabs.find(t => t.id === fileId)

  const toggleShowLegend = () => {
    if (!currentFile?.charts) return
    const newVal = !(currentFile.charts[0].showLegend ?? true)
    const updated = currentFile.charts.map(c => ({ ...c, showLegend: newVal }))
    updateFileCharts(fileId, updated)
  }

  const toggleShowTitle = () => {
    if (!currentFile?.charts) return
    const newVal = !(currentFile.charts[0].showTitle ?? true)
    const updated = currentFile.charts.map(c => ({ ...c, showTitle: newVal }))
    updateFileCharts(fileId, updated)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 px-2">
          <Settings2 className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60">
        <div className="space-y-2 text-sm">
          <button className="w-full text-left" onClick={toggleShowLegend}>Toggle Legend</button>
          <button className="w-full text-left" onClick={toggleShowTitle}>Toggle Title</button>
          <div className="flex items-center justify-between">
            <span>Columns</span>
            <select value={layout.columns} onChange={e => updateLayoutSettings(fileId, { columns: parseInt(e.target.value) })} className="border rounded text-xs px-1 h-6">
              {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span>Rows</span>
            <select value={layout.rows} onChange={e => updateLayoutSettings(fileId, { rows: parseInt(e.target.value) })} className="border rounded text-xs px-1 h-6">
              {[1,2,3,4].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={layout.pagination} onChange={e=>updateLayoutSettings(fileId,{pagination:e.target.checked})} className="rounded" />
            Pagination
          </label>
        </div>
      </PopoverContent>
    </Popover>
  )
}
