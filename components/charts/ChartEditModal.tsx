"use client"

import React, { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useUIStore } from "@/stores/useUIStore"
import { ChartPreview } from "./ChartPreview"
import { EventInfo } from "@/types"
import { ModalHeader } from "./EditModal/ModalHeader"
import { TabNavigation, TabType } from "./EditModal/TabNavigation"
import { TabContent } from "./EditModal/TabContent"

export function ChartEditModal() {
  const { editingChart, editModalOpen, setEditingChart, setEditModalOpen } = useUIStore()
  const [activeTab, setActiveTab] = useState<TabType>("datasource")
  const [selectedDataSourceItems, setSelectedDataSourceItems] = useState<EventInfo[]>([])

  if (!editingChart) return null

  const handleSave = () => {
    // TODO: Implement save logic
    setEditModalOpen(false)
  }

  const handleCancel = () => {
    setEditModalOpen(false)
  }

  return (
    <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
      <DialogContent className="max-w-7xl w-[90vw] h-[90vh] flex flex-col overflow-hidden" hideCloseButton>
        <ModalHeader
          title={editingChart.title}
          onCancel={handleCancel}
          onSave={handleSave}
        />

        <div className="grid grid-cols-[7fr_5fr] gap-4 flex-1 min-h-0">
          <div className="border rounded-lg p-4 overflow-hidden h-full flex flex-col">
            <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
            
            <div className="flex-1 min-h-0">
              <TabContent
                activeTab={activeTab}
                editingChart={editingChart}
                setEditingChart={setEditingChart}
                selectedDataSourceItems={selectedDataSourceItems}
                setSelectedDataSourceItems={setSelectedDataSourceItems}
              />
            </div>
          </div>

          <div className="border rounded-lg p-4 overflow-hidden h-full flex flex-col">
            <h3 className="text-base font-semibold border-b pb-1 mb-2 flex-shrink-0">Chart Preview</h3>
            <div className="flex-1 min-h-0">
              <ChartPreview
                editingChart={editingChart}
                selectedDataSourceItems={selectedDataSourceItems}
                setEditingChart={setEditingChart}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}