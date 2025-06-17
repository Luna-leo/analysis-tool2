"use client"

import React, { useEffect } from "react"
import { Sidebar, TabHeader, BreadcrumbNavigation, WelcomeMessage, LayoutSettings } from "../layout"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChartGrid, ChartEditModal, SelectionToolbar } from "../charts"
import { DataSourceStyleDrawer } from "../charts/DataSourceStyleDrawer"
import { DataSourceBadgePreview } from "../charts/DataSourceBadgePreview"
import { TemplateListDialog, SaveTemplateDialog } from "../charts/PlotStyleTemplate"
import { LineChart, Layers, ChevronDown, CheckSquare } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
  
  const { openTabs, activeTab, openFile, fileTree, setActiveTab, toggleFolder, setFileTree, updateFileCharts } = useFileStore()
  const { loadParameters } = useParameterStore()
  const { loadState } = useGraphStateStore()
  const { updateLayoutSettings } = useLayoutStore()
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
          <TabHeader openTabs={openTabs} activeTab={activeTab} />
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
                <div className="px-6 pt-2 pb-0 flex flex-col justify-center min-h-[4.5rem] flex-shrink-0">
                  <div className="space-y-2">
                      <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
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
                            fileId: activeTab
                          })
                          uiStore.setEditModalOpen(true)
                        }}
                        className="h-9 w-24 flex items-center justify-center gap-1.5 rounded-md border border-gray-400 relative"
                      >
                        <LineChart className="h-4 w-4" />
                        <span className="text-sm font-medium">Chart</span>
                        {(!currentFile.charts || currentFile.charts.length === 0) && (
                          <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                          </span>
                        )}
                      </Button>
                      <LayoutSettings fileId={activeTab} />
                      <Button
                        variant={gridSelectionMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => setGridSelectionMode(!gridSelectionMode)}
                        className="h-9 px-3 flex items-center justify-center gap-1.5 rounded-md border border-gray-400"
                        title={gridSelectionMode ? "Exit selection mode" : "Enter selection mode"}
                      >
                        <CheckSquare className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {gridSelectionMode ? `${gridSelectedChartIds.size} Selected` : "Select"}
                        </span>
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 px-3 flex items-center justify-center gap-1.5 rounded-md border border-gray-400"
                          >
                            <Layers className="h-4 w-4" />
                            <span className="text-sm font-medium">Templates</span>
                            <ChevronDown className="h-3 w-3 ml-0.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <DropdownMenuItem onClick={() => setTemplateListOpen(true)}>
                            Browse Templates...
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              // Save current view as template - find the first chart to use as template
                              const firstChart = currentFile.charts?.[0]
                              if (firstChart) {
                                setSaveTemplateOpen(true)
                              } else {
                                toast.error("No chart to save as template")
                              }
                            }}
                            disabled={!currentFile.charts || currentFile.charts.length === 0}
                          >
                            Save Current View as Template
                          </DropdownMenuItem>
                          {templates.length > 0 && (
                            <>
                              <DropdownMenuSeparator />
                              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                Recent Templates
                              </div>
                              {templates.slice(0, 5).map(template => (
                                <DropdownMenuItem 
                                  key={template.id}
                                  onClick={() => {
                                    // Apply template to all charts in current file
                                    if (currentFile.charts && currentFile.charts.length > 0) {
                                      const updatedCharts = currentFile.charts.map(chart => {
                                        const result = PlotStyleApplicator.applyTemplate(chart, template)
                                        return result.updatedChart || chart
                                      })
                                      updateFileCharts(activeTab, updatedCharts)
                                      toast.success(`Applied template "${template.name}" to all charts`)
                                    }
                                  }}
                                >
                                  {template.name}
                                </DropdownMenuItem>
                              ))}
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {/* Selection Toolbar - Inline with other buttons */}
                      {gridSelectionMode && (
                        <div className="flex-1 flex justify-end">
                          <SelectionToolbar fileId={activeTab} />
                        </div>
                      )}
                      </div>
                      {selectedDataSources.length > 0 ? (
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
                    ) : (
                      <div className="text-sm text-muted-foreground italic">
                        データソースを追加してください
                      </div>
                    )}
                    </div>
                  </div>
                )
              }
              return null
            })()}


          {/* Main Content - Scrollable */}
          <div className="flex-1 overflow-auto">
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
      {activeTab && (() => {
        const currentFile = openTabs.find((tab) => tab.id === activeTab)
        if (currentFile && selectedDataSourceInfo.dataSource) {
          return (
            <DataSourceStyleDrawer
              open={styleDrawerOpen}
              onOpenChange={setStyleDrawerOpen}
              dataSource={selectedDataSourceInfo.dataSource}
              dataSourceIndex={selectedDataSourceInfo.index}
              fileId={activeTab}
              currentStyle={(currentFile as any).dataSourceStyles?.[selectedDataSourceInfo.dataSource.id]}
            />
          )
        }
        return null
      })()}
      
      
      {/* Template List Dialog */}
      {activeTab && (() => {
        const currentFile = openTabs.find((tab) => tab.id === activeTab)
        if (currentFile && currentFile.type === 'file') {
          return (
            <>
              <TemplateListDialog
                open={templateListOpen}
                onOpenChange={setTemplateListOpen}
                onSelectTemplate={(template) => {
                  // Apply template to all charts
                  if (currentFile.charts && currentFile.charts.length > 0) {
                    const updatedCharts = currentFile.charts.map(chart => {
                      const result = PlotStyleApplicator.applyTemplate(chart, template)
                      return result.updatedChart || chart
                    })
                    updateFileCharts(activeTab, updatedCharts)
                    toast.success(`Applied template "${template.name}" to all charts`)
                  }
                }}
                hasMultipleCharts={currentFile.charts && currentFile.charts.length > 1}
              />
              
              {/* Save Template Dialog */}
              {currentFile.charts && currentFile.charts.length > 0 && (
                <SaveTemplateDialog
                  open={saveTemplateOpen}
                  onOpenChange={setSaveTemplateOpen}
                  chart={currentFile.charts[0]}
                />
              )}
            </>
          )
        }
        return null
      })()}
    </div>
  )
}