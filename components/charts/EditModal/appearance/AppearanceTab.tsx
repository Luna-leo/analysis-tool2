"use client"

import React, { useState } from "react"
import { ChartComponent } from "@/types"
import { ChartSettings } from "./ChartSettings"
import { PlotStyleTable } from "./PlotStyleSettings"
import { LayoutSettings } from "./LayoutSettings"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Save, FolderOpen, Layers } from "lucide-react"
import { SaveTemplateDialog, TemplateListDialog, BulkApplyDialog } from "@/components/charts/PlotStyleTemplate"
import { PlotStyleTemplate } from "@/types/plot-style-template"
import { PlotStyleApplicator } from "@/utils/plotStyleApplicator"
import { useFileStore } from "@/stores/useFileStore"
import { toast } from "sonner"

interface AppearanceTabProps {
  editingChart: ChartComponent
  setEditingChart: (chart: ChartComponent) => void
  selectedDataSourceItems: {
    id: string
    plant: string
    machineNo: string
    label: string
    labelDescription?: string
  }[]
}

export function AppearanceTab({
  editingChart,
  setEditingChart,
  selectedDataSourceItems,
}: AppearanceTabProps) {
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showTemplateList, setShowTemplateList] = useState(false)
  const [showBulkApply, setShowBulkApply] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<PlotStyleTemplate | null>(null)
  const { openTabs } = useFileStore()
  const currentFile = openTabs.find(tab => tab.charts?.some(c => c.id === editingChart.id))

  const handleTemplateSelect = (template: PlotStyleTemplate) => {
    const result = PlotStyleApplicator.applyTemplate(editingChart, template)
    if (result.applied && result.updatedChart) {
      setEditingChart(result.updatedChart)
      toast.success(`Applied template "${template.name}"`)
    } else {
      toast.error("Failed to apply template")
    }
  }

  const handleBulkApplySelect = (template: PlotStyleTemplate) => {
    setSelectedTemplate(template)
    setShowTemplateList(false)
    setShowBulkApply(true)
  }

  return (
    <div className="space-y-4">
      {/* Template Actions - at the top level */}
      <div className="flex items-center justify-between px-4">
        <h3 className="text-sm font-medium">Appearance Settings</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSaveDialog(true)}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Save as Template
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowTemplateList(true)}
            className="gap-2"
          >
            <FolderOpen className="h-4 w-4" />
            Apply Template
          </Button>
        </div>
      </div>
      
      <Separator />
      {/* Chart General Settings */}
      <ChartSettings editingChart={editingChart} setEditingChart={setEditingChart} />
      
      <Separator />
      
      {/* Layout Settings */}
      <LayoutSettings editingChart={editingChart} setEditingChart={setEditingChart} />
      
      <Separator />
      
      {/* Plot Style Settings */}
      <PlotStyleTable
        editingChart={editingChart}
        setEditingChart={setEditingChart}
        selectedDataSourceItems={selectedDataSourceItems}
      />

      {/* Dialogs */}
      <SaveTemplateDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        chart={editingChart}
      />
      
      <TemplateListDialog
        open={showTemplateList}
        onOpenChange={setShowTemplateList}
        onSelectTemplate={handleBulkApplySelect}
        hasMultipleCharts={openTabs.some(tab => tab.charts && tab.charts.length > 1)}
      />
      
      {selectedTemplate && currentFile && (
        <BulkApplyDialog
          open={showBulkApply}
          onOpenChange={setShowBulkApply}
          template={selectedTemplate}
          currentFile={currentFile}
          editingChart={editingChart}
        />
      )}
    </div>
  )
}
