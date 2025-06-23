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
  selectedChartIds: Set<string>
  searchConditionDialogOpen: boolean
  editingConditionId: string | null
  gridSelectionMode: boolean
  gridSelectedChartIds: Set<string>
  lastSelectedChartId: string | null
  sourceSelectionMode: boolean
  pendingSourceSelection: {
    targetChartIds: Set<string>
    onSourceSelect: (sourceChart: ChartComponent) => void
  } | null
}

interface UIActions {
  setCurrentPage: (page: number) => void
  setHoveredChart: (chartId: string | null) => void
  setEditingChart: (chart: ChartComponent | null) => void
  setEditingChartWithIndex: (chart: ChartComponent | null, index: number) => void
  navigateToNextChart: (charts: ChartComponent[]) => void
  navigateToPreviousChart: (charts: ChartComponent[]) => void
  setEditModalOpen: (open: boolean) => void
  toggleChartSelection: (chartId: string) => void
  clearSelectedCharts: () => void
  selectAllCharts: (chartIds: string[]) => void
  openSearchConditionDialog: (conditionId?: string) => void
  closeSearchConditionDialog: () => void
  setGridSelectionMode: (mode: boolean) => void
  toggleGridChartSelection: (chartId: string, isShiftClick?: boolean, allChartIds?: string[]) => void
  clearGridSelectedCharts: () => void
  selectAllGridCharts: (chartIds: string[]) => void
  startSourceSelection: (targetChartIds: Set<string>, onSourceSelect: (sourceChart: ChartComponent) => void) => void
  cancelSourceSelection: () => void
  selectSourceChart: (sourceChart: ChartComponent) => void
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
      selectedChartIds: new Set(),
      searchConditionDialogOpen: false,
      editingConditionId: null,
      gridSelectionMode: false,
      gridSelectedChartIds: new Set(),
      lastSelectedChartId: null,
      sourceSelectionMode: false,
      pendingSourceSelection: null,

      // Actions
      setCurrentPage: (page) => set({ currentPage: page }),
      setHoveredChart: (chartId) => set({ hoveredChart: chartId }),
      setEditingChart: (chart) => {
        if (process.env.NODE_ENV === 'development' && chart) {
          console.log('[UIStore] setEditingChart called with:', {
            chartId: chart.id,
            hasPlotStyles: !!chart.plotStyles,
            plotStylesMode: chart.plotStyles?.mode || chart.legendMode || 'datasource'
          })
        }
        // Force a new object reference to ensure React detects the change
        set({ editingChart: chart ? { ...chart } : null })
      },
      setEditingChartWithIndex: (chart, index) => set({ 
        // Force a new object reference to ensure React detects the change
        editingChart: chart ? { ...chart } : null, 
        editingChartIndex: index 
      }),
      navigateToNextChart: (charts) => {
        const state = useUIStore.getState()
        const currentIndex = state.editingChartIndex
        if (currentIndex < charts.length - 1) {
          const nextChart = charts[currentIndex + 1]
          set({ 
            // Force a new object reference to ensure React detects the change
            editingChart: { ...nextChart }, 
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
            // Force a new object reference to ensure React detects the change
            editingChart: { ...prevChart }, 
            editingChartIndex: currentIndex - 1 
          })
        }
      },
      setEditModalOpen: (open) => set({ editModalOpen: open }),
      toggleChartSelection: (chartId) => set((state) => {
        const newSet = new Set(state.selectedChartIds)
        if (newSet.has(chartId)) {
          newSet.delete(chartId)
        } else {
          newSet.add(chartId)
        }
        return { selectedChartIds: newSet }
      }),
      clearSelectedCharts: () => set({ selectedChartIds: new Set() }),
      selectAllCharts: (chartIds) => set({ selectedChartIds: new Set(chartIds) }),
      openSearchConditionDialog: (conditionId) => set({ 
        searchConditionDialogOpen: true, 
        editingConditionId: conditionId || null 
      }),
      closeSearchConditionDialog: () => set({ 
        searchConditionDialogOpen: false, 
        editingConditionId: null 
      }),
      setGridSelectionMode: (mode) => set({ 
        gridSelectionMode: mode,
        gridSelectedChartIds: mode ? new Set() : new Set()
      }),
      toggleGridChartSelection: (chartId, isShiftClick = false, allChartIds = []) => set((state) => {
        const newSet = new Set(state.gridSelectedChartIds)
        
        if (isShiftClick && state.lastSelectedChartId && allChartIds.length > 0) {
          // Shift+Click: range selection
          const startIndex = allChartIds.indexOf(state.lastSelectedChartId)
          const endIndex = allChartIds.indexOf(chartId)
          
          if (startIndex !== -1 && endIndex !== -1) {
            const [minIndex, maxIndex] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)]
            for (let i = minIndex; i <= maxIndex; i++) {
              newSet.add(allChartIds[i])
            }
          }
        } else {
          // Normal click: toggle selection
          if (newSet.has(chartId)) {
            newSet.delete(chartId)
          } else {
            newSet.add(chartId)
          }
        }
        
        return { 
          gridSelectedChartIds: newSet,
          lastSelectedChartId: chartId
        }
      }),
      clearGridSelectedCharts: () => set({ 
        gridSelectedChartIds: new Set(),
        lastSelectedChartId: null
      }),
      selectAllGridCharts: (chartIds) => set({ 
        gridSelectedChartIds: new Set(chartIds),
        lastSelectedChartId: chartIds.length > 0 ? chartIds[chartIds.length - 1] : null
      }),
      startSourceSelection: (targetChartIds, onSourceSelect) => set({
        sourceSelectionMode: true,
        pendingSourceSelection: {
          targetChartIds,
          onSourceSelect
        }
      }),
      cancelSourceSelection: () => set({
        sourceSelectionMode: false,
        pendingSourceSelection: null
      }),
      selectSourceChart: (sourceChart) => {
        const state = useUIStore.getState()
        if (state.pendingSourceSelection) {
          state.pendingSourceSelection.onSourceSelect(sourceChart)
          set({
            sourceSelectionMode: false,
            pendingSourceSelection: null
          })
        }
      },
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