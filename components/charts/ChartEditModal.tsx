"use client"

import React, { useState } from "react"
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog"
import { useUIStore } from "@/stores/useUIStore"
import { useFileStore } from "@/stores/useFileStore"
import { useLayoutStore } from "@/stores/useLayoutStore"
import { ChartPreview } from "./ChartPreview"
import { ModalHeader } from "./EditModal/ModalHeader"
import { TabNavigation, TabType } from "./EditModal/TabNavigation"
import { TabContent } from "./EditModal/TabContent"
import { ChartSelectionGrid } from "./EditModal/ChartSelectionGrid"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Grid3x3, Eye } from "lucide-react"
import type { EventInfo, ChartComponent } from "@/types"
import { BulkApplyDialog, BulkApplySettings } from "./EditModal/BulkApplyDialog"

export function ChartEditModal() {
  const { 
    editingChart, 
    editingChartIndex, 
    editModalOpen, 
    selectedChartIds,
    setEditingChart, 
    setEditModalOpen, 
    navigateToNextChart, 
    navigateToPreviousChart,
    toggleChartSelection,
    clearSelectedCharts
  } = useUIStore()
  const { openTabs, activeTab: activeFileTab, updateFileCharts, updateFileDataSources } = useFileStore()
  const { layoutSettingsMap } = useLayoutStore()
  const [activeTab, setActiveTab] = useState<TabType>("datasource")
  const [dataSourceStyles, setDataSourceStyles] = useState<{ [dataSourceId: string]: any }>({})
  const [previewMode, setPreviewMode] = useState<'preview' | 'grid'>('preview')
  const [bulkApplyDialogOpen, setBulkApplyDialogOpen] = useState(false)

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
        } else if (e.key === 'a' || e.key === 'A') {
          // Ctrl/Cmd + A to select all in grid mode
          if (previewMode === 'grid') {
            e.preventDefault()
            const allChartIds = allCharts.map(chart => chart.id)
            useUIStore.getState().selectAllCharts(allChartIds)
          }
        }
      }
      
      // Escape key to clear selection
      if (e.key === 'Escape' && previewMode === 'grid' && selectedChartIds.size > 0) {
        e.preventDefault()
        clearSelectedCharts()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editModalOpen, editingChart, activeFileTab, openTabs, navigateToNextChart, navigateToPreviousChart, previewMode, selectedChartIds, clearSelectedCharts])

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
      setPreviewMode('preview')
      clearSelectedCharts()
    }
  }, [editModalOpen, clearSelectedCharts])

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
    const targetFileId = editingChart.fileId || activeFileTab
    const currentFile = openTabs.find(tab => tab.id === targetFileId)
    const allCharts = currentFile?.charts || []
    
    handleSave(false) // Save without closing modal
    navigateToNextChart(allCharts) // Navigate to next chart
    setActiveTab("datasource") // Reset to first tab
  }

  const handleChartSelect = (chart: ChartComponent, index: number) => {
    setEditingChart(chart)
    useUIStore.getState().setEditingChartWithIndex(chart, index)
    setActiveTab("datasource") // Reset to first tab when switching charts
    setPreviewMode('preview') // Switch back to preview after selection
  }

  const handleCancel = () => {
    setEditModalOpen(false)
    clearSelectedCharts()
  }

  const handleBulkApply = (settings: BulkApplySettings) => {
    if (!editingChart || selectedChartIds.size === 0) return

    const targetFileId = editingChart.fileId || activeFileTab
    const currentFile = openTabs.find(tab => tab.id === targetFileId)
    
    if (!currentFile) return

    const updatedCharts = currentFile.charts.map(chart => {
      // Skip if not selected or if it's the source chart
      if (!selectedChartIds.has(chart.id) || chart.id === editingChart.id) {
        return chart
      }

      let updatedChart = { ...chart }

      if (settings.applyAxisSettings) {
        updatedChart.yMin = editingChart.yMin
        updatedChart.yMax = editingChart.yMax
        updatedChart.yAxisType = editingChart.yAxisType
        updatedChart.showGrid = editingChart.showGrid
      }

      if (settings.applyDisplaySettings) {
        updatedChart.lineWidth = editingChart.lineWidth
        updatedChart.plotType = editingChart.plotType
        updatedChart.stacked = editingChart.stacked
        updatedChart.plotStyle = editingChart.plotStyle
        updatedChart.showDataPoints = editingChart.showDataPoints
        updatedChart.smoothing = editingChart.smoothing
      }

      if (settings.applyReferenceLines) {
        updatedChart.referenceLines = editingChart.referenceLines ? [...editingChart.referenceLines] : []
      }

      if (settings.applyAnnotations) {
        updatedChart.annotations = editingChart.annotations ? [...editingChart.annotations] : []
      }

      if (settings.applyDataSources) {
        updatedChart.yParameters = editingChart.yParameters ? [...editingChart.yParameters] : []
        updatedChart.xParameter = editingChart.xParameter
        updatedChart.xAxisType = editingChart.xAxisType
      }

      return updatedChart
    })

    updateFileCharts(targetFileId, updatedCharts)
    clearSelectedCharts()
  }
  
  const handleTabChange = (newTab: TabType) => {
    // Save current state before switching tabs
    // The editingChart already contains all updated properties including referenceLines
    setActiveTab(newTab)
  }

  const targetFileId = editingChart?.fileId || activeFileTab
  const currentFile = openTabs.find(tab => tab.id === targetFileId)
  const selectedDataSourceItems = currentFile?.selectedDataSources || []
  const allCharts = currentFile?.charts || []
  const currentLayoutSettings = layoutSettingsMap[targetFileId] || {
    columns: 2,
    rows: 2
  }

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


        <div className="grid grid-cols-2 gap-4 flex-1 min-h-0 mt-4">
          {/* Left panel - always show edit controls */}
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

          {/* Right panel - switchable preview/grid */}
          <div className="border rounded-lg p-4 overflow-hidden h-full flex flex-col">
            <div className="flex items-center justify-between border-b pb-2 mb-2 flex-shrink-0">
              <h3 className="text-base font-semibold">
                {previewMode === 'preview' ? 'Chart Preview' : 'All Charts'}
              </h3>
              <div className="flex items-center gap-2">
                {previewMode === 'grid' && selectedChartIds.size > 0 && (
                  <span className="text-xs text-muted-foreground mr-2">
                    {selectedChartIds.size} selected
                  </span>
                )}
                <ToggleGroup type="single" value={previewMode} onValueChange={(value) => value && setPreviewMode(value as 'preview' | 'grid')}>
                  <ToggleGroupItem value="preview" aria-label="Preview mode" size="sm">
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </ToggleGroupItem>
                  <ToggleGroupItem value="grid" aria-label="Grid mode" size="sm">
                    <Grid3x3 className="h-3 w-3 mr-1" />
                    Grid
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            
            <div className="flex-1 min-h-0">
              {previewMode === 'preview' ? (
                <ChartPreview
                  editingChart={editingChart}
                  selectedDataSourceItems={selectedDataSourceItems}
                  setEditingChart={setEditingChart}
                  dataSourceStyles={dataSourceStyles}
                />
              ) : (
                <div className="h-full flex flex-col">
                  {/* Grid controls */}
                  {allCharts.length > 1 && (
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            const allChartIds = allCharts.map(chart => chart.id)
                            useUIStore.getState().selectAllCharts(allChartIds)
                          }}
                          disabled={selectedChartIds.size === allCharts.length}
                        >
                          Select All
                        </Button>
                        {selectedChartIds.size > 0 && (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => clearSelectedCharts()}
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                      {selectedChartIds.size > 0 && (
                        <Button
                          size="xs"
                          onClick={() => setBulkApplyDialogOpen(true)}
                        >
                          Apply to Selected
                        </Button>
                      )}
                    </div>
                  )}
                  
                  {/* Chart grid */}
                  <div className="flex-1 overflow-hidden">
                    <ChartSelectionGrid
                      charts={allCharts}
                      columns={currentLayoutSettings.columns} // Use actual layout columns
                      currentChartId={editingChart.id}
                      selectedChartIds={selectedChartIds}
                      onChartSelect={handleChartSelect}
                      onToggleSelection={toggleChartSelection}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
      
      {/* Bulk Apply Dialog */}
      <BulkApplyDialog
        open={bulkApplyDialogOpen}
        onOpenChange={setBulkApplyDialogOpen}
        selectedChartIds={selectedChartIds}
        currentChart={editingChart}
        allCharts={allCharts}
        onApply={(settings) => handleBulkApply(settings)}
      />
    </Dialog>
  )
}