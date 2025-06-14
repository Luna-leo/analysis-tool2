import { ChartComponent, AxisType } from "@/types"

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  severity: 'error'
}

export interface ValidationWarning {
  field: string
  message: string
  severity: 'warning'
}

/**
 * Chart validation utilities
 * Provides comprehensive validation for chart configuration and data
 */
export class ChartValidator {
  
  /**
   * Validate complete chart configuration
   */
  static validateChart(chart: ChartComponent): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    
    // Validate basic properties
    this.validateBasicProperties(chart, errors, warnings)
    
    // Validate axis configuration
    this.validateAxisConfiguration(chart, errors, warnings)
    
    // Validate Y parameters
    this.validateYParameters(chart, errors, warnings)
    
    // Validate reference lines
    this.validateReferenceLines(chart, errors, warnings)
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  /**
   * Validate chart data
   */
  static validateData(
    data: any[],
    chart: ChartComponent
  ): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    
    if (!data || !Array.isArray(data)) {
      errors.push({
        field: 'data',
        message: 'Data must be an array',
        severity: 'error'
      })
      return { isValid: false, errors, warnings }
    }
    
    if (data.length === 0) {
      warnings.push({
        field: 'data',
        message: 'No data points to display',
        severity: 'warning'
      })
      return { isValid: true, errors, warnings }
    }
    
    // Validate data structure
    this.validateDataStructure(data, chart, errors, warnings)
    
    // Validate data values
    this.validateDataValues(data, chart, errors, warnings)
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  /**
   * Validate basic chart properties
   */
  private static validateBasicProperties(
    chart: ChartComponent,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check required fields
    if (!chart.id) {
      errors.push({
        field: 'id',
        message: 'Chart ID is required',
        severity: 'error'
      })
    }
    
    // Check title
    if (!chart.title || chart.title.trim() === '') {
      warnings.push({
        field: 'title',
        message: 'Chart title is empty',
        severity: 'warning'
      })
    }
    
    // Check chart type
    const validTypes = ['line', 'scatter', 'bar', 'area']
    if (chart.type && !validTypes.includes(chart.type)) {
      warnings.push({
        field: 'type',
        message: `Unknown chart type: ${chart.type}`,
        severity: 'warning'
      })
    }
  }
  
  /**
   * Validate axis configuration
   */
  private static validateAxisConfiguration(
    chart: ChartComponent,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Validate X axis type
    const validAxisTypes: AxisType[] = ['datetime', 'time', 'numeric', 'category', 'parameter']
    if (chart.xAxisType && !validAxisTypes.includes(chart.xAxisType)) {
      errors.push({
        field: 'xAxisType',
        message: `Invalid X axis type: ${chart.xAxisType}`,
        severity: 'error'
      })
    }
    
    // Validate X axis range
    if (chart.xAxisRange) {
      if (chart.xAxisRange.auto === false) {
        if (!chart.xAxisRange.min || !chart.xAxisRange.max) {
          errors.push({
            field: 'xAxisRange',
            message: 'Manual axis range requires both min and max values',
            severity: 'error'
          })
        } else if (chart.xAxisRange.min >= chart.xAxisRange.max) {
          errors.push({
            field: 'xAxisRange',
            message: 'X axis min must be less than max',
            severity: 'error'
          })
        }
      }
    }
    
    // Validate X parameter
    if (!chart.xParameter) {
      warnings.push({
        field: 'xParameter',
        message: 'X parameter not specified, using default "timestamp"',
        severity: 'warning'
      })
    }
  }
  
  /**
   * Validate Y parameters
   */
  private static validateYParameters(
    chart: ChartComponent,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const yParams = chart.yAxisParams || []
    
    if (yParams.length === 0) {
      warnings.push({
        field: 'yAxisParams',
        message: 'No Y parameters configured',
        severity: 'warning'
      })
      return
    }
    
    // Check for valid parameters
    const validParams = yParams.filter(p => p.parameter && p.parameter.trim() !== '')
    if (validParams.length === 0) {
      errors.push({
        field: 'yAxisParams',
        message: 'At least one Y parameter must be configured',
        severity: 'error'
      })
    }
    
    // Validate each parameter
    yParams.forEach((param, index) => {
      if (!param.parameter || param.parameter.trim() === '') {
        return // Skip empty parameters
      }
      
      // Check axis number
      if (param.axisNo && (param.axisNo < 1 || param.axisNo > 4)) {
        warnings.push({
          field: `yAxisParams[${index}].axisNo`,
          message: 'Axis number should be between 1 and 4',
          severity: 'warning'
        })
      }
      
      // Check range configuration
      if (param.range?.auto === false) {
        if (param.range.min >= param.range.max) {
          errors.push({
            field: `yAxisParams[${index}].range`,
            message: 'Y axis min must be less than max',
            severity: 'error'
          })
        }
      }
      
      // Validate marker configuration
      if (param.marker) {
        const validMarkers = ['circle', 'square', 'triangle', 'diamond', 'star', 'cross']
        if (!validMarkers.includes(param.marker.type)) {
          warnings.push({
            field: `yAxisParams[${index}].marker.type`,
            message: `Unknown marker type: ${param.marker.type}`,
            severity: 'warning'
          })
        }
      }
    })
  }
  
