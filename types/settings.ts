export type ParameterSource = "master" | "datasource"

export interface ToolSettings {
  parameterSource: ParameterSource
}

export interface UserSettings {
  toolDefaults: ToolSettings
}

export interface SettingsStore {
  settings: UserSettings
  isLoading: boolean
  updateParameterSource: (source: ParameterSource) => void
  loadSettings: () => void
  saveSettings: () => void
}