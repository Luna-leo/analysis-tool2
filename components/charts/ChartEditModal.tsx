"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog"
import { useUIStore } from "@/stores/useUIStore"
import { useFileStore } from "@/stores/useFileStore"
import { ChartPreview } from "./ChartPreview"
import { ModalHeader } from "./EditModal/ModalHeader"
import { TabNavigation, TabType } from "./EditModal/TabNavigation"
import { TabContent } from "./EditModal/TabContent"
import type { EventInfo } from "@/types"

export function ChartEditModal() {
  const { editingChart, editModalOpen, setEditingChart, setEditModalOpen } = useUIStore()
  const { openTabs, activeTab: activeFileTab, updateFileCharts, updateFileDataSources } = useFileStore()
  const [activeTab, setActiveTab] = useState<TabType>("datasource")
  const [dataSourceStyles, setDataSourceStyles] = useState<{ [dataSourceId: string]: any }>({})

  // Initialize dataSourceStyles from FileNode when modal opens
  React.useEffect(() => {
    if (editModalOpen && editingChart) {
      const targetFileId = editingChart.fileId || activeFileTab
      const currentFile = openTabs.find(tab => tab.id === targetFileId)

      if (currentFile?.dataSourceStyles) {
        setDataSourceStyles(currentFile.dataSourceStyles)
      } else {
        setDataSourceStyles({})
      }
    }
  }, [editModalOpen, editingChart?.id, openTabs, activeFileTab])
  
  // Reset to datasource tab when modal opens
  React.useEffect(() => {
    if (editModalOpen) {
      setActiveTab("datasource")
    }
  }, [editModalOpen])

  if (!editingChart) return null

  const handleSave = () => {
    // Find the current file based on fileId from editingChart
    const targetFileId = editingChart.fileId || activeFileTab
    const currentFile = openTabs.find(tab => tab.id === targetFileId)
    
    if (currentFile) {
      // Update the chart (remove selectedDataSources as it's now managed at FileNode level)
      // Note: editingChart already contains all properties including referenceLines,
      // which are updated by child components via setEditingChart
      const updatedChart = {
        ...editingChart
      }
      
      const currentCharts = currentFile.charts || []
      
      // Check if this is an existing chart or a new one
      const existingChartIndex = currentCharts.findIndex(chart => 
        chart.id === editingChart.id
      )
      
      let updatedCharts
      if (existingChartIndex >= 0) {
        // Update existing chart
        updatedCharts = currentCharts.map(chart => 
          chart.id === editingChart.id ? updatedChart : chart
        )
      } else {
        // Add new chart
        updatedCharts = [...currentCharts, updatedChart]
      }
      
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
    setActiveTab(newTab)
  }

  const targetFileId = editingChart.fileId || activeFileTab
  const currentFile = openTabs.find(tab => tab.id === targetFileId)
  const selectedDataSourceItems = currentFile?.selectedDataSources || []

  const handleSetSelectedDataSourceItems = (items: React.SetStateAction<EventInfo[]>) => {
    if (typeof items === 'function') {
      const newItems = items(selectedDataSourceItems)
      updateFileDataSources(targetFileId, newItems)
    } else {
      updateFileDataSources(targetFileId, items)
    }
  }

  return (
    <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] flex flex-col overflow-hidden" hideCloseButton>
        <DialogDescription className="sr-only">
          Edit chart settings including data source, parameters, and appearance
        </DialogDescription>
        <ModalHeader
          title={editingChart.title}
          onCancel={handleCancel}
          onSave={handleSave}
        />

        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
          <div className="border rounded-lg p-4 overflow-hidden h-full flex flex-col">
            <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} includeDataSourceTab={true} />
            
            <div className="flex-1 min-h-0">
              <TabContent
                activeTab={activeTab}
                editingChart={editingChart}
                setEditingChart={setEditingChart}
                selectedDataSourceItems={selectedDataSourceItems}
                setSelectedDataSourceItems={handleSetSelectedDataSourceItems}
                includeDataSourceTab={true}
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
                dataSourceStyles={dataSourceStyles}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}