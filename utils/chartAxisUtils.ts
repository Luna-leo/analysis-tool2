import { XAxisValue, isValidXValue } from '@/types/chart-axis'

export function convertToXValue(
  value: any, 
  axisType: string,
  timestamp?: string
): XAxisValue | undefined {
  if (!isValidXValue(value) && axisType !== 'datetime') {
    return undefined
  }

  switch (axisType) {
    case 'datetime':
      // For datetime, use the timestamp field
      return timestamp || value

    case 'time':
      // For elapsed time, convert to minutes
      if (typeof value === 'string' && value.includes(':')) {
        // Parse time format (HH:MM:SS or MM:SS)
        const parts = value.split(':').map(Number)
        if (parts.length === 3) {
          return parts[0] * 60 + parts[1] + parts[2] / 60 // Convert to minutes
        } else if (parts.length === 2) {
          return parts[0] + parts[1] / 60 // Convert to minutes
        }
      } else if (typeof value === 'string') {
        return parseFloat(value)
      }
      return value

    default:
      // For numeric parameters
      if (typeof value === 'string' && !isNaN(Number(value))) {
        return Number(value)
      }
      return value
  }
}

export function formatXValue(value: XAxisValue, axisType: string): string {
  switch (axisType) {
    case 'datetime':
      return new Date(value as string).toLocaleString()
      
    case 'time':
      const minutes = Number(value)
      const hours = Math.floor(minutes / 60)
      const mins = Math.floor(minutes % 60)
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
      
    default:
      return typeof value === 'number' ? value.toFixed(3) : String(value)
  }
}

export function getXValueForScale(value: XAxisValue, axisType: string): number | Date {
  if (axisType === 'datetime') {
    return new Date(value as string)
  }
  return value as number
}