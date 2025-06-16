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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChartComponent } from "@/types"
import { PlotStyleTemplate } from "@/types/plot-style-template"
import { usePlotStyleTemplateStore } from "@/stores/usePlotStyleTemplateStore"
import { toast } from "sonner"

interface SaveTemplateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chart: ChartComponent
}

export function SaveTemplateDialog({ open, onOpenChange, chart }: SaveTemplateDialogProps) {
  const [templateName, setTemplateName] = useState("")
  const [description, setDescription] = useState("")
  const { addTemplate } = usePlotStyleTemplateStore()

  const handleSave = () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name")
      return
    }

    const template: Omit<PlotStyleTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
      name: templateName,
      description: description || undefined,
      
      // Extract display settings
      displaySettings: {
        showMarkers: chart.showMarkers,
        showLines: chart.showLines,
        showGrid: chart.showGrid,
        showTitle: chart.showTitle,
        showLegend: chart.showLegend,
        showXLabel: chart.showXLabel,
        showYLabel: chart.showYLabel,
      },
      
      // Extract common styles
      commonStyles: {
        // We'll extract these from the first plot style we find
        ...(extractCommonStyles(chart)),
        xAxisTicks: chart.xAxisTicks,
        yAxisTicks: chart.yAxisTicks,
        xAxisTickPrecision: chart.xAxisTickPrecision,
        yAxisTickPrecision: chart.yAxisTickPrecision,
      },
      
      // For now, we won't save color themes or marker patterns
      // These could be detected and saved in a future enhancement
      optionalStyles: {},
      
      // Extract layout settings
      layoutSettings: {
        legendPosition: chart.legendPosition,
        margins: chart.margins,
      },
    }

    addTemplate(template)
    toast.success(`Template "${templateName}" saved successfully`)
    
    // Reset form and close
    setTemplateName("")
    setDescription("")
    onOpenChange(false)
  }

  const extractCommonStyles = (chart: ChartComponent) => {
    const commonStyles: any = {}
    
    if (!chart.plotStyles) return commonStyles
    
    // Get the first plot style to extract common values
    let firstStyle: any = null
    
    if (chart.plotStyles.byDataSource) {
      firstStyle = Object.values(chart.plotStyles.byDataSource)[0]
    } else if (chart.plotStyles.byParameter) {
      firstStyle = Object.values(chart.plotStyles.byParameter)[0]
    } else if (chart.plotStyles.byBoth) {
      firstStyle = Object.values(chart.plotStyles.byBoth)[0]
    }
    
    if (firstStyle) {
      if (firstStyle.marker) {
        commonStyles.markerSize = firstStyle.marker.size
      }
      if (firstStyle.line) {
        commonStyles.lineWidth = firstStyle.line.width
        commonStyles.lineStyle = firstStyle.line.style
      }
    }
    
    return commonStyles
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Save Plot Style Template</DialogTitle>
          <DialogDescription>
            Save current plot settings as a template that can be applied to other charts.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Blue Theme with Markers"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe when to use this template..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!templateName.trim()}>
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}