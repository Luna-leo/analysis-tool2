"use client"

import React, { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog"
import { ModalHeader } from "./EditModal/ModalHeader"
import { TabNavigation, TabType } from "./EditModal/TabNavigation"
import { TabContent } from "./EditModal/TabContent"
import { FileNode, ChartComponent } from "@/types"
import { useFileStore } from "@/stores/useFileStore"

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

  const selectedDataSourceItems = file.selectedDataSources || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[90vw] h-[90vh] flex flex-col overflow-hidden" hideCloseButton>
        <DialogDescription className="sr-only">Bulk edit chart settings</DialogDescription>
        <ModalHeader title={`${file.name} Bulk Edit`} onCancel={handleCancel} onSave={handleSave} />
        <div className="flex-1 min-h-0 flex flex-col">
          <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} includeDataSourceTab={false} />
          <div className="flex-1 min-h-0 overflow-y-auto">
            <TabContent
              activeTab={activeTab}
              editingChart={bulkSettings}
              setEditingChart={setBulkSettings}
              selectedDataSourceItems={selectedDataSourceItems}
              includeDataSourceTab={false}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

