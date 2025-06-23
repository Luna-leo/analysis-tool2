"use client"

import React, { useEffect } from "react"
import { Sidebar, TabHeader, BreadcrumbNavigation, WelcomeMessage } from "../layout"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { ChartGrid, ChartEditModal, SelectionToolbar } from "../charts"
import { DataSourceStyleDrawer } from "../charts/DataSourceStyleDrawer"
import { DataSourceBadgePreview } from "../charts/DataSourceBadgePreview"
import { PerformancePresetPopover } from "../settings/PerformancePresetPopover"
import { TemplateListDialog, SaveTemplateDialog } from "../charts/PlotStyleTemplate"
import { usePlotStyleTemplateStore } from "@/stores/usePlotStyleTemplateStore"
import { PlotStyleApplicator } from "@/utils/plotStyleApplicator"
import { toast } from "sonner"
import { useFileStore } from "@/stores/useFileStore"
import { useParameterStore } from "@/stores/useParameterStore"
import { useGraphStateStore } from "@/stores/useGraphStateStore"
import { useLayoutStore } from "@/stores/useLayoutStore"
import { useUIStore } from "@/stores/useUIStore"
import { useViewStore } from "@/stores/useViewStore"
import { useCSVDataStore } from "@/stores/useCSVDataStore"
import { PerformanceMonitor } from "../PerformanceMonitor"
import { MemoryWarning } from "../MemoryWarning"
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor"
import { optimizeMemory } from "@/utils/memoryOptimization"
import { getDefaultColor } from "@/utils/chartColors"
import type { FileNode, EventInfo } from "@/types"
import type { ChartGridConfig } from "@/types/chart-config"

interface SelectedDataSourceInfo {
  dataSource: EventInfo | null
  index: number
}

