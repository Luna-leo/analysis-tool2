import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ActiveView, FileNode, LayoutSettings, ChartSettings, ChartComponent } from '@/types'

interface AnalysisState {
  // View State
  activeView: ActiveView
  sidebarOpen: boolean
  
  // File State
  openTabs: FileNode[]
  activeTab: string
  expandedFolders: Set<string>
  
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
      openTabs: [],
      activeTab: '',
      expandedFolders: new Set(['1']),
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