import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import type { ChartComponent } from '@/types'
import { useGraphStateStore } from './useGraphStateStore'

interface UIState {
  currentPage: number
  hoveredChart: string | null
  editingChart: ChartComponent | null
  editingChartIndex: number
  editModalOpen: boolean
  searchConditionDialogOpen: boolean
  editingConditionId: string | null
}

interface UIActions {
  setCurrentPage: (page: number) => void
  setHoveredChart: (chartId: string | null) => void
  setEditingChart: (chart: ChartComponent | null) => void
  setEditingChartWithIndex: (chart: ChartComponent | null, index: number) => void
  navigateToNextChart: (charts: ChartComponent[]) => void
  navigateToPreviousChart: (charts: ChartComponent[]) => void
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
      editingChartIndex: -1,
      editModalOpen: false,
      searchConditionDialogOpen: false,
      editingConditionId: null,

      // Actions
      setCurrentPage: (page) => set({ currentPage: page }),
      setHoveredChart: (chartId) => set({ hoveredChart: chartId }),
      setEditingChart: (chart) => set({ editingChart: chart }),
      setEditingChartWithIndex: (chart, index) => set({ 
        editingChart: chart, 
        editingChartIndex: index 
      }),
      navigateToNextChart: (charts) => {
        const state = useUIStore.getState()
        const currentIndex = state.editingChartIndex
        if (currentIndex < charts.length - 1) {
          const nextChart = charts[currentIndex + 1]
          set({ 
            editingChart: nextChart, 
            editingChartIndex: currentIndex + 1 
          })
        }
      },
      navigateToPreviousChart: (charts) => {
        const state = useUIStore.getState()
        const currentIndex = state.editingChartIndex
        if (currentIndex > 0) {
          const prevChart = charts[currentIndex - 1]
          set({ 
            editingChart: prevChart, 
            editingChartIndex: currentIndex - 1 
          })
        }
      },
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
let saveTimeout: NodeJS.Timeout | null = null
const saveUIToStorage = () => {
  // Debounce save to prevent infinite loops
  if (saveTimeout) {
    clearTimeout(saveTimeout)
  }
  
  saveTimeout = setTimeout(() => {
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
  }, 100)
}

// Import these stores to avoid circular dependency issues
import { useFileStore } from './useFileStore'
import { useViewStore } from './useViewStore'

// Subscribe to currentPage changes
useUIStore.subscribe(
  (state) => state.currentPage,
  saveUIToStorage
)