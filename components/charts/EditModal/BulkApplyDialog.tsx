"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ChartComponent } from "@/types"

interface BulkApplyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedChartIds: Set<string>
  currentChart: ChartComponent
  allCharts: ChartComponent[]
  onApply: (settings: BulkApplySettings) => void
}

export interface BulkApplySettings {
  applyAxisSettings: boolean
  applyDisplaySettings: boolean
  applyReferenceLines: boolean
  applyAnnotations: boolean
  applyDataSources: boolean
}

export function BulkApplyDialog({
  open,
  onOpenChange,
  selectedChartIds,
  currentChart,
  allCharts,
  onApply
}: BulkApplyDialogProps) {
  const [settings, setSettings] = useState<BulkApplySettings>({
    applyAxisSettings: true,
    applyDisplaySettings: true,
    applyReferenceLines: false,
    applyAnnotations: false,
    applyDataSources: false
  })

  const selectedCharts = allCharts.filter(chart => selectedChartIds.has(chart.id))

  const handleApply = () => {
    onApply(settings)
    onOpenChange(false)
  }

  const updateSetting = (key: keyof BulkApplySettings, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Apply Settings to Selected Charts</DialogTitle>
          <DialogDescription>
            Choose which settings from "{currentChart.title}" to apply to {selectedCharts.length} selected chart{selectedCharts.length !== 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="axis"
                checked={settings.applyAxisSettings}
                onCheckedChange={(checked) => updateSetting('applyAxisSettings', !!checked)}
              />
              <Label htmlFor="axis" className="text-sm font-medium leading-none cursor-pointer">
                Axis Settings
                <span className="text-xs text-muted-foreground block mt-1">
                  Y-axis range, scale type, grid lines
                </span>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="display"
                checked={settings.applyDisplaySettings}
                onCheckedChange={(checked) => updateSetting('applyDisplaySettings', !!checked)}
              />
              <Label htmlFor="display" className="text-sm font-medium leading-none cursor-pointer">
                Display Settings
                <span className="text-xs text-muted-foreground block mt-1">
                  Line width, colors, plot style, stacked mode
                </span>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="reference"
                checked={settings.applyReferenceLines}
                onCheckedChange={(checked) => updateSetting('applyReferenceLines', !!checked)}
              />
              <Label htmlFor="reference" className="text-sm font-medium leading-none cursor-pointer">
                Reference Lines
                <span className="text-xs text-muted-foreground block mt-1">
                  All reference lines and their settings
                </span>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="annotations"
                checked={settings.applyAnnotations}
                onCheckedChange={(checked) => updateSetting('applyAnnotations', !!checked)}
              />
              <Label htmlFor="annotations" className="text-sm font-medium leading-none cursor-pointer">
                Annotations
                <span className="text-xs text-muted-foreground block mt-1">
                  Text annotations and markers
                </span>
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="datasources"
                checked={settings.applyDataSources}
                onCheckedChange={(checked) => updateSetting('applyDataSources', !!checked)}
              />
              <Label htmlFor="datasources" className="text-sm font-medium leading-none cursor-pointer">
                Data Sources
                <span className="text-xs text-muted-foreground block mt-1">
                  Selected data sources and parameters
                </span>
              </Label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply to {selectedCharts.length} Chart{selectedCharts.length !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}