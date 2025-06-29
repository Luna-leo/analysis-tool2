// Web Worker for processing chart data
// This is a compiled version for Next.js compatibility

// Simple sampling function (nth-point)
function sampleNthPoint(data, targetPoints) {
  if (data.length <= targetPoints) return data;
  
  const step = Math.ceil(data.length / targetPoints);
  const sampled = [];
  
  for (let i = 0; i < data.length; i += step) {
    sampled.push(data[i]);
  }
  
  return sampled;
}

// Handle sampling request
async function handleSampling(id, data, options) {
  try {
    sendProgress(id, 0);
    
    // Group by series
    const seriesMap = new Map();
    data.forEach((point, index) => {
      const series = seriesMap.get(point.series) || [];
      series.push(point);
      seriesMap.set(point.series, series);
      
      if (index % 1000 === 0) {
        sendProgress(id, (index / data.length) * 30);
      }
    });
    
    // Sample each series
    const sampledData = [];
    let processedSeries = 0;
    const totalSeries = seriesMap.size;
    
    seriesMap.forEach((seriesData, seriesName) => {
      const sampled = sampleNthPoint(seriesData, Math.floor(options.targetPoints / totalSeries));
      sampledData.push(...sampled);
      processedSeries++;
      sendProgress(id, 30 + (processedSeries / totalSeries) * 70);
    });
    
    // Sort by time if needed
    if (options.isTimeSeries) {
      sampledData.sort((a, b) => {
        const aTime = a.x instanceof Date ? a.x.getTime() : new Date(a.x).getTime();
        const bTime = b.x instanceof Date ? b.x.getTime() : new Date(b.x).getTime();
        return aTime - bTime;
      });
    }
    
    sendSuccess(id, sampledData);
  } catch (error) {
    sendError(id, error.message || 'Sampling failed');
  }
}

// Handle coordinate transformation
async function handleTransform(id, data, options) {
  try {
    const { points, xAxisType, xParameter, yParams } = data;
    const chunkSize = options.chunkSize || 1000;
    const transformedData = [];
    
    for (let i = 0; i < points.length; i += chunkSize) {
      const chunk = points.slice(i, i + chunkSize);
      const transformedChunk = chunk.flatMap(point => {
        let xValue;
        
        if (xAxisType === 'datetime') {
          xValue = new Date(point.timestamp);
        } else if (xParameter && point[xParameter] !== undefined) {
          const numValue = Number(point[xParameter]);
          if (!isNaN(numValue)) {
            xValue = numValue;
          }
        }
        
        return yParams
          .filter(yParam => yParam.parameter)
          .map((yParam, index) => {
            const yValue = point[yParam.parameter];
            const numY = typeof yValue === 'string' ? Number(yValue) : yValue;
            
            if (xValue !== undefined && typeof numY === 'number' && !isNaN(numY)) {
              return {
                x: xValue,
                y: numY,
                series: yParam.parameter,
                seriesIndex: index,
                timestamp: point.timestamp,
                originalPoint: point
              };
            }
            return null;
          })
          .filter(Boolean);
      });
      
      transformedData.push(...transformedChunk);
      sendProgress(id, ((i + chunk.length) / points.length) * 100);
    }
    
    sendSuccess(id, transformedData);
  } catch (error) {
    sendError(id, error.message || 'Transform failed');
  }
}