export default function AnalysisTool() {
  const [selectedDataSourceInfo, setSelectedDataSourceInfo] = React.useState<SelectedDataSourceInfo>({
    dataSource: null,
    index: 0
  })
  const [styleDrawerOpen, setStyleDrawerOpen] = React.useState(false)
  const [templateListOpen, setTemplateListOpen] = React.useState(false)
  const [saveTemplateOpen, setSaveTemplateOpen] = React.useState(false)
  
  const { openTabs, activeTab, openFile, fileTree, setActiveTab, toggleFolder, setFileTree, updateFileCharts, createNewFile, createNewFileWithConfig, updateFileDataSources } = useFileStore()
  const { loadParameters } = useParameterStore()
  const { loadState } = useGraphStateStore()
  const { updateLayoutSettings, updateChartSettings } = useLayoutStore()
  const { setCurrentPage, gridSelectionMode, setGridSelectionMode, gridSelectedChartIds } = useUIStore()
  const { setActiveView, setSidebarOpen, sidebarOpen } = useViewStore()
  const { loadFromIndexedDB } = useCSVDataStore()
  const { isVisible: isPerformanceMonitorVisible, setIsVisible: setPerformanceMonitorVisible } = usePerformanceMonitor()
  const { templates } = usePlotStyleTemplateStore()
  
  // Memory optimization handler
  const handleMemoryOptimization = async () => {
    const result = await optimizeMemory()
    console.log('Memory optimization result:', result)
    
    // Show a toast or notification with the result
    if (result.freedMemory > 0) {
      console.log(`Freed ${result.freedMemory.toFixed(1)} MB of memory`)
    }
  }
  
  // Handle config import
  const handleConfigImport = (config: ChartGridConfig, mode?: 'overwrite' | 'new-page') => {
    if (!activeTab || mode !== 'overwrite') return
    
    // Apply layout settings
    updateLayoutSettings(activeTab, config.layoutSettings)
    
    // Apply chart settings  
    updateChartSettings(activeTab, config.chartSettings)
    
    // Apply charts
    updateFileCharts(activeTab, config.charts)
    
    // Apply selected data sources if available
    if (config.selectedDataSources) {
      // Find the current file node
      const currentFile = openTabs.find(tab => tab.id === activeTab)
      if (currentFile) {
        // Update the file with selected data sources
        const updatedFile = { ...currentFile, selectedDataSources: config.selectedDataSources }
        // Update in the file tree
        const updateInTree = (nodes: FileNode[]): FileNode[] => {
          return nodes.map(node => {
            if (node.id === activeTab) {
              return updatedFile
            }
            if (node.children) {
              return { ...node, children: updateInTree(node.children) }
            }
            return node
          })
        }
        setFileTree(updateInTree(fileTree))
      }
    }
    
    toast.success('Configuration imported successfully')
  }
  
  // Handle creating new page from config
  const handleCreateNewPage = async (fileName: string, config: ChartGridConfig) => {
    // Generate unique file name if it already exists
    let uniqueFileName = fileName
    let counter = 1
    while (fileTree.some(f => f.name === uniqueFileName && f.type === 'file')) {
      uniqueFileName = `${fileName} (${counter})`
      counter++
    }
    
    // Check if data sources exist in CSV store
    if (config.selectedDataSources && config.selectedDataSources.length > 0) {
      const csvStore = useCSVDataStore.getState()
      const missingDataSources: string[] = []
      
      for (const dataSource of config.selectedDataSources) {
        const hasData = await csvStore.hasData(dataSource.id)
        if (!hasData) {
          missingDataSources.push(dataSource.label)
          console.warn(`Data source not found: ${dataSource.label}`)
        }
      }
      
      if (missingDataSources.length > 0) {
        toast.warning(`Some data sources are not available: ${missingDataSources.join(', ')}. Please import the CSV data first.`)
      }
    }
    
    // Create new file with config using the store method
    const fileStore = useFileStore.getState()
    
    // Use createNewFileWithConfig which properly handles chart assignment
    fileStore.createNewFileWithConfig(null, uniqueFileName, {
      charts: config.charts,
      selectedDataSources: config.selectedDataSources
    })
    
    // Get the newly created file from the current state
    const updatedFileTree = useFileStore.getState().fileTree
    const newFile = updatedFileTree.find((f: FileNode) => f.name === uniqueFileName && f.type === 'file')
    
    if (newFile) {
      // Apply layout and chart settings
      await updateLayoutSettings(newFile.id, config.layoutSettings)
      await updateChartSettings(newFile.id, config.chartSettings)
      
      // Open the file immediately
      openFile(newFile)
      
      toast.success(`Created new page "${uniqueFileName}" with imported configuration`)
    } else {
      toast.error('Failed to create new page')
    }
  }
  
  // Helper function to find a node in the file tree
  const findNodeInTree = (nodeId: string, nodes: FileNode[]): FileNode | undefined => {
    for (const node of nodes) {
      if (node.id === nodeId) return node
      if (node.children) {
        const found = findNodeInTree(nodeId, node.children)
        if (found) return found
      }
    }
    return undefined
  }

  useEffect(() => {
    // Load parameters on mount
    loadParameters()
    
    // Load CSV data from IndexedDB
    loadFromIndexedDB()
    
    // Try to restore saved state
    const savedState = loadState()
    
    
    if (savedState) {
      // Restore file tree
      if (savedState.fileTree && savedState.fileTree.length > 0) {
        setFileTree(savedState.fileTree)
      } else if (savedState.tabs && savedState.tabs.length > 0) {
        // If no fileTree but we have tabs, reconstruct fileTree from tabs
        const reconstructedTree: FileNode[] = []
        const folderMap = new Map<string, FileNode>()
        
        savedState.tabs.forEach(tab => {
          // Skip special tabs that aren't files
          if (tab.type !== 'file') return
          
          // Create or get parent folder
          let parentFolder = folderMap.get('default')
          if (!parentFolder) {
            parentFolder = {
              id: 'default',
              name: 'Restored Files',
              type: 'folder',
              children: []
            }
            folderMap.set('default', parentFolder)
            reconstructedTree.push(parentFolder)
          }
          
          // Add file to folder
          if (parentFolder.children && !parentFolder.children.find(child => child.id === tab.id)) {
            parentFolder.children.push({
              id: tab.id,
              name: tab.name,
              type: 'file',
              charts: tab.charts,
              dataSources: tab.dataSources
            })
          }
        })
        
        if (reconstructedTree.length > 0) {
          setFileTree(reconstructedTree)
        }
      }
      
      // Restore tabs
      if (savedState.tabs && savedState.tabs.length > 0) {
        // Open all saved tabs with their saved charts data
        const restoredFileTree = savedState.fileTree || fileTree
        savedState.tabs.forEach(tab => {
          // If the tab has saved charts, use them instead of the default from fileTree
          const fileFromTree = findNodeInTree(tab.id, restoredFileTree)
          
          if (fileFromTree) {
            // Use saved charts if available, otherwise use fileTree charts
            const fileWithSavedCharts = {
              ...fileFromTree,
              charts: tab.charts || fileFromTree.charts
            }
            openFile(fileWithSavedCharts, tab.source)
          } else {
            // File not in tree (maybe special tabs), use the saved tab directly
            openFile(tab, tab.source)
          }
        })
        
        // Set active tab
        if (savedState.activeTab) {
          setActiveTab(savedState.activeTab)
        }
      }
      
      // Restore layout settings
      if (savedState.layoutSettings) {
        Object.entries(savedState.layoutSettings).forEach(([fileId, settings]) => {
          updateLayoutSettings(fileId, settings)
        })
      }
      
      // Restore chart settings
      if (savedState.chartSettings) {
        Object.entries(savedState.chartSettings).forEach(([fileId, settings]) => {
          updateChartSettings(fileId, settings)
        })
      }
      
      // Restore UI state
      if (savedState.uiState) {
        setCurrentPage(savedState.uiState.currentPage)
        setSidebarOpen(savedState.uiState.sidebarOpen)
        setActiveView(savedState.uiState.activeView)
        
        // Restore expanded folders
        if (savedState.uiState.expandedFolders) {
          savedState.uiState.expandedFolders.forEach(folderId => {
            toggleFolder(folderId)
          })
        }
      }
    }
  }, []) // Empty dependency array to run only once on mount

  return (
    <div className="h-screen flex">
      {/* Sidebar - Fixed position */}
      <div className={cn(
        "h-full border-r transition-all duration-200 flex-shrink-0",
        sidebarOpen ? "w-[270px]" : "w-14"
      )}>
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Tab Header - Fixed at top */}
        <div className="flex-shrink-0">
          <TabHeader 
            openTabs={openTabs} 
            activeTab={activeTab}
            onChartClick={() => {
              if (!activeTab) return
              const currentFile = openTabs.find((tab) => tab.id === activeTab)
              const isGraphPage = (currentFile as any)?.charts || (currentFile as any)?.dataSources
              if (!isGraphPage) return
              
              const uiStore = useUIStore.getState()
              uiStore.setEditingChart({
                id: `chart_${Date.now()}`,
                title: "新しいチャート",
                type: "scatter",
                showMarkers: true,
                showLines: false,
                xAxisType: "datetime",
                xParameter: "timestamp",
                data: [],
                referenceLines: [],
                fileId: activeTab,
                // Initialize plotStyles with default values
                plotStyles: {
                  mode: 'datasource',
                  byDataSource: {},
                  byParameter: {},
                  byBoth: {}
                }
              })
              uiStore.setEditModalOpen(true)
            }}
            onSelectClick={() => setGridSelectionMode(!gridSelectionMode)}
            onTemplateAction={(action) => {
              if (!activeTab) return
              const currentFile = openTabs.find((tab) => tab.id === activeTab)
              
              if (action === "browse") {
                setTemplateListOpen(true)
              } else if (action === "save") {
                const firstChart = (currentFile as any)?.charts?.[0]
                if (firstChart) {
                  setSaveTemplateOpen(true)
                } else {
                  toast.error("No chart to save as template")
                }
              } else if (action.startsWith("apply:")) {
                const templateId = action.replace("apply:", "")
                const template = templates.find(t => t.id === templateId)
                if (template && (currentFile as any)?.charts?.length > 0) {
                  const updatedCharts = (currentFile as any).charts.map((chart: any) => {
                    const result = PlotStyleApplicator.applyTemplate(chart, template)
                    return result.updatedChart || chart
                  })
                  updateFileCharts(activeTab, updatedCharts)
                  toast.success(`Applied template "${template.name}" to all charts`)
                }
              }
            }}
            gridSelectionMode={gridSelectionMode}
            selectedCount={gridSelectedChartIds.size}
            showActionButtons={activeTab ? (() => {
              const currentFile = openTabs.find((tab) => tab.id === activeTab)
              return (currentFile as any)?.charts || (currentFile as any)?.dataSources
            })() : false}
            onConfigImport={handleConfigImport}
            onCreateNewPage={handleCreateNewPage}
          />
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeTab && openTabs.find((tab) => tab.id === activeTab) && (
            <div className="flex-shrink-0">
              <BreadcrumbNavigation activeTab={activeTab} openTabs={openTabs} />
            </div>
          )}
            
          {/* Data Sources Legend - Fixed */}
          {activeTab && (() => {
            const currentFile = openTabs.find((tab) => tab.id === activeTab)
            if (!currentFile) return null
            
            const isGraphPage = (currentFile as any).charts || (currentFile as any).dataSources
            const selectedDataSources = (currentFile as any).selectedDataSources || []
            
            if (isGraphPage) {
              return (
                <div className="px-6 pt-2 pb-0 flex flex-col justify-center flex-shrink-0">
                  <div className="space-y-2">
                      {selectedDataSources.length > 0 ? (
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {selectedDataSources.map((source: any, index: number) => {
                          // Check if all charts have plotStyles.mode === 'datasource'
                          const charts = (currentFile as any).charts || []
                          const allChartsDataSourceMode = charts.length > 0 && 
                            charts.every((chart: any) => {
                              // Same logic as ChartLegend component
                              const mode = chart.plotStyles?.mode || chart.legendMode || 'datasource'
                              return mode === 'datasource'
                            })
                          
                          // Get plot style from first chart if all are in datasource mode
                          let plotStyle = undefined
                          if (allChartsDataSourceMode && charts[0]?.plotStyles?.byDataSource?.[source.id]) {
                            plotStyle = charts[0].plotStyles.byDataSource[source.id]
                          }
                          
                          return (
                            <Badge 
                              key={source.id} 
                              variant="secondary" 
                              className="text-xs cursor-pointer bg-white hover:bg-gray-50 transition-all pl-2 pr-3 py-1 rounded-full border border-gray-400"
                              onClick={() => {
                                setSelectedDataSourceInfo({ dataSource: source, index })
                                setStyleDrawerOpen(true)
                              }}
                            >
                              <div className="flex items-center gap-1">
                                <DataSourceBadgePreview
                                  dataSourceStyle={(currentFile as any).dataSourceStyles?.[source.id]}
                                  defaultColor={getDefaultColor(index)}
                                  plotStyle={plotStyle}
                                  showStylePreview={allChartsDataSourceMode}
                                />
                                <span className="font-medium text-black">{source.label}</span>
                              </div>
                            </Badge>
                          )
                          })}
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Performance Preset Button */}
                          <PerformancePresetPopover />
                          {/* Selection Toolbar - Same line as Data Sources */}
                          {gridSelectionMode && (
                            <SelectionToolbar fileId={activeTab} />
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm text-muted-foreground italic">
                          データソースを追加してください
                        </div>
                        <div className="flex items-center gap-2">
                          <PerformancePresetPopover />
                          {gridSelectionMode && (
                            <SelectionToolbar fileId={activeTab} />
                          )}
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                )
              }
              return null
            })()}


          {/* Main Content - Scrollable */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {activeTab && openTabs.find((tab) => tab.id === activeTab) ? (
              <ChartGrid file={openTabs.find((tab) => tab.id === activeTab)!} />
            ) : (
              <WelcomeMessage />
            )}
          </div>
        </div>
        
      </div>
      
      {/* Chart Edit Modal */}
      <ChartEditModal />
      
      {/* Performance Monitor */}
      <PerformanceMonitor 
        isVisible={isPerformanceMonitorVisible} 
        onClose={() => setPerformanceMonitorVisible(false)} 
      />
      
      {/* Memory Warning */}
      <MemoryWarning 
        threshold={80} 
        onOptimize={handleMemoryOptimization}
      />
      
      {/* Data Source Style Drawer */}
      {(() => {
        const currentFile = activeTab ? openTabs.find((tab) => tab.id === activeTab) : null
        const hasDataSource = currentFile && selectedDataSourceInfo.dataSource
        
        return (
          <DataSourceStyleDrawer
            open={styleDrawerOpen && !!hasDataSource}
            onOpenChange={setStyleDrawerOpen}
            dataSource={selectedDataSourceInfo.dataSource || null}
            dataSourceIndex={selectedDataSourceInfo.index}
            fileId={activeTab || ''}
            currentStyle={hasDataSource && selectedDataSourceInfo.dataSource ? (currentFile as any).dataSourceStyles?.[selectedDataSourceInfo.dataSource.id] : undefined}
          />
        )
      })()}
      
      
      {/* Template List Dialog - Always render but control visibility */}
      {(() => {
        const currentFile = activeTab ? openTabs.find((tab) => tab.id === activeTab) : null
        const isFileType = currentFile && currentFile.type === 'file'
        const hasCharts = currentFile?.charts && currentFile.charts.length > 0
        
        return (
          <>
            <TemplateListDialog
              open={templateListOpen && !!isFileType}
              onOpenChange={setTemplateListOpen}
              onSelectTemplate={(template) => {
                // Apply template to all charts
                if (currentFile && currentFile.charts && currentFile.charts.length > 0) {
                  const updatedCharts = currentFile.charts.map(chart => {
                    const result = PlotStyleApplicator.applyTemplate(chart, template)
                    return result.updatedChart || chart
                  })
                  updateFileCharts(activeTab || '', updatedCharts)
                  toast.success(`Applied template "${template.name}" to all charts`)
                }
              }}
              hasMultipleCharts={currentFile?.charts && currentFile.charts.length > 1}
            />
            
            {/* Save Template Dialog - Always render but control visibility with open prop */}
            <SaveTemplateDialog
              open={saveTemplateOpen && !!hasCharts}
              onOpenChange={setSaveTemplateOpen}
              chart={hasCharts && currentFile?.charts ? currentFile.charts[0] : undefined}
            />
          </>
        )
      })()}
    </div>
  )
}