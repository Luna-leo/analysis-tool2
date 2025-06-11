export interface DataPoint {
  timestamp: string
  [key: string]: string | number | undefined
}

export function transformToDataPoints(
  data: any[],
  parameters: string[],
  timestampField = 'timestamp'
): DataPoint[] {
  return data.map(row => {
    const point: DataPoint = {
      timestamp: row[timestampField] || new Date().toISOString()
    }
    
    parameters.forEach(param => {
      if (row[param] !== undefined) {
        point[param] = row[param]
      }
    })
    
    return point
  })
}

export function extractParameterData(
  dataPoint: DataPoint,
  parameters: string[],
  cleanParams = true
): Partial<DataPoint> {
  const result: Partial<DataPoint> = {
    timestamp: dataPoint.timestamp
  }
  
  parameters.forEach(param => {
    const searchParam = cleanParams && param.includes('|') ? param.split('|')[0] : param
    if (dataPoint[searchParam] !== undefined) {
      result[param] = dataPoint[searchParam]
    }
  })
  
  return result
}