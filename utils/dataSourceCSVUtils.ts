import { EventInfo } from '@/types'
import { EnhancedParameter } from './dataSourceParameterUtils'
import { CSVDataSet } from '@/stores/useCSVDataStore'
import { createLogger } from '@/utils/logger'

const logger = createLogger('dataSourceCSVUtils')

/**
 * Find CSV data that matches the given EventInfo (data source)
 * Matches based on plant, machineNo, and potentially time range
 */
export function findCSVDataForEventInfo(
  eventInfo: EventInfo,
  csvDatasets: Map<string, CSVDataSet>
): CSVDataSet[] {
  const matchingDatasets: CSVDataSet[] = []
  
  logger.debug('findCSVDataForEventInfo called', {
    eventInfoId: eventInfo.id,
    plant: eventInfo.plant,
    machineNo: eventInfo.machineNo,
    availableDatasetIds: Array.from(csvDatasets.keys())
  })
  
  // First, try to find by exact EventInfo ID match
  // This handles DataSourceTab imports where EventInfo.id === periodId
  if (csvDatasets.has(eventInfo.id)) {
    const dataset = csvDatasets.get(eventInfo.id)
    if (dataset) {
      matchingDatasets.push(dataset)
      logger.debug('Found exact match by EventInfo ID', {
        eventInfoId: eventInfo.id,
        parameters: dataset.parameters
      })
      return matchingDatasets // Return early if exact match found
    }
  }
  
  // Fallback: Match by plant and machineNo
  csvDatasets.forEach((dataset) => {
    // Match by plant and machineNo
    if (dataset.plant === eventInfo.plant && dataset.machineNo === eventInfo.machineNo) {
      // TODO: In the future, we could also match by time range overlap
      // For now, we match all datasets for the same plant/machine
      matchingDatasets.push(dataset)
    }
  })
  
  logger.debug('findCSVDataForEventInfo results', {
    eventInfoId: eventInfo.id,
    matchCount: matchingDatasets.length,
    parameterCounts: matchingDatasets.map(d => d.parameters.length)
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
  
  logger.debug('extractParametersFromCSVDatasets called', {
    datasetCount: datasets.length,
    eventInfoId: eventInfo.id
  })
  
  datasets.forEach((dataset, index) => {
    logger.debug(`Processing dataset ${index + 1}`, {
      periodId: dataset.periodId,
      parameterCount: dataset.parameters.length,
      parameters: dataset.parameters
    })
    
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
  
  const result = Array.from(parameterMap.values())
  logger.debug('extractParametersFromCSVDatasets results', {
    uniqueParameterCount: result.length,
    parameters: result.map(p => `${p.name} (${p.unit})`)
  })
  
  return result
}

/**
 * Get all unique parameters from multiple EventInfo data sources
 */
export function getParametersFromDataSources(
  eventInfoList: EventInfo[],
  csvDatasets: Map<string, CSVDataSet>
): EnhancedParameter[] {
  const allParameters = new Map<string, EnhancedParameter>()
  
  logger.debug('getParametersFromDataSources called', {
    eventInfoCount: eventInfoList.length,
    csvDatasetCount: csvDatasets.size,
    eventInfoIds: eventInfoList.map(e => e.id)
  })
  
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
  
  const result = Array.from(allParameters.values())
  logger.debug('getParametersFromDataSources final results', {
    totalUniqueParameters: result.length,
    parameters: result.map(p => `${p.name} (${p.unit})`)
  })
  
  return result
}