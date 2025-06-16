"use client"

import React, { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog"
import { ModalHeader } from "./EditModal/ModalHeader"
import { TabNavigation, TabType } from "./EditModal/TabNavigation"
import { TabContent } from "./EditModal/TabContent"
import { FileNode, ChartComponent } from "@/types"
import { useFileStore } from "@/stores/useFileStore"
import { Button } from "@/components/ui/button"
import { FolderOpen } from "lucide-react"
import { TemplateListDialog } from "./PlotStyleTemplate"
import { PlotStyleTemplate } from "@/types/plot-style-template"
import { PlotStyleApplicator } from "@/utils/plotStyleApplicator"
import { toast } from "sonner"

interface BulkChartEditModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: FileNode
}

export function BulkChartEditModal({ open, onOpenChange, file }: BulkChartEditModalProps) {
  const { applyBulkSettings } = useFileStore()

  const [activeTab, setActiveTab] = useState<TabType>("parameters")
  const [bulkSettings, setBulkSettings] = useState<ChartComponent>(() => ({
    id: "bulk",
    title: "",
    data: [],
    referenceLines: [],
    fileId: file.id
  } as unknown as ChartComponent))
  const [showTemplateList, setShowTemplateList] = useState(false)

  useEffect(() => {
    if (open) {
      const chart = file.charts && file.charts.length > 0
        ? { ...file.charts[0] }
        : { id: "bulk", title: "", data: [], referenceLines: [], fileId: file.id } as ChartComponent
      setBulkSettings(chart)
      setActiveTab("parameters")
    }
  }, [open, file])

  const handleSave = () => {
    const { id, data, fileId, ...settings } = bulkSettings as any
    applyBulkSettings(file.id, settings)
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const handleTemplateSelect = (template: PlotStyleTemplate) => {
    const result = PlotStyleApplicator.applyTemplate(bulkSettings, template)
    if (result.applied && result.updatedChart) {
      setBulkSettings(result.updatedChart)
      toast.success(`Applied template "${template.name}"`)
    } else {
      toast.error("Failed to apply template")
    }
  }

  const selectedDataSourceItems = file.selectedDataSources || []

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl w-[90vw] h-[90vh] flex flex-col overflow-hidden" hideCloseButton>
          <DialogDescription className="sr-only">Bulk edit chart settings</DialogDescription>
          <ModalHeader title={`${file.name} Bulk Edit`} onCancel={handleCancel} onSave={handleSave} />
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} includeDataSourceTab={false} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplateList(true)}
                className="gap-2"
                title="Apply a saved template to these settings"
              >
                <FolderOpen className="h-4 w-4" />
                Apply Template
              </Button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
              <TabContent
                activeTab={activeTab}
                editingChart={bulkSettings}
                setEditingChart={setBulkSettings}
                selectedDataSourceItems={selectedDataSourceItems}
                includeDataSourceTab={false}
                isBulkEdit={true}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Template List Dialog */}
      <TemplateListDialog
        open={showTemplateList}
        onOpenChange={setShowTemplateList}
        onSelectTemplate={handleTemplateSelect}
        hasMultipleCharts={false}
      />
    </>
  )
}

