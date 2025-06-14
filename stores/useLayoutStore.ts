import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import type { LayoutSettings, ChartSettings } from '@/types'
import { useGraphStateStore } from './useGraphStateStore'

interface LayoutState {
  layoutSettingsMap: Record<string, LayoutSettings>
  chartSettingsMap: Record<string, ChartSettings>
}

interface LayoutActions {
  updateLayoutSettings: (fileId: string, settings: Partial<LayoutSettings>) => void
  updateChartSettings: (fileId: string, settings: Partial<ChartSettings>) => void
  initializeSettings: (fileId: string) => void
}

export type LayoutStore = LayoutState & LayoutActions

const defaultLayoutSettings: LayoutSettings = {
  showFileName: true,
  showDataSources: true,
  columns: 2,
  rows: 2,
  pagination: true,
}

const defaultChartSettings: ChartSettings = {
  showXAxis: true,
  showYAxis: true,
  showGrid: true,
}

export const useLayoutStore = create<LayoutStore>()(
  devtools(
    subscribeWithSelector((set) => ({
      // Initial State
      layoutSettingsMap: {},
      chartSettingsMap: {},

      // Actions
      updateLayoutSettings: (fileId, settings) => set((state) => ({
        layoutSettingsMap: {
          ...state.layoutSettingsMap,
          [fileId]: {
            ...(state.layoutSettingsMap[fileId] || defaultLayoutSettings),
            ...settings,
          },
        },
      })),

      updateChartSettings: (fileId, settings) => set((state) => ({
        chartSettingsMap: {
          ...state.chartSettingsMap,
          [fileId]: {
            ...(state.chartSettingsMap[fileId] || defaultChartSettings),
            ...settings,
          },
        },
      })),

      initializeSettings: (fileId) => set((state) => ({
        layoutSettingsMap: {
          ...state.layoutSettingsMap,
          [fileId]: state.layoutSettingsMap[fileId] || { ...defaultLayoutSettings },
        },
        chartSettingsMap: {
          ...state.chartSettingsMap,
          [fileId]: state.chartSettingsMap[fileId] || { ...defaultChartSettings },
        },
      })),
    })),
    {
      name: 'layout-store',
    }
  )
)

// Subscribe to layout settings changes and save to localStorage
const saveLayoutToStorage = () => {
  const state = useLayoutStore.getState()
  const graphStateStore = useGraphStateStore.getState()
  
  graphStateStore.saveState({
    layoutSettings: state.layoutSettingsMap
  })
}

// Subscribe to layout settings changes
useLayoutStore.subscribe(
  (state) => state.layoutSettingsMap,
  saveLayoutToStorage
)