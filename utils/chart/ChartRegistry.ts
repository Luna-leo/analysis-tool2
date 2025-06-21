import { ChartComponent } from "@/types"
import { BaseChart, BaseChartConfig } from "@/components/charts/ChartPreview/core/BaseChart"

/**
 * Chart type definition
 */
export interface ChartTypeDefinition {
  type: string
  name: string
  description: string
  icon?: string
  defaultConfig: Partial<ChartComponent>
  supportedFeatures: ChartFeature[]
  renderer: ChartRenderer
}

/**
 * Supported chart features
 */
export type ChartFeature = 
  | 'markers'
  | 'lines'
  | 'areas'
  | 'bars'
  | 'multiAxis'
  | 'referenceLines'
  | 'interlocks'
  | 'animations'
  | 'realTime'
  | 'zoom'
  | 'pan'

/**
 * Chart renderer function type
 */
export type ChartRenderer = (config: BaseChartConfig) => void

/**
 * Chart Registry for managing chart types
 * Allows dynamic registration of new chart types
 */
export class ChartRegistry {
  private static instance: ChartRegistry
  private chartTypes: Map<string, ChartTypeDefinition> = new Map()
  
  /**
   * Get singleton instance
   */
  static getInstance(): ChartRegistry {
    if (!ChartRegistry.instance) {
      ChartRegistry.instance = new ChartRegistry()
      ChartRegistry.instance.registerDefaultChartTypes()
    }
    return ChartRegistry.instance
  }
  
  /**
   * Register a new chart type
   */
  registerChartType(definition: ChartTypeDefinition): void {
    if (this.chartTypes.has(definition.type)) {
      console.warn(`Chart type "${definition.type}" is already registered. Overwriting...`)
    }
    
    this.chartTypes.set(definition.type, definition)
  }
  
  /**
   * Get chart type definition
   */
  getChartType(type: string): ChartTypeDefinition | undefined {
    return this.chartTypes.get(type)
  }
  
  /**
   * Get all registered chart types
   */
  getAllChartTypes(): ChartTypeDefinition[] {
    return Array.from(this.chartTypes.values())
  }
  
  /**
   * Check if a chart type is registered
   */
  hasChartType(type: string): boolean {
    return this.chartTypes.has(type)
  }
  
  /**
   * Create chart instance by type
   */
  createChart(type: string, config: BaseChartConfig): void {
    const definition = this.chartTypes.get(type)
    if (!definition) {
      throw new Error(`Unknown chart type: ${type}`)
    }
    
    // Apply default configuration
    const mergedConfig = {
      ...config,
      editingChart: {
        ...definition.defaultConfig,
        ...config.editingChart
      }
    }
    
    // Call the renderer
    definition.renderer(mergedConfig)
  }
  
  /**
   * Get supported features for a chart type
   */
  getSupportedFeatures(type: string): ChartFeature[] {
    const definition = this.chartTypes.get(type)
    return definition?.supportedFeatures || []
  }
  
  /**
   * Check if a chart type supports a feature
   */
  supportsFeature(type: string, feature: ChartFeature): boolean {
    const features = this.getSupportedFeatures(type)
    return features.includes(feature)
  }
  
  /**
   * Register default chart types
   */
  private registerDefaultChartTypes(): void {
    // Register Line Chart
    this.registerChartType({
      type: 'line',
      name: 'Line Chart',
      description: 'Display data as connected lines over time or numeric values',
      icon: 'line-chart',
      defaultConfig: {
        type: 'line',
        xAxisType: 'datetime',
        yAxisParams: []
      },
      supportedFeatures: [
        'lines',
        'markers',
        'multiAxis',
        'referenceLines',
        'interlocks',
        'zoom',
        'pan'
      ],
      renderer: async (config) => {
        // TODO: Implement LineChart component
        console.warn('LineChart renderer not implemented')
      }
    })
    
    // Register Scatter Plot
    this.registerChartType({
      type: 'scatter',
      name: 'Scatter Plot',
      description: 'Display data points as individual markers',
      icon: 'scatter-chart',
      defaultConfig: {
        type: 'scatter',
        xAxisType: 'datetime',
        yAxisParams: []
      },
      supportedFeatures: [
        'markers',
        'multiAxis',
        'referenceLines',
        'interlocks',
        'zoom',
        'pan'
      ],
      renderer: async (config) => {
        const { renderScatterPlot } = await import('@/components/charts/ChartPreview/ScatterPlot')
        renderScatterPlot(config as any)
      }
    })
    
    // Placeholder for future chart types
    // Register Bar Chart
    this.registerChartType({
      type: 'bar',
      name: 'Bar Chart',
      description: 'Display data as vertical or horizontal bars',
      icon: 'bar-chart',
      defaultConfig: {
        type: 'bar',
        xAxisType: 'category',
        yAxisParams: []
      },
      supportedFeatures: [
        'bars',
        'multiAxis',
        'referenceLines',
        'animations'
      ],
      renderer: async (config) => {
        // Placeholder - implement BarChart when ready
        console.warn('Bar chart not yet implemented')
        const { renderEmptyChart } = await import('@/components/charts/ChartPreview/EmptyChart')
        renderEmptyChart({ ...config, chartType: 'bar' })
      }
    })
    
    // Register Area Chart
    this.registerChartType({
      type: 'area',
      name: 'Area Chart',
      description: 'Display data as filled areas under lines',
      icon: 'area-chart',
      defaultConfig: {
        type: 'area',
        xAxisType: 'datetime',
        yAxisParams: []
      },
      supportedFeatures: [
        'areas',
        'lines',
        'markers',
        'multiAxis',
        'referenceLines',
        'animations',
        'zoom',
        'pan'
      ],
      renderer: async (config) => {
        // Placeholder - implement AreaChart when ready
        console.warn('Area chart not yet implemented')
        const { renderEmptyChart } = await import('@/components/charts/ChartPreview/EmptyChart')
        renderEmptyChart({ ...config, chartType: 'area' })
      }
    })
  }
  
  /**
   * Get chart types that support a specific feature
   */
  getChartTypesWithFeature(feature: ChartFeature): ChartTypeDefinition[] {
    return this.getAllChartTypes().filter(type => 
      type.supportedFeatures.includes(feature)
    )
  }
  
  /**
   * Validate if a chart configuration is valid for its type
   */
  validateChartConfig(chart: ChartComponent): boolean {
    const type = chart.type || 'line'
    const definition = this.getChartType(type)
    
    if (!definition) {
      console.error(`Unknown chart type: ${type}`)
      return false
    }
    
    // Check if chart uses features it doesn't support
    if (chart.referenceLines && chart.referenceLines.length > 0) {
      if (!definition.supportedFeatures.includes('referenceLines')) {
        console.warn(`Chart type "${type}" does not support reference lines`)
      }
    }
    
    if (chart.yAxisParams && chart.yAxisParams.some(p => p.marker)) {
      if (!definition.supportedFeatures.includes('markers')) {
        console.warn(`Chart type "${type}" does not support markers`)
      }
    }
    
    return true
  }
}

// Export singleton instance
export const chartRegistry = ChartRegistry.getInstance()