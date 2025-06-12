import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import type { ActiveView } from '@/types'
import { useGraphStateStore } from './useGraphStateStore'

interface ViewState {
  activeView: ActiveView
  sidebarOpen: boolean
}

interface ViewActions {
  setActiveView: (view: ActiveView) => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export type ViewStore = ViewState & ViewActions

export const useViewStore = create<ViewStore>()(
  devtools(
    subscribeWithSelector((set) => ({
      // Initial State
      activeView: 'explorer',
      sidebarOpen: true,

      // Actions
      setActiveView: (view) => set({ activeView: view }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    })),
    {
      name: 'view-store',
    }
  )
)

// Subscribe to view state changes and save to localStorage
const saveViewToStorage = () => {
  const viewState = useViewStore.getState()
  const uiState = useUIStore.getState()
  const fileState = useFileStore.getState()
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
import { useUIStore } from './useUIStore'
import { useFileStore } from './useFileStore'

// Subscribe to view state changes
useViewStore.subscribe(
  (state) => ({ activeView: state.activeView, sidebarOpen: state.sidebarOpen }),
  saveViewToStorage
)