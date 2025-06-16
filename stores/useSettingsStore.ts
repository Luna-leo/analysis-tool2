import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SettingsStore, ParameterSource, PlotDefaults, SeriesDefaults, PerformanceSettings } from '@/types/settings'
import { DEFAULT_SETTINGS, DEFAULT_PLOT_SETTINGS, DEFAULT_SERIES_SETTINGS, DEFAULT_PERFORMANCE_SETTINGS } from '@/constants/settings'

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: DEFAULT_SETTINGS,
      isLoading: false,

      updateParameterSource: (source: ParameterSource) => {
        set((state) => ({
          settings: {
            ...state.settings,
            toolDefaults: {
              ...state.settings.toolDefaults,
              parameterSource: source
            }
          }
        }))
      },

      updatePlotDefaults: (plotDefaults: Partial<PlotDefaults>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            displaySettings: {
              ...state.settings.displaySettings,
              plotDefaults: {
                ...state.settings.displaySettings.plotDefaults,
                ...plotDefaults
              }
            }
          }
        }))
      },

      resetPlotDefaults: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            displaySettings: {
              ...state.settings.displaySettings,
              plotDefaults: DEFAULT_PLOT_SETTINGS
            }
          }
        }))
      },

      updateSeriesDefaults: (seriesDefaults: Partial<SeriesDefaults>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            displaySettings: {
              ...state.settings.displaySettings,
              seriesDefaults: {
                ...state.settings.displaySettings.seriesDefaults,
                ...seriesDefaults
              }
            }
          }
        }))
      },

      resetSeriesDefaults: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            displaySettings: {
              ...state.settings.displaySettings,
              seriesDefaults: DEFAULT_SERIES_SETTINGS
            }
          }
        }))
      },

      updatePerformanceSettings: (performanceSettings: Partial<PerformanceSettings>) => {
        set((state) => ({
          settings: {
            ...state.settings,
            performanceSettings: {
              ...state.settings.performanceSettings,
              ...performanceSettings
            }
          }
        }))
      },

      resetPerformanceSettings: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            performanceSettings: DEFAULT_PERFORMANCE_SETTINGS
          }
        }))
      },

      loadSettings: () => {
        // Settings are automatically loaded by zustand persist
        set({ isLoading: false })
      },

      saveSettings: () => {
        // Settings are automatically saved by zustand persist
      }
    }),
    {
      name: 'analysis-tool-settings',
      version: 4,
      migrate: (persistedState: any, version: number) => {
        if (version === 1) {
          // Migrate from version 1 to version 4
          return {
            ...persistedState,
            settings: {
              ...persistedState.settings,
              displaySettings: {
                plotDefaults: DEFAULT_PLOT_SETTINGS,
                seriesDefaults: DEFAULT_SERIES_SETTINGS
              },
              performanceSettings: DEFAULT_PERFORMANCE_SETTINGS
            }
          }
        }
        if (version === 2) {
          // Migrate from version 2 to version 4
          return {
            ...persistedState,
            settings: {
              ...persistedState.settings,
              displaySettings: {
                ...persistedState.settings.displaySettings,
                seriesDefaults: DEFAULT_SERIES_SETTINGS
              },
              performanceSettings: DEFAULT_PERFORMANCE_SETTINGS
            }
          }
        }
        if (version === 3) {
          // Migrate from version 3 to version 4
          return {
            ...persistedState,
            settings: {
              ...persistedState.settings,
              performanceSettings: DEFAULT_PERFORMANCE_SETTINGS
            }
          }
        }
        return persistedState
      }
    }
  )
)