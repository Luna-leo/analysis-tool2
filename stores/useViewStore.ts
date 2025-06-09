import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { ActiveView } from '@/types'

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
    (set) => ({
      // Initial State
      activeView: 'explorer',
      sidebarOpen: true,

      // Actions
      setActiveView: (view) => set({ activeView: view }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'view-store',
    }
  )
)