import { PerformanceSettings } from '@/types/settings'

export type PerformancePreset = 'high-performance' | 'balanced' | 'full-detail'

export interface PerformancePresetConfig {
  id: PerformancePreset
  name: string
  description: string
  icon: string
  settings: Partial<PerformanceSettings>
}

export const PERFORMANCE_PRESETS: PerformancePresetConfig[] = [
  {
    id: 'high-performance',
    name: 'High Performance',
    description: 'Optimized for smooth interaction with large datasets',
    icon: '⚡',
    settings: {
      dataProcessing: {
        enableSampling: true,
        defaultSamplingPoints: 500,
        samplingMethod: 'auto',
        batchSize: 20,
        virtualizationBuffer: 2
      },
      rendering: {
        canvasThreshold: 300,
        lodHighThreshold: 1000,
        lodMediumThreshold: 500,
        maxSvgPoints: 1000,
        targetFPS: 60
      },
      interaction: {
        enableAnimations: false,
        tooltipDelay: 100,
        transitionDuration: 0,
        resizeDebounce: 150
      }
    }
  },
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Good balance between performance and detail',
    icon: '⚖️',
    settings: {
      dataProcessing: {
        enableSampling: true,
        defaultSamplingPoints: 1000,
        samplingMethod: 'lttb',
        batchSize: 30,
        virtualizationBuffer: 3
      },
      rendering: {
        canvasThreshold: 500,
        lodHighThreshold: 2000,
        lodMediumThreshold: 1000,
        maxSvgPoints: 3000,
        targetFPS: 30
      },
      interaction: {
        enableAnimations: true,
        tooltipDelay: 50,
        transitionDuration: 150,
        resizeDebounce: 250
      }
    }
  },
  {
    id: 'full-detail',
    name: 'Full Detail',
    description: 'Show all data points (may impact performance)',
    icon: '🔍',
    settings: {
      dataProcessing: {
        enableSampling: false,
        defaultSamplingPoints: 10000,
        samplingMethod: 'none',
        batchSize: 50,
        virtualizationBuffer: 5
      },
      rendering: {
        canvasThreshold: 1000,
        lodHighThreshold: 5000,
        lodMediumThreshold: 2000,
        maxSvgPoints: 10000,
        targetFPS: 30
      },
      interaction: {
        enableAnimations: true,
        tooltipDelay: 0,
        transitionDuration: 200,
        resizeDebounce: 300
      }
    }
  }
]

export function getPresetById(id: PerformancePreset): PerformancePresetConfig | undefined {
  return PERFORMANCE_PRESETS.find(preset => preset.id === id)
}

export function detectCurrentPreset(settings: PerformanceSettings): PerformancePreset {
  // Check if current settings match any preset
  for (const preset of PERFORMANCE_PRESETS) {
    // Check if data sampling matches
    if (settings.dataProcessing.enableSampling === preset.settings.dataProcessing?.enableSampling &&
        settings.dataProcessing.defaultSamplingPoints === preset.settings.dataProcessing?.defaultSamplingPoints &&
        settings.dataProcessing.samplingMethod === preset.settings.dataProcessing?.samplingMethod) {
      return preset.id
    }
  }
  
  return 'balanced'
}