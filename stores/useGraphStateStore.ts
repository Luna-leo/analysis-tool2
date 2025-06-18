import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { FileNode, LayoutSettings, ChartSettings, ActiveView, ChartComponent } from '@/types'
import { safeLocalStorage, isBrowser } from '@/utils/browserUtils'

interface OpenTab extends FileNode {
  source?: 'explorer' | 'database' | 'calculator' | 'settings'
  charts?: ChartComponent[]  // Explicitly include charts to ensure it's saved
}

interface GraphState {
  tabs: OpenTab[]
  activeTab: string
  layoutSettings: Record<string, LayoutSettings>
  chartSettings?: Record<string, ChartSettings>
  uiState: {
    currentPage: number
    sidebarOpen: boolean
    activeView: ActiveView
    expandedFolders: string[]
  }
  fileTree: FileNode[]
  lastSaved: Date | null
}

interface GraphStateStore {
  savedState: GraphState | null
  saveState: (state: Partial<GraphState>) => void
  loadState: () => GraphState | null
  clearState: () => void
  getSavedState: () => GraphState | null
  clearAndReload: () => void
}

const STORAGE_KEY = 'analysis-tool-graph-state'

const getStorageItem = (): GraphState | null => {
  const item = safeLocalStorage.getItem(STORAGE_KEY)
  if (!item) return null
  
  try {
    const parsed = JSON.parse(item)
    return {
      ...parsed,
      lastSaved: parsed.lastSaved ? new Date(parsed.lastSaved) : null
    }
  } catch (error) {
    console.error('Failed to parse graph state from localStorage:', error)
    return null
  }
}

const setStorageItem = (state: GraphState): void => {
  const stateToSave = {
    ...state,
    lastSaved: new Date().toISOString()
  }
  safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
}

const removeStorageItem = (): void => {
  safeLocalStorage.removeItem(STORAGE_KEY)
}

export const useGraphStateStore = create<GraphStateStore>()(
  devtools(
    (set, get) => ({
      savedState: null,

      saveState: (partialState) => {
        const currentState = get().savedState || {
          tabs: [],
          activeTab: '',
          layoutSettings: {},
          uiState: {
            currentPage: 1,
            sidebarOpen: true,
            activeView: 'explorer' as ActiveView,
            expandedFolders: []
          },
          fileTree: [],
          lastSaved: null
        }

        const newState: GraphState = {
          ...currentState,
          ...partialState,
          lastSaved: new Date()
        }

        setStorageItem(newState)
        set({ savedState: newState })
      },

      loadState: () => {
        const state = getStorageItem()
        set({ savedState: state })
        return state
      },

      clearState: () => {
        removeStorageItem()
        set({ savedState: null })
      },

      getSavedState: () => {
        return get().savedState || getStorageItem()
      },
      
      clearAndReload: () => {
        removeStorageItem()
        set({ savedState: null })
        // Reload the page to start fresh
        if (isBrowser()) {
          window.location.reload()
        }
      }
    }),
    {
      name: 'graph-state-store',
    }
  )
)