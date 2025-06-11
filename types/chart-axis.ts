// Types for chart axis handling
export type XAxisValue = number | string | Date

export interface AxisConversionUtils {
  convertToXValue: (value: any, axisType: string) => XAxisValue | undefined
  formatXValue: (value: XAxisValue, axisType: string) => string
  getXDomain: (data: XAxisValue[], axisType: string) => [any, any]
}

export const isValidXValue = (value: any): boolean => {
  return value !== undefined && value !== null && value !== ''
}

export const isValidYValue = (value: any): boolean => {
  return value !== undefined && value !== null && (
    typeof value === 'number' || !isNaN(Number(value))
  )
}