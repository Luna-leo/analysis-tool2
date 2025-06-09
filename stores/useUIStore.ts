import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ChartComponent } from '@/types'

interface UIState {
  currentPage: number
  hoveredChart: string | null
  editingChart: ChartComponent | null
  editModalOpen: boolean
}

interface UIActions {
  setCurrentPage: (page: number) => void
  setHoveredChart: (chartId: string | null) => void
  setEditingChart: (chart: ChartComponent | null) => void
  setEditModalOpen: (open: boolean) => void
}

export type UIStore = UIState & UIActions

export const useUIStore = create<UIStore>()(
  devtools(
    (set) => ({
      // Initial State
      currentPage: 1,
      hoveredChart: null,
      editingChart: null,
      editModalOpen: false,

      // Actions
      setCurrentPage: (page) => set({ currentPage: page }),
      setHoveredChart: (chartId) => set({ hoveredChart: chartId }),
      setEditingChart: (chart) => set({ editingChart: chart }),
      setEditModalOpen: (open) => set({ editModalOpen: open }),
    }),
    {
      name: 'ui-store',
    }
  )
)