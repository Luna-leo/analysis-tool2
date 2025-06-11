"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog"
import { useUIStore } from "@/stores/useUIStore"
import { useFileStore } from "@/stores/useFileStore"
import { ChartPreview } from "./ChartPreview"
import { EventInfo } from "@/types"
import { ModalHeader } from "./EditModal/ModalHeader"
import { TabNavigation, TabType } from "./EditModal/TabNavigation"
import { TabContent } from "./EditModal/TabContent"

export function ChartEditModal() {
  const { editingChart, editModalOpen, setEditingChart, setEditModalOpen } = useUIStore()
  const { openTabs, activeTab: activeFileTab, updateFileCharts } = useFileStore()
  const [activeTab, setActiveTab] = useState<TabType>("datasource")
  const [selectedDataSourceItems, setSelectedDataSourceItems] = useState<EventInfo[]>([])

  // Initialize selectedDataSourceItems when modal opens
  React.useEffect(() => {
    if (editModalOpen && editingChart?.selectedDataSources) {
      setSelectedDataSourceItems(editingChart.selectedDataSources)
    } else if (editModalOpen) {
      setSelectedDataSourceItems([])
    }
  }, [editModalOpen, editingChart?.id])
  
  // Reset to datasource tab when modal opens
  React.useEffect(() => {
    if (editModalOpen) {
      setActiveTab("datasource")
    }
  }, [editModalOpen])

  if (!editingChart) return null

  const handleSave = () => {
    // Find the current file that contains this chart
    const currentFile = openTabs.find(tab => tab.id === activeFileTab)
    
    if (currentFile && currentFile.charts) {
      // Update the chart with selected data sources
      // Note: editingChart already contains all properties including referenceLines,
      // which are updated by child components via setEditingChart
      const updatedChart = {
        ...editingChart,
        selectedDataSources: selectedDataSourceItems
      }
      
      
      // Update the chart in the charts array
      const updatedCharts = currentFile.charts.map(chart => 
        chart.id === editingChart.id ? updatedChart : chart
      )
      
      // Save to file store
      updateFileCharts(currentFile.id, updatedCharts)
    }
    
    setEditModalOpen(false)
  }

  const handleCancel = () => {
    setEditModalOpen(false)
  }
  
  const handleTabChange = (newTab: TabType) => {
    // Save current state before switching tabs
    // The editingChart already contains all updated properties including referenceLines
    // We only need to update selectedDataSources since it's managed separately
    if (editingChart) {
      setEditingChart({
        ...editingChart,
        selectedDataSources: selectedDataSourceItems
      })
    }
    setActiveTab(newTab)
  }

  return (
    <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
      <DialogContent className="max-w-7xl w-[90vw] h-[90vh] flex flex-col overflow-hidden" hideCloseButton>
        <DialogDescription className="sr-only">
          Edit chart settings including data source, parameters, and appearance
        </DialogDescription>
        <ModalHeader
          title={editingChart.title}
          onCancel={handleCancel}
          onSave={handleSave}
        />

        <div className="grid grid-cols-[7fr_5fr] gap-4 flex-1 min-h-0">
          <div className="border rounded-lg p-4 overflow-hidden h-full flex flex-col">
            <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
            
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