import { MarkerType, LineStyle } from './index'

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

export interface SeriesDefaults {
  colorSequence: string[]
  markerSequence: MarkerType[]
}

export interface PerformanceSettings {
  rendering: {
    canvasThreshold: number
    lodHighThreshold: number
    lodMediumThreshold: number
    maxSvgPoints: number
    targetFPS: number
  }
  memory: {
    warningThreshold: number // percentage (0-100)
    cacheMaxSize: number // MB
    cacheTTL: number // minutes
    autoCleanupInterval: number // seconds
  }
  dataProcessing: {
    defaultSamplingPoints: number
    samplingMethod: 'lttb' | 'nth-point' | 'douglas-peucker' | 'auto' | 'none'
    enableSampling: boolean
    batchSize: number
    virtualizationBuffer: number // rows
  }
  interaction: {
    tooltipDelay: number // ms
    transitionDuration: number // ms
    resizeDebounce: number // ms
    enableAnimations: boolean
  }
}

export interface ToolSettings {
  // Reserved for future tool settings
}

export interface DisplaySettings {
  plotDefaults: PlotDefaults
  seriesDefaults: SeriesDefaults
}

export interface UserSettings {
  toolDefaults: ToolSettings
  displaySettings: DisplaySettings
  performanceSettings: PerformanceSettings
}

export interface SettingsStore {
  settings: UserSettings
  isLoading: boolean
  updatePlotDefaults: (plotDefaults: Partial<PlotDefaults>) => void
  resetPlotDefaults: () => void
  updateSeriesDefaults: (seriesDefaults: Partial<SeriesDefaults>) => void
  resetSeriesDefaults: () => void
  updatePerformanceSettings: (performanceSettings: Partial<PerformanceSettings>) => void
  resetPerformanceSettings: () => void
  loadSettings: () => void
  saveSettings: () => void
}