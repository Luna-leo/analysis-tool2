import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ActiveView, FileNode, LayoutSettings, ChartSettings, ChartComponent } from '@/types'
import { mockFileTree } from '@/data/mockData'

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

const defaultLayoutSettings: LayoutSettings = {
  showFileName: true,
  showDataSources: true,
  columns: 2,
  rows: 2,
  pagination: true,
}

const defaultChartSettings: ChartSettings = {
  showLegend: true,
  showXAxis: true,
  showYAxis: true,
  showGrid: true,
}

export const useAnalysisStore = create<AnalysisStore>()(
  devtools(
    (set) => ({
      // Initial State
      activeView: 'explorer',
      sidebarOpen: true,
      fileTree: mockFileTree,
      openTabs: [],
      activeTab: '',
      expandedFolders: new Set(['1']),
      renamingNode: null,
      creatingNodeType: null,
      creatingNodeParentId: null,
      layoutSettingsMap: {},
      chartSettingsMap: {},
      currentPage: 1,
      hoveredChart: null,
      editingChart: null,
      editModalOpen: false,
      draggedTab: null,
      dragOverTab: null,

      // View Actions
      setActiveView: (view) => set({ activeView: view }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      // File Actions
      openFile: (file) => set((state) => {
        const exists = state.openTabs.find((tab) => tab.id === file.id)
        if (exists) {
          return { activeTab: file.id, currentPage: 1 }
        }

        // Initialize layout and chart settings for new file
        const newLayoutSettings = !state.layoutSettingsMap[file.id]
          ? { [file.id]: { ...defaultLayoutSettings } }
          : {}
        const newChartSettings = !state.chartSettingsMap[file.id]
          ? { [file.id]: { ...defaultChartSettings } }
          : {}

        return {
          openTabs: [...state.openTabs, file],
          activeTab: file.id,
          currentPage: 1,
          layoutSettingsMap: { ...state.layoutSettingsMap, ...newLayoutSettings },
          chartSettingsMap: { ...state.chartSettingsMap, ...newChartSettings },
        }
      }),

      closeTab: (fileId) => set((state) => {
        const newTabs = state.openTabs.filter((tab) => tab.id !== fileId)
        const newActiveTab = state.activeTab === fileId && newTabs.length > 0
          ? newTabs[newTabs.length - 1].id
          : state.activeTab === fileId
          ? ''
          : state.activeTab

        return {
          openTabs: newTabs,
          activeTab: newActiveTab,
        }
      }),

      setActiveTab: (tabId) => set({ activeTab: tabId, currentPage: 1 }),

      toggleFolder: (folderId) => set((state) => {
        const newExpanded = new Set(state.expandedFolders)
        if (newExpanded.has(folderId)) {
          newExpanded.delete(folderId)
        } else {
          newExpanded.add(folderId)
        }
        return { expandedFolders: newExpanded }
      }),

      reorderTabs: (draggedId, targetId) => set((state) => {
        const draggedIndex = state.openTabs.findIndex((tab) => tab.id === draggedId)
        const targetIndex = state.openTabs.findIndex((tab) => tab.id === targetId)

        if (draggedIndex === -1 || targetIndex === -1) return state

        const newTabs = [...state.openTabs]
        const [draggedTab] = newTabs.splice(draggedIndex, 1)
        newTabs.splice(targetIndex, 0, draggedTab)

        return { openTabs: newTabs }
      }),

      setFileTree: (fileTree) => set({ fileTree }),

      renameNode: (nodeId, newName) => set((state) => {
        const updateNode = (nodes: FileNode[]): FileNode[] => {
          return nodes.map(node => {
            if (node.id === nodeId) {
              return { ...node, name: newName }
            }
            if (node.children) {
              return { ...node, children: updateNode(node.children) }
            }
            return node
          })
        }

        const newFileTree = updateNode(state.fileTree)
        
        // Also update open tabs if the renamed node is open
        const newOpenTabs = state.openTabs.map(tab => 
          tab.id === nodeId ? { ...tab, name: newName } : tab
        )

        return { 
          fileTree: newFileTree,
          openTabs: newOpenTabs,
          renamingNode: null
        }
      }),

      setRenamingNode: (nodeId) => set({ renamingNode: nodeId }),

      createNewFolder: (parentId, name) => set((state) => {
        const newFolder: FileNode = {
          id: `folder_${Date.now()}`,
          name,
          type: "folder",
          children: []
        }

        if (!parentId) {
          // Add to root level
          return { fileTree: [...state.fileTree, newFolder] }
        }

        // Add to specific parent folder
        const addToParent = (nodes: FileNode[]): FileNode[] => {
          return nodes.map(node => {
            if (node.id === parentId && node.type === "folder") {
              return {
                ...node,
                children: [...(node.children || []), newFolder]
              }
            }
            if (node.children) {
              return { ...node, children: addToParent(node.children) }
            }
            return node
          })
        }

        // Ensure parent folder is expanded
        const newExpanded = new Set(state.expandedFolders)
        newExpanded.add(parentId)

        return { 
          fileTree: addToParent(state.fileTree),
          expandedFolders: newExpanded
        }
      }),

      createNewFile: (parentId, name) => set((state) => {
        const newFile: FileNode = {
          id: `file_${Date.now()}`,
          name,
          type: "file",
          dataSources: [],
          charts: []
        }

        if (!parentId) {
          // Add to root level
          return { fileTree: [...state.fileTree, newFile] }
        }

        // Add to specific parent folder
        const addToParent = (nodes: FileNode[]): FileNode[] => {
          return nodes.map(node => {
            if (node.id === parentId && node.type === "folder") {
              return {
                ...node,
                children: [...(node.children || []), newFile]
              }
            }
            if (node.children) {
              return { ...node, children: addToParent(node.children) }
            }
            return node
          })
        }

        // Ensure parent folder is expanded
        const newExpanded = new Set(state.expandedFolders)
        newExpanded.add(parentId)

        return { 
          fileTree: addToParent(state.fileTree),
          expandedFolders: newExpanded
        }
      }),

      setCreatingNode: (type: "folder" | "file" | null, parentId: string | null) => set({ 
        creatingNodeType: type, 
        creatingNodeParentId: parentId 
      }),

      // Layout Actions
      updateLayoutSettings: (fileId, settings) => set((state) => ({
        layoutSettingsMap: {
          ...state.layoutSettingsMap,
          [fileId]: {
            ...state.layoutSettingsMap[fileId],
            ...settings,
          },
        },
      })),

      updateChartSettings: (fileId, settings) => set((state) => ({
        chartSettingsMap: {
          ...state.chartSettingsMap,
          [fileId]: {
            ...state.chartSettingsMap[fileId],
            ...settings,
          },
        },
      })),

      // UI Actions
      setCurrentPage: (page) => set({ currentPage: page }),
      setHoveredChart: (chartId) => set({ hoveredChart: chartId }),
      setEditingChart: (chart) => set({ editingChart: chart }),
      setEditModalOpen: (open) => set({ editModalOpen: open }),
      setDraggedTab: (tabId) => set({ draggedTab: tabId }),
      setDragOverTab: (tabId) => set({ dragOverTab: tabId }),
    }),
    {
      name: 'analysis-store',
    }
  )
)