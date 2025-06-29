import { UserSettings, PlotDefaults, SeriesDefaults, PerformanceSettings } from '@/types/settings'
import { defaultChartColors } from '@/utils/chartColors'

/**
 * Default plot settings used across the application
 */
export const DEFAULT_PLOT_SETTINGS: PlotDefaults = {
  showMarkers: true,
  showLines: true,
  marker: {
    type: 'circle',
    size: 6,
    borderColor: '#3b82f6',
    fillColor: '#3b82f6'
  },
  line: {
    style: 'solid',
    width: 2,
    color: '#3b82f6'
  }
} as const

/**
 * Default series settings for multiple data visualization
 */
export const DEFAULT_SERIES_SETTINGS: SeriesDefaults = {
  colorSequence: [...defaultChartColors],
  markerSequence: ['circle', 'square', 'triangle', 'diamond', 'star', 'cross']
} as const

/**
 * Default performance settings for optimal chart rendering
 */
export const DEFAULT_PERFORMANCE_SETTINGS: PerformanceSettings = {
  rendering: {
    canvasThreshold: 300,
    lodHighThreshold: 1000,
    lodMediumThreshold: 500,
    maxSvgPoints: 5000,
    targetFPS: 30
  },
  memory: {
    warningThreshold: 80,
    cacheMaxSize: 100,
    cacheTTL: 5,
    autoCleanupInterval: 300
  },
  dataProcessing: {
    defaultSamplingPoints: 300,
    samplingMethod: 'auto',
    enableSampling: true,
    batchSize: 10,
    virtualizationBuffer: 2
  },
  interaction: {
    tooltipDelay: 200,
    transitionDuration: 300,
    resizeDebounce: 150,
    enableAnimations: true
  }
} as const

/**
 * Default user settings used across the application
 */
export const DEFAULT_SETTINGS: UserSettings = {
  toolDefaults: {
    // Reserved for future tool settings
  },
  displaySettings: {
    plotDefaults: DEFAULT_PLOT_SETTINGS,
    seriesDefaults: DEFAULT_SERIES_SETTINGS
  },
  performanceSettings: DEFAULT_PERFORMANCE_SETTINGS
} as const

