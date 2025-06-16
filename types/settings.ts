import { MarkerType, LineStyle } from './index'

export type ParameterSource = "master" | "datasource"

export interface PlotDefaults {
  showMarkers: boolean
  showLines: boolean
  marker: {
    type: MarkerType
    size: number
    borderColor: string
    fillColor: string
  }
  line: {
    style: LineStyle
    width: number
    color: string
  }
}

export interface ToolSettings {
  parameterSource: ParameterSource
}

export interface DisplaySettings {
  plotDefaults: PlotDefaults
}

export interface UserSettings {
  toolDefaults: ToolSettings
  displaySettings: DisplaySettings
}

export interface SettingsStore {
  settings: UserSettings
  isLoading: boolean
  updateParameterSource: (source: ParameterSource) => void
  updatePlotDefaults: (plotDefaults: Partial<PlotDefaults>) => void
  resetPlotDefaults: () => void
  loadSettings: () => void
  saveSettings: () => void
}