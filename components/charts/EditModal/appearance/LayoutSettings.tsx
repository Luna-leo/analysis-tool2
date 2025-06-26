"use client"

import { ChartComponent } from "@/types"

interface LayoutSettingsProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
}

export function LayoutSettings({ editingChart, setEditingChart }: LayoutSettingsProps) {
  return (
    <div className="px-4">
      <div className="p-3 bg-muted/30 rounded-md">
        <p className="text-xs text-muted-foreground">
          <strong>Layout Settings:</strong><br/>
          This section has been simplified. Advanced layout options may be added in future updates.
        </p>
      </div>
    </div>
  )
}