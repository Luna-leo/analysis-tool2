// Data processing worker for heavy computations

// LTTB algorithm implementation
function lttbSample(data, targetPoints) {
  if (data.length <= targetPoints || targetPoints < 3) {
    return data
  }

  const sampled = []
  
  // Always keep first and last points
  sampled.push(data[0])
  
  // Calculate bucket size
  const bucketSize = (data.length - 2) / (targetPoints - 2)
  
  let a = 0 // Previous selected point
  
  for (let i = 0; i < targetPoints - 2; i++) {
    // Calculate bucket boundaries
    const bucketStart = Math.floor((i + 1) * bucketSize) + 1
    const bucketEnd = Math.floor((i + 2) * bucketSize) + 1
    const bucketMiddle = Math.floor((bucketStart + bucketEnd) / 2)
    
    // Calculate average point for next bucket
    let avgX = 0
    let avgY = 0
    let avgCount = 0
    
    for (let j = bucketEnd; j < Math.min(data.length, Math.floor((i + 3) * bucketSize) + 1); j++) {
      avgX += data[j].x
      avgY += data[j].y
      avgCount++
    }
    
    if (avgCount > 0) {
      avgX /= avgCount
      avgY /= avgCount
    }
    
    // Find point in current bucket with largest triangle area
    let maxArea = -1
    let maxAreaIndex = bucketMiddle
    
    for (let j = bucketStart; j < bucketEnd && j < data.length; j++) {
      // Calculate triangle area
      const area = Math.abs(
        (data[a].x - avgX) * (data[j].y - data[a].y) -
        (data[a].x - data[j].x) * (avgY - data[a].y)
      ) * 0.5
      
      if (area > maxArea) {
        maxArea = area
        maxAreaIndex = j
      }
    }
    
    sampled.push(data[maxAreaIndex])
    a = maxAreaIndex
  }
  
  // Add last point
  sampled.push(data[data.length - 1])
  
  return sampled
}

// Process data message
self.addEventListener('message', function(e) {
  const { action, data, params } = e.data
  
  switch (action) {
    case 'sample':
      const { points, targetPoints } = params
      const sampled = lttbSample(points, targetPoints)
      self.postMessage({ action: 'sampled', data: sampled })
      break
      
    case 'transform':
      const { csvData, parameters, editingChart } = params
      const transformed = []
      
      csvData.forEach(point => {
        const cleanXParam = editingChart.xParameter?.includes('|') 
          ? editingChart.xParameter.split('|')[0] 
          : editingChart.xParameter
        
        const rawXValue = cleanXParam ? point[cleanXParam] : undefined
        let xValue
        
        if (editingChart.xAxisType === 'datetime') {
          xValue = point.timestamp
        } else if (rawXValue !== undefined) {
          xValue = Number(rawXValue)
        }
        
        editingChart.yAxisParams?.forEach((yParam, index) => {
          const cleanParam = yParam.parameter.includes('|') 
            ? yParam.parameter.split('|')[0] 
            : yParam.parameter
          
          let yValue = point[cleanParam]
          
          if (typeof yValue === 'string' && !isNaN(Number(yValue))) {
            yValue = Number(yValue)
          }
          
          if (xValue !== undefined && typeof yValue === 'number' && !isNaN(yValue)) {
            transformed.push({
              x: xValue,
              y: yValue,
              series: yParam.parameter,
              seriesIndex: index,
              timestamp: point.timestamp,
              dataSourceId: params.dataSourceId,
              dataSourceLabel: params.dataSourceLabel
            })
          }
        })
      })
      
      self.postMessage({ action: 'transformed', data: transformed })
      break
      
    case 'aggregate':
      // Aggregate data points by time intervals
      const { points: aggPoints, interval } = params
      const aggregated = new Map()
      
      aggPoints.forEach(point => {
        const time = new Date(point.timestamp)
        const key = Math.floor(time.getTime() / interval) * interval
        
        if (!aggregated.has(key)) {
          aggregated.set(key, {
            timestamp: new Date(key).toISOString(),
            values: [],
            count: 0
          })
        }
        
        const agg = aggregated.get(key)
        agg.values.push(point)
        agg.count++
      })
      
      const result = Array.from(aggregated.values()).map(agg => {
        // Calculate averages
        const averaged = {}
        parameters.forEach(param => {
          const values = agg.values.map(v => v[param]).filter(v => v !== undefined)
          if (values.length > 0) {
            averaged[param] = values.reduce((a, b) => a + b, 0) / values.length
          }
        })
        
        return {
          timestamp: agg.timestamp,
          ...averaged
        }
      })
      
      self.postMessage({ action: 'aggregated', data: result })
      break
      
    default:
      self.postMessage({ action: 'error', error: 'Unknown action' })
  }
})