// Handle full process pipeline
async function handleFullProcess(id, data, options) {
  try {
    sendProgress(id, 0);
    
    const { rawData, xAxisType, xParameter, yParams, dataSourceInfo } = data;
    const { enableSampling, samplingMethod, targetPoints, chartType } = options;
    
    // Check if rawData is already transformed (has x, y properties)
    const isAlreadyTransformed = rawData.length > 0 && rawData[0].hasOwnProperty('x') && rawData[0].hasOwnProperty('y');
    
    let transformedData;
    
    if (isAlreadyTransformed) {
      // Data is already transformed, just use it
      transformedData = rawData;
      sendProgress(id, 50);
    } else {
      // Step 1: Transform coordinates (0-50% progress)
      transformedData = [];
      const chunkSize = 1000;
      
      for (let dataSourceIndex = 0; dataSourceIndex < dataSourceInfo.length; dataSourceIndex++) {
        const dataSource = dataSourceInfo[dataSourceIndex];
        const dataSourceData = rawData.filter(point => point.dataSourceId === dataSource.id);
        
        for (let i = 0; i < dataSourceData.length; i += chunkSize) {
          const chunk = dataSourceData.slice(i, i + chunkSize);
          
          chunk.forEach(point => {
            let xValue;
            
            if (xAxisType === 'datetime') {
              xValue = new Date(point.timestamp);
            } else if (xParameter) {
              const cleanXParam = xParameter.includes('|') ? xParameter.split('|')[0] : xParameter;
              const rawXValue = point[cleanXParam];
              if (rawXValue !== undefined) {
                const numValue = Number(rawXValue);
                if (!isNaN(numValue)) {
                  xValue = numValue;
                }
              }
            }
            
            if (xValue !== undefined) {
              yParams.forEach((yParam, paramIndex) => {
                if (!yParam.parameter) return;
                
                const cleanParam = yParam.parameter.includes('|') 
                  ? yParam.parameter.split('|')[0] 
                  : yParam.parameter;
                
                const yValue = point[cleanParam];
                const numY = typeof yValue === 'string' ? Number(yValue) : yValue;
                
                if (typeof numY === 'number' && !isNaN(numY)) {
                  const uniqueSeriesIndex = dataSourceIndex * yParams.length + paramIndex;
                  
                  transformedData.push({
                    x: xValue,
                    y: numY,
                    series: `${dataSource.label} - ${yParam.parameter}`,
                    seriesIndex: uniqueSeriesIndex,
                    timestamp: point.timestamp,
                    dataSourceId: dataSource.id,
                    dataSourceLabel: dataSource.label,
                    dataSourceIndex: dataSourceIndex,
                    paramIndex: paramIndex
                  });
                }
              });
            }
          });
          
          const overallProgress = ((dataSourceIndex + (i + chunk.length) / dataSourceData.length) / dataSourceInfo.length) * 50;
          sendProgress(id, overallProgress);
        }
      }
    }
    
    // Step 2: Apply sampling if needed (50-100% progress)
    let finalData = transformedData;
    
    if (enableSampling && transformedData.length > targetPoints) {
      sendProgress(id, 50);
      
      // Group by series for better sampling
      const seriesMap = new Map();
      transformedData.forEach(point => {
        const series = seriesMap.get(point.series) || [];
        series.push(point);
        seriesMap.set(point.series, series);
      });
      
      // Sample each series
      finalData = [];
      let processedSeries = 0;
      const totalSeries = seriesMap.size;
      const pointsPerSeries = Math.floor(targetPoints / totalSeries);
      
      seriesMap.forEach((seriesData, seriesName) => {
        const sampled = sampleNthPoint(seriesData, pointsPerSeries);
        finalData.push(...sampled);
        processedSeries++;
        sendProgress(id, 50 + (processedSeries / totalSeries) * 50);
      });
      
      // Sort by time if needed
      if (xAxisType === 'datetime') {
        finalData.sort((a, b) => {
          try {
            const aTime = a.x instanceof Date ? a.x.getTime() : new Date(a.x).getTime();
            const bTime = b.x instanceof Date ? b.x.getTime() : new Date(b.x).getTime();
            return aTime - bTime;
          } catch (e) {
            // If date parsing fails, maintain original order
            return 0;
          }
        });
      }
    }
    
    sendProgress(id, 100);
    sendSuccess(id, finalData);
  } catch (error) {
    console.error('Process error:', error);
    sendError(id, error.message || 'Process failed');
  }
}

// Message passing helpers
function sendSuccess(id, data) {
  self.postMessage({
    id,
    type: 'success',
    data
  });
}

function sendError(id, error) {
  self.postMessage({
    id,
    type: 'error',
    error
  });
}

function sendProgress(id, progress) {
  self.postMessage({
    id,
    type: 'progress',
    progress: Math.round(progress)
  });
}

// Message handler
self.addEventListener('message', async (event) => {
  const { id, type, data, options } = event.data;
  
  try {
    switch (type) {
      case 'sample':
        await handleSampling(id, data, options);
        break;
      
      case 'transform':
        await handleTransform(id, data, options);
        break;
      
      case 'process':
        await handleFullProcess(id, data, options);
        break;
      
      default:
        sendError(id, `Unknown request type: ${type}`);
    }
  } catch (error) {
    console.error('Worker processing error:', error);
    sendError(id, error.message || 'Unknown error');
  }
});

console.log('Chart data processor worker initialized');