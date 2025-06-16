"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog"
import { useUIStore } from "@/stores/useUIStore"
import { useFileStore } from "@/stores/useFileStore"
import { ChartPreview } from "./ChartPreview"
import { ModalHeader } from "./EditModal/ModalHeader"
import { TabNavigation, TabType } from "./EditModal/TabNavigation"
import { TabContent } from "./EditModal/TabContent"
import { ChartThumbnailGrid } from "./EditModal/ChartThumbnailGrid"
import type { EventInfo, ChartComponent } from "@/types"

export function ChartEditModal() {
  const { editingChart, editingChartIndex, editModalOpen, setEditingChart, setEditModalOpen, navigateToNextChart, navigateToPreviousChart } = useUIStore()
  const { openTabs, activeTab: activeFileTab, updateFileCharts, updateFileDataSources } = useFileStore()
  const [activeTab, setActiveTab] = useState<TabType>("datasource")
  const [dataSourceStyles, setDataSourceStyles] = useState<{ [dataSourceId: string]: any }>({})

  // Keyboard shortcut handlers
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!editModalOpen || !editingChart) return

      // Ctrl/Cmd + Arrow keys for navigation
      if (e.ctrlKey || e.metaKey) {
        const targetFileId = editingChart.fileId || activeFileTab
        const currentFile = openTabs.find(tab => tab.id === targetFileId)
        const allCharts = currentFile?.charts || []

        if (e.key === 'ArrowRight') {
          e.preventDefault()
          navigateToNextChart(allCharts)
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          navigateToPreviousChart(allCharts)
        } else if (e.key >= '1' && e.key <= '9') {
          // Ctrl/Cmd + Number to jump to specific chart
          e.preventDefault()
          const index = parseInt(e.key) - 1
          if (index < allCharts.length) {
            const chart = allCharts[index]
            setEditingChart(chart)
            useUIStore.getState().setEditingChartWithIndex(chart, index)
            setActiveTab("datasource")
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editModalOpen, editingChart, activeFileTab, openTabs, navigateToNextChart, navigateToPreviousChart])

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

  const handleSave = (closeModal = true) => {
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
    
    if (closeModal) {
      setEditModalOpen(false)
    }
  }

  const handleSaveAndNext = () => {
    handleSave(false) // Save without closing modal
    navigateToNextChart(allCharts) // Navigate to next chart
    setActiveTab("datasource") // Reset to first tab
  }

  const handleChartSelect = (chart: ChartComponent, index: number) => {
    setEditingChart(chart)
    useUIStore.getState().setEditingChartWithIndex(chart, index)
    setActiveTab("datasource") // Reset to first tab when switching charts
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
  const allCharts = currentFile?.charts || []

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
      <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] flex flex-col overflow-hidden" hideCloseButton>
        <DialogDescription className="sr-only">
          Edit chart settings including data source, parameters, and appearance
        </DialogDescription>
        <ModalHeader
          title={editingChart.title}
          onCancel={handleCancel}
          onSave={() => handleSave(true)}
          currentIndex={editingChartIndex}
          totalCharts={allCharts.length}
          onPreviousChart={() => navigateToPreviousChart(allCharts)}
          onNextChart={() => navigateToNextChart(allCharts)}
          onSaveAndNext={handleSaveAndNext}
        />

        {allCharts.length > 1 && (
          <ChartThumbnailGrid
            charts={allCharts}
            currentChartId={editingChart.id}
            onChartSelect={handleChartSelect}
            className="mx-6 mt-2"
          />
        )}

        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0 mt-4">
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