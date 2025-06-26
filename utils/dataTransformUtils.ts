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

let debugLogged = false

export function extractParameterData(
  dataPoint: DataPoint,
  parameters: string[],
  cleanParams = true
): Partial<DataPoint> {
  const result: Partial<DataPoint> = {
    timestamp: dataPoint.timestamp
  }
  
  const missingParams: string[] = []
  
  parameters.forEach(param => {
    const searchParam = cleanParams && param.includes('|') ? param.split('|')[0] : param
    if (dataPoint[searchParam] !== undefined) {
      result[param] = dataPoint[searchParam]
    } else {
      missingParams.push(searchParam)
    }
  })
  
  // Log only once per session if there are missing parameters
  if (missingParams.length > 0 && !debugLogged) {
    debugLogged = true
    console.warn('Missing parameters in data point:', {
      missingParams,
      requestedParams: parameters,
      availableKeys: Object.keys(dataPoint).filter(k => k !== 'timestamp'),
      sampleDataPoint: dataPoint
    })
  }
  
  return result
}