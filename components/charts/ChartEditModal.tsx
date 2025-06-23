"use client"

import React, { useState, useMemo } from "react"
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
import { Grid3x3, Eye, CheckSquare, X, Settings2 } from "lucide-react"
import type { EventInfo, ChartComponent } from "@/types"
import { BulkApplyDialog, BulkApplySettings } from "./EditModal/BulkApplyDialog"
import { SaveTemplateDialog, TemplateListDialog } from "./PlotStyleTemplate"
import { PlotStyleTemplate } from "@/types/plot-style-template"
import { PlotStyleApplicator } from "@/utils/plotStyleApplicator"
import { toast } from "sonner"

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
  const { layoutSettingsMap, chartSettingsMap } = useLayoutStore()
  const [activeTab, setActiveTab] = useState<TabType>("datasource")
  const [dataSourceStyles, setDataSourceStyles] = useState<{ [dataSourceId: string]: any }>({})
  const [previewMode, setPreviewMode] = useState<'preview' | 'grid'>('preview')
  const [bulkApplyDialogOpen, setBulkApplyDialogOpen] = useState(false)
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false)
  const [showTemplateListDialog, setShowTemplateListDialog] = useState(false)

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

  // Get the target file ID for this chart (before early return to maintain hooks order)
  const targetFileId = editingChart?.fileId || activeFileTab
  const currentFile = openTabs.find(tab => tab.id === targetFileId)
  
  // Create a version of allCharts that includes the current editing state
  // This must be called before any conditional returns to maintain hooks order
  const allChartsWithEditing = useMemo(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] allChartsWithEditing calculation:', {
        hasCurrentFile: !!currentFile,
        hasCharts: !!currentFile?.charts,
        chartsLength: currentFile?.charts?.length,
        hasEditingChart: !!editingChart,
        editingChartId: editingChart?.id,
        editingChartTitle: editingChart?.title,
        targetFileId,
        currentFileId: currentFile?.id
      })
    }
    
    if (!currentFile?.charts || !editingChart) return []
    
    const result = currentFile.charts.map(chart => {
      const isMatch = chart.id === editingChart.id
      if (isMatch) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[DEBUG] Updating chart:', {
            chartId: chart.id,
            oldTitle: chart.title,
            newTitle: editingChart.title
          })
        }
      }
      return isMatch ? { ...editingChart } : chart
    })
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG] allChartsWithEditing result:', result.map(c => ({ id: c.id, title: c.title })))
    }
    
    return result
  }, [
    currentFile?.charts, 
    editingChart,
    // Include display-related properties explicitly to ensure re-computation
    editingChart?.title,
    editingChart?.showTitle,
    editingChart?.showGrid,
    editingChart?.showXLabel,
    editingChart?.showYLabel,
    editingChart?.showLegend
  ])

  if (!editingChart) return null
  
  // Debug logging for fileId issues
  if (!editingChart.fileId) {
    console.warn('[ChartEditModal] Chart missing fileId:', {
      chartId: editingChart.id,
      chartTitle: editingChart.title,
      activeFileTab,
      usingFallback: true
    })
  }

  const handleSave = (closeModal = true) => {
    // Find the current file based on fileId from editingChart
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
      
      // Debug log for reference lines
      if (process.env.NODE_ENV === 'development' && updatedChart.referenceLines?.length) {
        console.log('[ChartEditModal] Saving chart with Reference Lines:', {
          chartId: updatedChart.id,
          referenceLines: updatedChart.referenceLines
        })
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

  const handleChartDoubleClick = (chart: ChartComponent, index: number) => {
    handleChartSelect(chart, index)
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

    const updatedCharts = (currentFile.charts || []).map(chart => {
      // Skip if not selected or if it's the source chart
      if (!selectedChartIds.has(chart.id) || chart.id === editingChart.id) {
        return chart
      }

      let updatedChart = { ...chart }

      if (settings.applyAxisSettings) {
        // Copy Y-axis settings from each parameter
        if (editingChart.yAxisParams) {
          updatedChart.yAxisParams = chart.yAxisParams?.map((param, index) => {
            const sourceParam = editingChart.yAxisParams?.[index]
            if (sourceParam) {
              return {
                ...param,
                range: sourceParam.range ? { ...sourceParam.range } : param.range
              }
            }
            return param
          }) || []
        }
        
        // Copy grid and axis settings
        updatedChart.showGrid = editingChart.showGrid
        updatedChart.xAxisTicks = editingChart.xAxisTicks
        updatedChart.yAxisTicks = editingChart.yAxisTicks
        updatedChart.xAxisTickPrecision = editingChart.xAxisTickPrecision
        updatedChart.yAxisTickPrecision = editingChart.yAxisTickPrecision
        updatedChart.showXLabel = editingChart.showXLabel
        updatedChart.showYLabel = editingChart.showYLabel
        updatedChart.xLabelOffset = editingChart.xLabelOffset
        updatedChart.yLabelOffset = editingChart.yLabelOffset
      }

      if (settings.applyDisplaySettings) {
        // Copy basic display settings
        updatedChart.type = editingChart.type
        updatedChart.showMarkers = editingChart.showMarkers
        updatedChart.showLines = editingChart.showLines
        updatedChart.showTitle = editingChart.showTitle
        updatedChart.showLegend = editingChart.showLegend
        updatedChart.legendPosition = editingChart.legendPosition ? { ...editingChart.legendPosition } : undefined
        updatedChart.legendMode = editingChart.legendMode
        updatedChart.dataSourceLegends = editingChart.dataSourceLegends ? { ...editingChart.dataSourceLegends } : undefined
        
        // Copy plot styles (very important for appearance)
        if (editingChart.plotStyles) {
          updatedChart.plotStyles = {
            mode: editingChart.plotStyles.mode,
            byDataSource: editingChart.plotStyles.byDataSource ? { ...editingChart.plotStyles.byDataSource } : undefined,
            byParameter: editingChart.plotStyles.byParameter ? { ...editingChart.plotStyles.byParameter } : undefined,
            byBoth: editingChart.plotStyles.byBoth ? { ...editingChart.plotStyles.byBoth } : undefined
          }
        }
        
        // Copy margins
        updatedChart.margins = editingChart.margins ? { ...editingChart.margins } : undefined
      }

      if (settings.applyReferenceLines) {
        updatedChart.referenceLines = editingChart.referenceLines ? [...editingChart.referenceLines] : []
      }

      if (settings.applyAnnotations) {
        // Note: annotations property doesn't exist in ChartComponent type
        // This might need to be handled differently or removed
      }

      if (settings.applyDataSources) {
        updatedChart.yAxisParams = editingChart.yAxisParams ? 
          editingChart.yAxisParams.map(param => ({ ...param })) : []
        updatedChart.xParameter = editingChart.xParameter
        updatedChart.xAxisType = editingChart.xAxisType
        updatedChart.xAxisRange = editingChart.xAxisRange ? { ...editingChart.xAxisRange } : undefined
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

  const selectedDataSourceItems = currentFile?.selectedDataSources || []
  const allCharts = currentFile?.charts || []
  const currentLayoutSettings = layoutSettingsMap[targetFileId] || {
    columns: 2,
    rows: 2
  }

  const handleSetSelectedDataSourceItems = (items: React.SetStateAction<EventInfo[]>) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[ChartEditModal] handleSetSelectedDataSourceItems called:', {
        targetFileId,
        editingChartId: editingChart.id,
        editingChartFileId: editingChart.fileId,
        itemsType: typeof items,
        itemsCount: Array.isArray(items) ? items.length : 'function'
      })
    }
    
    if (typeof items === 'function') {
      const newItems = items(selectedDataSourceItems)
      updateFileDataSources(targetFileId, newItems)
    } else {
      updateFileDataSources(targetFileId, items)
    }
  }

  const handleTemplateSelect = (template: PlotStyleTemplate) => {
    const result = PlotStyleApplicator.applyTemplate(editingChart, template)
    if (result.applied && result.updatedChart) {
      setEditingChart(result.updatedChart)
      toast.success(`Applied template "${template.name}"`)
    } else {
      toast.error("Failed to apply template")
    }
    setShowTemplateListDialog(false)
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
          onSaveAsTemplate={() => setShowSaveTemplateDialog(true)}
          onApplyTemplate={() => setShowTemplateListDialog(true)}
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
                  <>
                    <span className="text-xs text-muted-foreground mr-2">
                      {selectedChartIds.size} selected
                    </span>
                    {selectedChartIds.size === 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const selectedId = Array.from(selectedChartIds)[0]
                          const selectedChart = allCharts.find(c => c.id === selectedId)
                          if (selectedChart) {
                            const index = allCharts.findIndex(c => c.id === selectedId)
                            handleChartSelect(selectedChart, index)
                          }
                        }}
                      >
                        View Selected
                      </Button>
                    )}
                  </>
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
                  enableZoom={true}
                  enablePan={true}
                  zoomMode="auto"
                />
              ) : (
                <div className="h-full flex flex-col">
                  {/* Grid controls */}
                  {allCharts.length > 1 && (
                    <div className="mb-3 flex flex-col gap-2">
                      {/* Selection controls */}
                      <div className="flex items-center justify-between bg-muted/30 rounded-lg p-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-muted-foreground">Selection:</span>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const allChartIds = allCharts.map(chart => chart.id)
                                useUIStore.getState().selectAllCharts(allChartIds)
                              }}
                              disabled={selectedChartIds.size === allCharts.length}
                              className="gap-1.5"
                              title="Select all charts (Ctrl+A)"
                            >
                              <CheckSquare className="h-3.5 w-3.5" />
                              Select All
                            </Button>
                            {selectedChartIds.size > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => clearSelectedCharts()}
                                className="gap-1.5"
                                title="Clear selection (Escape)"
                              >
                                <X className="h-3.5 w-3.5" />
                                Clear
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {selectedChartIds.size > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {selectedChartIds.size} of {allCharts.length} selected
                            </span>
                            <Button
                              size="sm"
                              onClick={() => setBulkApplyDialogOpen(true)}
                              className="gap-1.5"
                              title="Apply current chart settings to selected charts"
                            >
                              <Settings2 className="h-3.5 w-3.5" />
                              Apply Settings
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Help text */}
                  {selectedChartIds.size === 0 && previewMode === 'grid' && (
                    <p className="text-xs text-muted-foreground text-center mb-2">
                      Click to select charts • Double-click to view
                    </p>
                  )}
                  
                  {/* Chart grid */}
                  <div className="flex-1 overflow-hidden">
                    {(() => {
                      if (process.env.NODE_ENV === 'development') {
                        console.log('[DEBUG] Passing to ChartSelectionGrid:', {
                          chartsLength: allChartsWithEditing.length,
                          charts: allChartsWithEditing.map(c => ({ id: c.id, title: c.title })),
                          currentChartId: editingChart.id,
                          previewMode
                        })
                      }
                      return null
                    })()}
                    <ChartSelectionGrid
                      charts={allChartsWithEditing}
                      columns={currentLayoutSettings.columns} // Use actual layout columns
                      currentChartId={editingChart.id}
                      selectedChartIds={selectedChartIds}
                      onChartSelect={handleChartDoubleClick}
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
        allCharts={allChartsWithEditing}
        onApply={(settings) => handleBulkApply(settings)}
      />
      
      {/* Template Dialogs */}
      <SaveTemplateDialog
        open={showSaveTemplateDialog}
        onOpenChange={setShowSaveTemplateDialog}
        chart={editingChart}
      />
      
      <TemplateListDialog
        open={showTemplateListDialog}
        onOpenChange={setShowTemplateListDialog}
        onSelectTemplate={handleTemplateSelect}
        hasMultipleCharts={allCharts.length > 1}
      />
    </Dialog>
  )
}