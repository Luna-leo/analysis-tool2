"use client"

import React, { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { FileNode, ChartComponent, MarkerType } from "@/types"
import { PlotStyleTemplate, ApplyStrategy, ColorTheme, MarkerPattern } from "@/types/plot-style-template"
import { useFileStore } from "@/stores/useFileStore"
import { PlotStyleApplicator } from "@/utils/plotStyleApplicator"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface BulkApplyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: PlotStyleTemplate
  currentFile: FileNode
  editingChart?: ChartComponent
}

export function BulkApplyDialog({ 
  open, 
  onOpenChange, 
  template,
  currentFile,
  editingChart
}: BulkApplyDialogProps) {
  const { openTabs, updateFileCharts } = useFileStore()
  const [selectedCharts, setSelectedCharts] = useState<Set<string>>(new Set())
  const [applyStrategy, setApplyStrategy] = useState<ApplyStrategy>('pattern')
  const [colorTheme, setColorTheme] = useState<ColorTheme>('default')
  const [markerPattern, setMarkerPattern] = useState<MarkerPattern>('preserve')
  
  // Settings to apply
  const [applyDisplaySettings, setApplyDisplaySettings] = useState(true)
  const [applyCommonStyles, setApplyCommonStyles] = useState(true)
  const [applyOptionalStyles, setApplyOptionalStyles] = useState(false)
  const [applyLayoutSettings, setApplyLayoutSettings] = useState(true)

  // Get all charts from open tabs
  const availableCharts = openTabs.flatMap(tab => 
    (tab.charts || []).map(chart => ({
      ...chart,
      fileName: tab.name,
      fileId: tab.id
    }))
  )

  const handleToggleChart = (chartId: string) => {
    const newSelected = new Set(selectedCharts)
    if (newSelected.has(chartId)) {
      newSelected.delete(chartId)
    } else {
      newSelected.add(chartId)
    }
    setSelectedCharts(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedCharts.size === availableCharts.length) {
      setSelectedCharts(new Set())
    } else {
      setSelectedCharts(new Set(availableCharts.map(c => c.id)))
    }
  }

  const handleApply = () => {
    // If no charts selected, apply to current chart only
    const chartsToApply = selectedCharts.size === 0 && editingChart 
      ? new Set([editingChart.id])
      : selectedCharts
      
    if (chartsToApply.size === 0) {
      toast.error("Please select at least one chart")
      return
    }

    let successCount = 0
    let errorCount = 0
    const chartsByFile = new Map<string, ChartComponent[]>()

    // Group charts by file
    availableCharts.forEach(chart => {
      if (chartsToApply.has(chart.id)) {
        if (!chartsByFile.has(chart.fileId)) {
          chartsByFile.set(chart.fileId, [])
        }
        chartsByFile.get(chart.fileId)!.push(chart)
      }
    })

    // Apply template to each selected chart
    chartsByFile.forEach((charts, fileId) => {
      const file = openTabs.find(tab => tab.id === fileId)
      if (!file) return

      const updatedCharts = file.charts?.map(chart => {
        if (!chartsToApply.has(chart.id)) return chart

        // Create a template with optional styles if selected
        const templateToApply = {
          ...template,
          optionalStyles: applyOptionalStyles ? {
            colorTheme,
            markerPattern,
            markerType: markerPattern === 'uniform' ? 'circle' as MarkerType : undefined
          } : {}
        }

        const result = PlotStyleApplicator.applyTemplate(chart, templateToApply, {
          strategy: applyStrategy,
          applyDisplaySettings,
          applyCommonStyles,
          applyOptionalStyles,
          applyLayoutSettings
        })

        if (result.applied && result.updatedChart) {
          successCount++
          return result.updatedChart
        } else {
          errorCount++
          return chart
        }
      }) || []

      updateFileCharts(fileId, updatedCharts)
    })

    if (successCount > 0) {
      toast.success(`Template applied to ${successCount} chart${successCount > 1 ? 's' : ''}`)
    }
    if (errorCount > 0) {
      toast.error(`Failed to apply to ${errorCount} chart${errorCount > 1 ? 's' : ''}`)
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Apply Template to Multiple Charts</DialogTitle>
          <DialogDescription>
            Select which charts to apply the "{template.name}" template to.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="charts" className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="charts">Select Charts</TabsTrigger>
            <TabsTrigger value="options">Apply Options</TabsTrigger>
          </TabsList>

          <TabsContent value="charts" className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <Label>Available Charts ({availableCharts.length})</Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedCharts.size === availableCharts.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            <ScrollArea className="h-[300px] border rounded-lg p-4">
              <div className="space-y-2">
                {availableCharts.map((chart) => (
                  <div key={chart.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={chart.id}
                      checked={selectedCharts.has(chart.id)}
                      onCheckedChange={() => handleToggleChart(chart.id)}
                    />
                    <Label
                      htmlFor={chart.id}
                      className="flex-1 cursor-pointer text-sm"
                    >
                      <span className="font-medium">{chart.title || 'Untitled Chart'}</span>
                      <span className="text-muted-foreground ml-2">({chart.fileName})</span>
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="options" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium mb-2">Settings to Apply</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="display-settings"
                      checked={applyDisplaySettings}
                      onCheckedChange={(checked) => setApplyDisplaySettings(!!checked)}
                    />
                    <Label htmlFor="display-settings" className="cursor-pointer">
                      Display Settings (markers, lines, grid, legend visibility)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="common-styles"
                      checked={applyCommonStyles}
                      onCheckedChange={(checked) => setApplyCommonStyles(!!checked)}
                    />
                    <Label htmlFor="common-styles" className="cursor-pointer">
                      Common Styles (marker size, line width, axis settings)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="optional-styles"
                      checked={applyOptionalStyles}
                      onCheckedChange={(checked) => setApplyOptionalStyles(!!checked)}
                    />
                    <Label htmlFor="optional-styles" className="cursor-pointer">
                      Color & Marker Patterns
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="layout-settings"
                      checked={applyLayoutSettings}
                      onCheckedChange={(checked) => setApplyLayoutSettings(!!checked)}
                    />
                    <Label htmlFor="layout-settings" className="cursor-pointer">
                      Layout Settings (legend position, margins)
                    </Label>
                  </div>
                </div>
              </div>

              {applyOptionalStyles && (
                <>
                  <div>
                    <Label className="text-base font-medium mb-2">Color Theme</Label>
                    <RadioGroup value={colorTheme} onValueChange={(v) => setColorTheme(v as ColorTheme)}>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="default" id="color-default" />
                          <Label htmlFor="color-default">Keep existing colors</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="blue" id="color-blue" />
                          <Label htmlFor="color-blue">Blue theme</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="warm" id="color-warm" />
                          <Label htmlFor="color-warm">Warm colors</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="cool" id="color-cool" />
                          <Label htmlFor="color-cool">Cool colors</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="monochrome" id="color-mono" />
                          <Label htmlFor="color-mono">Monochrome</Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="text-base font-medium mb-2">Marker Pattern</Label>
                    <RadioGroup value={markerPattern} onValueChange={(v) => setMarkerPattern(v as MarkerPattern)}>
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="preserve" id="marker-preserve" />
                          <Label htmlFor="marker-preserve">Keep existing markers</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="uniform" id="marker-uniform" />
                          <Label htmlFor="marker-uniform">All same marker (circle)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="cycle" id="marker-cycle" />
                          <Label htmlFor="marker-cycle">Cycle through shapes</Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleApply}
            disabled={selectedCharts.size === 0}
          >
            Apply to {selectedCharts.size} Chart{selectedCharts.size !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}