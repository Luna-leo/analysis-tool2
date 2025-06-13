"use client"

import React, { useEffect } from "react"
import { Sidebar, TabHeader, BreadcrumbNavigation, WelcomeMessage } from "../layout"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ChartGrid, ChartEditModal } from "../charts"
import { DataSourceStyleDrawer } from "../charts/DataSourceStyleDrawer"
import { DataSourceBadgePreview } from "../charts/DataSourceBadgePreview"
import { DataSourceModal } from "../charts/DataSourceModal"
import { LineChart, DatabaseIcon } from "lucide-react"
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
import type { FileNode } from "@/types"

export default function AnalysisTool() {
  const [selectedDataSource, setSelectedDataSource] = React.useState<any>(null)
  const [styleDrawerOpen, setStyleDrawerOpen] = React.useState(false)
  const [dataSourceModalOpen, setDataSourceModalOpen] = React.useState(false)
  
  const { openTabs, activeTab, openFile, fileTree, setActiveTab, toggleFolder, setFileTree } = useFileStore()
  const { loadParameters } = useParameterStore()
  const { loadState } = useGraphStateStore()
  const { updateLayoutSettings } = useLayoutStore()
  const { setCurrentPage } = useUIStore()
  const { setActiveView, setSidebarOpen, sidebarOpen } = useViewStore()
  const { loadFromIndexedDB } = useCSVDataStore()
  const { isVisible: isPerformanceMonitorVisible, setIsVisible: setPerformanceMonitorVisible } = usePerformanceMonitor()
  
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
    <div className="h-screen flex flex-col">
      <div className="flex flex-1 min-h-0">
        {/* Sidebar - Always visible but width changes */}
        <div className={cn(
          "border-r transition-all duration-200",
          sidebarOpen ? "w-[270px]" : "w-14"
        )}>
          <Sidebar />
        </div>

        {/* Main Content Panel */}
        <div className="flex-1 flex flex-col min-w-0">{/* Replace ResizablePanel with div */}
          <div className="flex flex-col flex-1">
            <TabHeader openTabs={openTabs} activeTab={activeTab} />

            {activeTab && openTabs.find((tab) => tab.id === activeTab) && (
              <BreadcrumbNavigation activeTab={activeTab} openTabs={openTabs} />
            )}
            
            {/* Data Sources Legend */}
            {activeTab && (() => {
              const currentFile = openTabs.find((tab) => tab.id === activeTab)
              if (!currentFile) return null
              
              const isGraphPage = (currentFile as any).charts || (currentFile as any).dataSources
              const selectedDataSources = (currentFile as any).selectedDataSources || []
              
              if (isGraphPage) {
                return (
                  <div className="px-6 py-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDataSourceModalOpen(true)}
                        title="Data Source Settings"
                        className="h-8 w-20 flex items-center justify-center gap-1.5 rounded-md border border-gray-400"
                      >
                        <DatabaseIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">Data</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const uiStore = useUIStore.getState()
                          uiStore.setEditingChart({
                            id: `chart_${Date.now()}`,
                            title: "新しいチャート",
                            data: [],
                            referenceLines: [],
                            fileId: activeTab
                          })
                          uiStore.setEditModalOpen(true)
                        }}
                        className="h-8 w-20 flex items-center justify-center gap-1.5 rounded-md border border-gray-400"
                      >
                        <LineChart className="h-4 w-4" />
                        <span className="text-sm font-medium">Chart</span>
                      </Button>
                    </div>
                    {selectedDataSources.length > 0 ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        {selectedDataSources.map((source: any, index: number) => (
                          <Badge 
                            key={source.id} 
                            variant="secondary" 
                            className="text-xs cursor-pointer bg-white hover:bg-gray-50 transition-all pl-2 pr-3 py-1 rounded-full border border-gray-400"
                            onClick={() => {
                              setSelectedDataSource(source)
                              setStyleDrawerOpen(true)
                            }}
                          >
                            <div className="flex items-center gap-1">
                              <DataSourceBadgePreview
                                dataSourceStyle={(currentFile as any).dataSourceStyles?.[source.id]}
                                defaultColor={getDefaultColor(source.id, index)}
                              />
                              <span className="font-medium text-black">{source.label}</span>
                            </div>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">
                        データソースを追加してください
                      </div>
                    )}
                  </div>
                )
              }
              return null
            })()}


            {/* Main Content */}
            <div className="flex-1 min-h-0 relative">
              {activeTab && openTabs.find((tab) => tab.id === activeTab) ? (
                <ChartGrid file={openTabs.find((tab) => tab.id === activeTab)!} />
              ) : (
                <WelcomeMessage />
              )}
            </div>
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
        if (currentFile && selectedDataSource) {
          return (
            <DataSourceStyleDrawer
              open={styleDrawerOpen}
              onOpenChange={setStyleDrawerOpen}
              dataSource={selectedDataSource}
              fileId={activeTab}
              currentStyle={(currentFile as any).dataSourceStyles?.[selectedDataSource.id]}
            />
          )
        }
        return null
      })()}
      
      {/* Data Source Modal */}
      {activeTab && (() => {
        const currentFile = openTabs.find((tab) => tab.id === activeTab)
        if (currentFile && ((currentFile as any).charts || (currentFile as any).dataSources)) {
          return (
            <DataSourceModal
              open={dataSourceModalOpen}
              onOpenChange={setDataSourceModalOpen}
              file={currentFile}
            />
          )
        }
        return null
      })()}
    </div>
  )
}

// Helper function to get default color for data source
const defaultColors = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // yellow
  "#8b5cf6", // purple
  "#06b6d4", // cyan
  "#f97316", // orange
  "#ec4899", // pink
]

const getDefaultColor = (_dataSourceId: string, index: number) => {
  // Use index for consistent color
  return defaultColors[index % defaultColors.length]
}