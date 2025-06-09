import { create } from 'zustand'
import { useViewStore } from './useViewStore'
import { useFileStore } from './useFileStore'
import { useLayoutStore } from './useLayoutStore'
import { useUIStore } from './useUIStore'
import type { ActiveView, FileNode, LayoutSettings, ChartSettings, ChartComponent } from '@/types'

// Re-export individual stores
export { useViewStore } from './useViewStore'
export { useFileStore } from './useFileStore'
export { useLayoutStore } from './useLayoutStore'
export { useUIStore } from './useUIStore'

// Legacy interface for backward compatibility
interface AnalysisState {
  // View State
  activeView: ActiveView
  sidebarOpen: boolean
  
  // File State
  fileTree: FileNode[]
  openTabs: FileNode[]
  activeTab: string
  expandedFolders: Set<string>
  renamingNode: string | null
  creatingNodeType: "folder" | "file" | null
  creatingNodeParentId: string | null
  draggedNode: string | null
  dragOverNode: string | null
  dragPosition: "before" | "after" | "inside" | null
  
  // Layout State
  layoutSettingsMap: Record<string, LayoutSettings>
  chartSettingsMap: Record<string, ChartSettings>
  
  // UI State
  currentPage: number
  hoveredChart: string | null
  editingChart: ChartComponent | null
  editModalOpen: boolean
  draggedTab: string | null
  dragOverTab: string | null
}

interface AnalysisActions {
  // View Actions
  setActiveView: (view: ActiveView) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  
  // File Actions
  openFile: (file: FileNode) => void
  closeTab: (fileId: string) => void
  setActiveTab: (tabId: string) => void
  toggleFolder: (folderId: string) => void
  reorderTabs: (draggedId: string, targetId: string) => void
  setFileTree: (fileTree: FileNode[]) => void
  renameNode: (nodeId: string, newName: string) => void
  setRenamingNode: (nodeId: string | null) => void
  createNewFolder: (parentId: string | null, name: string) => void
  createNewFile: (parentId: string | null, name: string) => void
  setCreatingNode: (type: "folder" | "file" | null, parentId: string | null) => void
  moveNode: (nodeId: string, targetId: string | null, position: "before" | "after" | "inside") => void
  setDraggedNode: (nodeId: string | null) => void
  setDragOverNode: (nodeId: string | null, position: "before" | "after" | "inside" | null) => void
  
  // Layout Actions
  updateLayoutSettings: (fileId: string, settings: Partial<LayoutSettings>) => void
  updateChartSettings: (fileId: string, settings: Partial<ChartSettings>) => void
  
  // UI Actions
  setCurrentPage: (page: number) => void
  setHoveredChart: (chartId: string | null) => void
  setEditingChart: (chart: ChartComponent | null) => void
  setEditModalOpen: (open: boolean) => void
  setDraggedTab: (tabId: string | null) => void
  setDragOverTab: (tabId: string | null) => void
}

export type AnalysisStore = AnalysisState & AnalysisActions

// Legacy hook that combines all stores for backward compatibility
// Note: This uses a custom hook approach to ensure reactivity
export const useAnalysisStore = (): AnalysisStore => {
  const viewStore = useViewStore()
  const fileStore = useFileStore()
  const layoutStore = useLayoutStore()
  const uiStore = useUIStore()

  return {
    // View State
    activeView: viewStore.activeView,
    sidebarOpen: viewStore.sidebarOpen,
    
    // File State
    fileTree: fileStore.fileTree,
    openTabs: fileStore.openTabs,
    activeTab: fileStore.activeTab,
    expandedFolders: fileStore.expandedFolders,
    renamingNode: fileStore.renamingNode,
    creatingNodeType: fileStore.creatingNodeType,
    creatingNodeParentId: fileStore.creatingNodeParentId,
    draggedNode: fileStore.draggedNode,
    dragOverNode: fileStore.dragOverNode,
    dragPosition: fileStore.dragPosition,
    draggedTab: fileStore.draggedTab,
    dragOverTab: fileStore.dragOverTab,
    
    // Layout State
    layoutSettingsMap: layoutStore.layoutSettingsMap,
    chartSettingsMap: layoutStore.chartSettingsMap,
    
    // UI State
    currentPage: uiStore.currentPage,
    hoveredChart: uiStore.hoveredChart,
    editingChart: uiStore.editingChart,
    editModalOpen: uiStore.editModalOpen,

    // View Actions
    setActiveView: viewStore.setActiveView,
    toggleSidebar: viewStore.toggleSidebar,
    setSidebarOpen: viewStore.setSidebarOpen,
    
    // File Actions
    openFile: (file) => {
      fileStore.openFile(file)
      uiStore.setCurrentPage(1)
      // Initialize layout settings for new file
      layoutStore.initializeSettings(file.id)
    },
    closeTab: fileStore.closeTab,
    setActiveTab: (tabId) => {
      fileStore.setActiveTab(tabId)
      uiStore.setCurrentPage(1)
    },
    toggleFolder: fileStore.toggleFolder,
    reorderTabs: fileStore.reorderTabs,
    setFileTree: fileStore.setFileTree,
    renameNode: fileStore.renameNode,
    setRenamingNode: fileStore.setRenamingNode,
    createNewFolder: fileStore.createNewFolder,
    createNewFile: fileStore.createNewFile,
    setCreatingNode: fileStore.setCreatingNode,
    moveNode: fileStore.moveNode,
    setDraggedNode: fileStore.setDraggedNode,
    setDragOverNode: fileStore.setDragOverNode,
    setDraggedTab: fileStore.setDraggedTab,
    setDragOverTab: fileStore.setDragOverTab,
    
    // Layout Actions
    updateLayoutSettings: layoutStore.updateLayoutSettings,
    updateChartSettings: layoutStore.updateChartSettings,
    
    // UI Actions
    setCurrentPage: uiStore.setCurrentPage,
    setHoveredChart: uiStore.setHoveredChart,
    setEditingChart: uiStore.setEditingChart,
    setEditModalOpen: uiStore.setEditModalOpen,
  }
}