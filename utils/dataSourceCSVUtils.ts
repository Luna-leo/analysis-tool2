import { EventInfo } from '@/types'
import { EnhancedParameter } from './dataSourceParameterUtils'
import { CSVDataSet } from '@/stores/useCSVDataStore'

/**
 * Find CSV data that matches the given EventInfo (data source)
 * Matches based on plant, machineNo, and potentially time range
 */
export function findCSVDataForEventInfo(
  eventInfo: EventInfo,
  csvDatasets: Map<string, CSVDataSet>
): CSVDataSet[] {
  const matchingDatasets: CSVDataSet[] = []
  
  csvDatasets.forEach((dataset) => {
    // Match by plant and machineNo
    if (dataset.plant === eventInfo.plant && dataset.machineNo === eventInfo.machineNo) {
      // TODO: In the future, we could also match by time range overlap
      // For now, we match all datasets for the same plant/machine
      matchingDatasets.push(dataset)
    }
  })
  
  return matchingDatasets
}

/**
 * Extract parameters from CSV datasets and convert to EnhancedParameter format
 */
export function extractParametersFromCSVDatasets(
  datasets: CSVDataSet[],
  eventInfo: EventInfo
): EnhancedParameter[] {
  const parameterMap = new Map<string, EnhancedParameter>()
  
  datasets.forEach(dataset => {
    dataset.parameters.forEach(paramName => {
      const unit = dataset.units[paramName] || ''
      const key = `${paramName}|${unit}`
      
      // Only add if we haven't seen this parameter+unit combination
      if (!parameterMap.has(key)) {
        parameterMap.set(key, {
          id: `ds_${paramName}`,
          name: paramName,
          unit: unit,
          plant: eventInfo.plant,
          machineNo: eventInfo.machineNo,
          source: 'DataSource',
          isFromDataSource: true
        })
      }
    })
  })
  
  return Array.from(parameterMap.values())
}

/**
 * Get all unique parameters from multiple EventInfo data sources
 */
export function getParametersFromDataSources(
  eventInfoList: EventInfo[],
  csvDatasets: Map<string, CSVDataSet>
): EnhancedParameter[] {
  const allParameters = new Map<string, EnhancedParameter>()
  
  eventInfoList.forEach(eventInfo => {
    const matchingDatasets = findCSVDataForEventInfo(eventInfo, csvDatasets)
    const parameters = extractParametersFromCSVDatasets(matchingDatasets, eventInfo)
    
    parameters.forEach(param => {
      const key = `${param.name}|${param.unit}`
      // Use the first occurrence of each parameter
      if (!allParameters.has(key)) {
        allParameters.set(key, param)
      }
    })
  })
  
  return Array.from(allParameters.values())
}