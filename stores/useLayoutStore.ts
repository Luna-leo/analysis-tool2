import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import type { LayoutSettings, ChartSettings } from '@/types'
import { useGraphStateStore } from './useGraphStateStore'
import { getLayoutMargins, getLayoutLabelOffsets, getDefaultChartSettings } from '@/utils/chart/marginCalculator'

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

const defaultChartSettings: ChartSettings = getDefaultChartSettings(
  defaultLayoutSettings.columns,
  defaultLayoutSettings.rows
)

export const useLayoutStore = create<LayoutStore>()(
  devtools(
    subscribeWithSelector((set) => ({
      // Initial State
      layoutSettingsMap: {},
      chartSettingsMap: {},

      // Actions
      updateLayoutSettings: (fileId, settings) => set((state) => {
        const currentSettings = state.layoutSettingsMap[fileId] || defaultLayoutSettings
        const newSettings = {
          ...currentSettings,
          ...settings,
        }
        
        // Reset currentPage when pagination is turned on
        if (!currentSettings.pagination && settings.pagination) {
          newSettings.currentPage = 0
        }
        
        return {
          layoutSettingsMap: {
            ...state.layoutSettingsMap,
            [fileId]: newSettings,
          },
        }
      }),

      updateChartSettings: (fileId, settings) => set((state) => {
        const layoutSettings = state.layoutSettingsMap[fileId] || defaultLayoutSettings
        const currentChartSettings = state.chartSettingsMap[fileId] || 
          getDefaultChartSettings(layoutSettings.columns, layoutSettings.rows)
        
        return {
          chartSettingsMap: {
            ...state.chartSettingsMap,
            [fileId]: {
              ...currentChartSettings,
              ...settings,
            },
          },
        }
      }),

      initializeSettings: (fileId) => set((state) => {
        // Only initialize if settings don't already exist
        const existingLayoutSettings = state.layoutSettingsMap[fileId]
        const existingChartSettings = state.chartSettingsMap[fileId]
        
        if (existingLayoutSettings && existingChartSettings) {
          // Settings already exist, don't override them
          return state
        }
        
        const layoutSettings = existingLayoutSettings || { ...defaultLayoutSettings }
        const chartSettings = existingChartSettings || 
          getDefaultChartSettings(layoutSettings.columns, layoutSettings.rows)
        
        return {
          layoutSettingsMap: {
            ...state.layoutSettingsMap,
            [fileId]: layoutSettings,
          },
          chartSettingsMap: {
            ...state.chartSettingsMap,
            [fileId]: chartSettings,
          },
        }
      }),
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
    layoutSettings: state.layoutSettingsMap,
    chartSettings: state.chartSettingsMap
  })
}

// Subscribe to layout settings changes
useLayoutStore.subscribe(
  (state) => state.layoutSettingsMap,
  saveLayoutToStorage
)

// Subscribe to chart settings changes
useLayoutStore.subscribe(
  (state) => state.chartSettingsMap,
  saveLayoutToStorage
)