  /**
   * Validate reference lines
   */
  private static validateReferenceLines(
    chart: ChartComponent,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const refLines = chart.referenceLines || []
    
    refLines.forEach((line, index) => {
      if (!line.type || !['vertical', 'horizontal', 'interlock'].includes(line.type)) {
        errors.push({
          field: `referenceLines[${index}].type`,
          message: 'Invalid reference line type',
          severity: 'error'
        })
      }
      
      if (line.value === null || line.value === undefined) {
        errors.push({
          field: `referenceLines[${index}].value`,
          message: 'Reference line value is required',
          severity: 'error'
        })
      }
    })
  }
  
  /**
   * Validate data structure
   */
  private static validateDataStructure(
    data: any[],
    chart: ChartComponent,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const xParameter = chart.xParameter || 'timestamp'
    const yParams = chart.yAxisParams || []
    
    // Check first item structure
    const firstItem = data[0]
    
    // Check X parameter exists
    if (!(xParameter in firstItem)) {
      errors.push({
        field: 'data',
        message: `X parameter "${xParameter}" not found in data`,
        severity: 'error'
      })
    }
    
    // Check Y parameters exist
    yParams.forEach(param => {
      if (param.parameter && !(param.parameter in firstItem)) {
        warnings.push({
          field: 'data',
          message: `Y parameter "${param.parameter}" not found in data`,
          severity: 'warning'
        })
      }
    })
  }
  
  /**
   * Validate data values
   */
  private static validateDataValues(
    data: any[],
    chart: ChartComponent,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const xParameter = chart.xParameter || 'timestamp'
    let invalidXValues = 0
    let invalidYValues = 0
    
    data.forEach((item, index) => {
      // Validate X value
      const xValue = item[xParameter]
      if (xValue === null || xValue === undefined) {
        invalidXValues++
      } else if (chart.xAxisType === 'datetime') {
        const date = new Date(xValue)
        if (isNaN(date.getTime())) {
          invalidXValues++
        }
      } else if (chart.xAxisType === 'numeric' || chart.xAxisType === 'parameter') {
        if (isNaN(Number(xValue))) {
          invalidXValues++
        }
      }
      
      // Validate Y values
      chart.yAxisParams?.forEach(param => {
        if (param.parameter) {
          const yValue = item[param.parameter]
          if (yValue !== null && yValue !== undefined && isNaN(Number(yValue))) {
            invalidYValues++
          }
        }
      })
    })
    
    if (invalidXValues > 0) {
      warnings.push({
        field: 'data',
        message: `${invalidXValues} invalid X values found`,
        severity: 'warning'
      })
    }
    
    if (invalidYValues > 0) {
      warnings.push({
        field: 'data',
        message: `${invalidYValues} invalid Y values found`,
        severity: 'warning'
      })
    }
  }
  
  /**
   * Get default chart configuration for error cases
   */
  static getDefaultChartConfig(): Partial<ChartComponent> {
    return {
      title: 'Chart',
      showTitle: true,
      xAxisType: 'datetime',
      xParameter: 'timestamp',
      yAxisParams: [],
      xAxisRange: { auto: true, min: 0, max: 100 }
    }
  }
  
  /**
   * Fix common chart configuration issues
   */
  static fixChartConfig(chart: ChartComponent): ChartComponent {
    const fixed = { ...chart }
    
    // Fix missing required fields
    if (!fixed.id) {
      fixed.id = `chart-${Date.now()}`
    }
    
    if (!fixed.title) {
      fixed.title = 'Untitled Chart'
    }
    
    if (!fixed.xParameter) {
      fixed.xParameter = 'timestamp'
    }
    
    if (!fixed.xAxisType) {
      fixed.xAxisType = 'datetime'
    }
    
    if (!fixed.yAxisParams) {
      fixed.yAxisParams = []
    }
    
    // Fix axis ranges
    if (fixed.xAxisRange?.auto === false) {
      if (!fixed.xAxisRange.min || !fixed.xAxisRange.max || fixed.xAxisRange.min >= fixed.xAxisRange.max) {
        fixed.xAxisRange.auto = true
      }
    }
    
    // Fix Y parameter ranges
    fixed.yAxisParams = fixed.yAxisParams.map(param => {
      if (param.range?.auto === false && param.range.min >= param.range.max) {
        return { ...param, range: { ...param.range, auto: true } }
      }
      return param
    })
    
    return fixed
  }
}