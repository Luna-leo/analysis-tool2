import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { SettingsStore, ParameterSource, PlotDefaults } from '@/types/settings'
import { DEFAULT_SETTINGS, DEFAULT_PLOT_SETTINGS } from '@/constants/settings'

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
      version: 2,
      migrate: (persistedState: any, version: number) => {
        if (version === 1) {
          // Migrate from version 1 to version 2
          return {
            ...persistedState,
            settings: {
              ...persistedState.settings,
              displaySettings: {
                plotDefaults: DEFAULT_PLOT_SETTINGS
              }
            }
          }
        }
        return persistedState
      }
    }
  )
)