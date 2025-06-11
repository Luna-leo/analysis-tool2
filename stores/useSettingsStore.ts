import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserSettings, SettingsStore, ParameterSource } from '@/types/settings'

const defaultSettings: UserSettings = {
  toolDefaults: {
    parameterSource: 'master'
  }
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
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
      version: 1,
    }
  )
)