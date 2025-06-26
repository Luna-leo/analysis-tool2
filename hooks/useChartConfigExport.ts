import { useCallback, useState } from 'react'
import type { ChartComponent, LayoutSettings, ChartSettings, EventInfo } from '@/types'
import type { ChartGridConfig, ConfigValidationResult, ImportOptions } from '@/types/chart-config'
import { toast } from 'sonner'

const CONFIG_VERSION = '1.0.0'

export function useChartConfigExport() {
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)

  /**
   * Validate imported configuration
   */
  const validateConfig = useCallback((config: any): ConfigValidationResult => {
    const errors: string[] = []
    const warnings: string[] = []

    // Check if config is an object
    if (!config || typeof config !== 'object') {
      errors.push('Invalid configuration format')
      return { isValid: false, errors, warnings }
    }

    // Check version
    if (!config.version) {
      errors.push('Configuration version is missing')
    } else if (config.version !== CONFIG_VERSION) {
      warnings.push(`Configuration version mismatch. Expected ${CONFIG_VERSION}, got ${config.version}`)
    }

    // Check required fields
    if (!config.metadata || typeof config.metadata !== 'object') {
      errors.push('Metadata is missing or invalid')
    }

    if (!config.layoutSettings || typeof config.layoutSettings !== 'object') {
      errors.push('Layout settings are missing or invalid')
    }

    if (!config.chartSettings || typeof config.chartSettings !== 'object') {
      errors.push('Chart settings are missing or invalid')
    }

    if (!Array.isArray(config.charts)) {
      errors.push('Charts must be an array')
    } else {
      // Validate each chart
      config.charts.forEach((chart: any, index: number) => {
        if (!chart.id) {
          errors.push(`Chart at index ${index} is missing an ID`)
        }
        if (!chart.title) {
          warnings.push(`Chart at index ${index} is missing a title`)
        }
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }, [])

  /**
   * Export configuration to JSON file
   */
  const exportConfig = useCallback(async (
    fileId: string,
    fileName: string,
    layoutSettings: LayoutSettings,
    chartSettings: ChartSettings,
    charts: ChartComponent[],
    selectedDataSources?: EventInfo[],
    customFilename?: string
  ) => {
    setIsExporting(true)

    try {
      
      // Remove fileId from charts to ensure portability
      const cleanedCharts = charts.map(chart => {
        const { fileId, ...chartWithoutFileId } = chart
        return chartWithoutFileId
      })
      
      const config: ChartGridConfig = {
        version: CONFIG_VERSION,
        metadata: {
          exportedAt: new Date().toISOString(),
          fileId,
          fileName,
          description: `Chart configuration for ${fileName}`
        },
        layoutSettings,
        chartSettings,
        charts: cleanedCharts,
        selectedDataSources,
        dataSourceInfo: {
          // Extract unique data sources and parameters
          requiredDataSources: [...new Set(charts.map(c => c.dataSource?.name).filter(Boolean) as string[])],
          requiredParameters: [...new Set(charts.flatMap(c => [
            c.xParameter,
            ...(c.yParameters || [])
          ]).filter(Boolean) as string[])]
        }
      }

      // Format timestamp as YYYY-MM-DD_HH-mm-ss
      const now = new Date()
      const timestamp = now.getFullYear() + '-' +
        String(now.getMonth() + 1).padStart(2, '0') + '-' +
        String(now.getDate()).padStart(2, '0') + '_' +
        String(now.getHours()).padStart(2, '0') + '-' +
        String(now.getMinutes()).padStart(2, '0') + '-' +
        String(now.getSeconds()).padStart(2, '0')

      // Use custom filename if provided, otherwise use fileName with timestamp
      const downloadFilename = customFilename 
        ? `${customFilename}.json`
        : `${fileName}_${timestamp}.json`

      // Create blob and download
      const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = downloadFilename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Chart configuration exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export configuration')
    } finally {
      setIsExporting(false)
    }
  }, [])

  /**
   * Import configuration from JSON file
   */
  const importConfig = useCallback(async (
    file: File,
    options: ImportOptions = {}
  ): Promise<ChartGridConfig | null> => {
    setIsImporting(true)

    try {
      const text = await file.text()
      const config = JSON.parse(text)

      // Validate configuration
      const validation = validateConfig(config)
      
      if (!validation.isValid) {
        toast.error('Invalid configuration file', {
          description: validation.errors.join(', ')
        })
        return null
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        toast.warning('Configuration imported with warnings', {
          description: validation.warnings.join(', ')
        })
      }
      
      // Debug logging
      console.log('[importConfig] Imported configuration:', {
        fileName: config.metadata?.fileName,
        chartsCount: config.charts?.length || 0,
        dataSourcesCount: config.selectedDataSources?.length || 0,
        hasDataSources: !!config.selectedDataSources
      })

      toast.success('Configuration imported successfully')
      return config as ChartGridConfig
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Failed to import configuration', {
        description: error instanceof Error ? error.message : 'Invalid JSON file'
      })
      return null
    } finally {
      setIsImporting(false)
    }
  }, [validateConfig])

  /**
   * Create a preset from current configuration
   */
  const saveAsPreset = useCallback((
    name: string,
    config: Omit<ChartGridConfig, 'metadata'>
  ) => {
    try {
      const presets = JSON.parse(localStorage.getItem('chartConfigPresets') || '{}')
      
      // Remove fileId from charts to ensure portability
      const cleanedCharts = config.charts.map(chart => {
        const { fileId, ...chartWithoutFileId } = chart
        return chartWithoutFileId
      })
      
      presets[name] = {
        ...config,
        charts: cleanedCharts,
        metadata: {
          exportedAt: new Date().toISOString(),
          fileId: 'preset',
          fileName: name
        }
      }
      localStorage.setItem('chartConfigPresets', JSON.stringify(presets))
      toast.success(`Preset "${name}" saved successfully`)
    } catch (error) {
      console.error('Save preset error:', error)
      toast.error('Failed to save preset')
    }
  }, [])

  /**
   * Load a preset by name
   */
  const loadPreset = useCallback((name: string): ChartGridConfig | null => {
    try {
      const presets = JSON.parse(localStorage.getItem('chartConfigPresets') || '{}')
      if (presets[name]) {
        toast.success(`Preset "${name}" loaded successfully`)
        return presets[name]
      }
      toast.error(`Preset "${name}" not found`)
      return null
    } catch (error) {
      console.error('Load preset error:', error)
      toast.error('Failed to load preset')
      return null
    }
  }, [])

  /**
   * Get all saved presets
   */
  const getPresets = useCallback((): Record<string, ChartGridConfig> => {
    try {
      return JSON.parse(localStorage.getItem('chartConfigPresets') || '{}')
    } catch {
      return {}
    }
  }, [])

  /**
   * Delete a preset
   */
  const deletePreset = useCallback((name: string) => {
    try {
      const presets = JSON.parse(localStorage.getItem('chartConfigPresets') || '{}')
      delete presets[name]
      localStorage.setItem('chartConfigPresets', JSON.stringify(presets))
      toast.success(`Preset "${name}" deleted successfully`)
    } catch (error) {
      console.error('Delete preset error:', error)
      toast.error('Failed to delete preset')
    }
  }, [])

  return {
    exportConfig,
    importConfig,
    saveAsPreset,
    loadPreset,
    getPresets,
    deletePreset,
    isExporting,
    isImporting,
    validateConfig
  }
}