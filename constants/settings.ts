import { UserSettings, PlotDefaults, SeriesDefaults } from '@/types/settings'
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
 * Default user settings used across the application
 */
export const DEFAULT_SETTINGS: UserSettings = {
  toolDefaults: {
    parameterSource: 'master'
  },
  displaySettings: {
    plotDefaults: DEFAULT_PLOT_SETTINGS,
    seriesDefaults: DEFAULT_SERIES_SETTINGS
  }
} as const

