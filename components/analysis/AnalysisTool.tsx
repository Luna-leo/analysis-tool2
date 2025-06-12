"use client"

import React, { useEffect } from "react"
import { Sidebar, TabHeader, BreadcrumbNavigation, WelcomeMessage } from "../layout"
import { cn } from "@/lib/utils"
import { ChartGrid, ChartEditModal } from "../charts"
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
    </div>
  )
}