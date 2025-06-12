import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import type { ChartComponent } from '@/types'
import { useGraphStateStore } from './useGraphStateStore'

interface UIState {
  currentPage: number
  hoveredChart: string | null
  editingChart: ChartComponent | null
  editModalOpen: boolean
  searchConditionDialogOpen: boolean
  editingConditionId: string | null
}

interface UIActions {
  setCurrentPage: (page: number) => void
  setHoveredChart: (chartId: string | null) => void
  setEditingChart: (chart: ChartComponent | null) => void
  setEditModalOpen: (open: boolean) => void
  openSearchConditionDialog: (conditionId?: string) => void
  closeSearchConditionDialog: () => void
}

export type UIStore = UIState & UIActions

export const useUIStore = create<UIStore>()(
  devtools(
    subscribeWithSelector((set) => ({
      // Initial State
      currentPage: 1,
      hoveredChart: null,
      editingChart: null,
      editModalOpen: false,
      searchConditionDialogOpen: false,
      editingConditionId: null,

      // Actions
      setCurrentPage: (page) => set({ currentPage: page }),
      setHoveredChart: (chartId) => set({ hoveredChart: chartId }),
      setEditingChart: (chart) => set({ editingChart: chart }),
      setEditModalOpen: (open) => set({ editModalOpen: open }),
      openSearchConditionDialog: (conditionId) => set({ 
        searchConditionDialogOpen: true, 
        editingConditionId: conditionId || null 
      }),
      closeSearchConditionDialog: () => set({ 
        searchConditionDialogOpen: false, 
        editingConditionId: null 
      }),
    })),
    {
      name: 'ui-store',
    }
  )
)

// Subscribe to currentPage changes and update localStorage
const saveUIToStorage = () => {
  const uiState = useUIStore.getState()
  const fileState = useFileStore.getState()
  const viewState = useViewStore.getState()
  const graphStateStore = useGraphStateStore.getState()
  
  graphStateStore.saveState({
    uiState: {
      currentPage: uiState.currentPage,
      sidebarOpen: viewState.sidebarOpen,
      activeView: viewState.activeView,
      expandedFolders: Array.from(fileState.expandedFolders)
    }
  })
}

// Import these stores to avoid circular dependency issues
import { useFileStore } from './useFileStore'
import { useViewStore } from './useViewStore'

// Subscribe to currentPage changes
useUIStore.subscribe(
  (state) => state.currentPage,
  saveUIToStorage
)