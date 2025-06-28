import { EventInfo } from '@/types'
import { EnhancedParameter } from './dataSourceParameterUtils'
import { useCSVDataStore } from '@/stores/useCSVDataStore'

/**
 * Generate a period ID from EventInfo
 * This matches the periodId format used in CSV data store
 */
export function getPeriodIdFromEventInfo(eventInfo: EventInfo): string {
  // Format: plant_machineNo_sourceType_start_end
  // For now, we don't have sourceType in EventInfo, so we'll use a simplified format
  return `${eventInfo.plant}_${eventInfo.machineNo}_${eventInfo.start}_${eventInfo.end}`
}

/**
 * Get parameters from CSV data for given EventInfo items
 */
export function getParametersFromCSVData(selectedDataSourceItems?: EventInfo[]): EnhancedParameter[] {
  if (!selectedDataSourceItems || selectedDataSourceItems.length === 0) {
    return []
  }

  const csvStore = useCSVDataStore.getState()
  const allParameters = new Map<string, EnhancedParameter>()

  // Extract parameters from each selected data source
  selectedDataSourceItems.forEach(eventInfo => {
    // Check if the EventInfo ID already matches a CSV dataset
    // This handles both DataSourceTab imports (collected_xxx format) and direct imports
    if (csvStore.getAvailableParameters(eventInfo.id).length > 0) {
      const availableParams = csvStore.getAvailableParameters(eventInfo.id)
      availableParams.forEach(param => {
        const key = `${param.name}|${param.unit}`
        
        if (!allParameters.has(key)) {
          allParameters.set(key, {
            id: `ds_${param.name}`,
            name: param.name,
            unit: param.unit,
            plant: eventInfo.plant,
            machineNo: eventInfo.machineNo,
            source: 'DataSource',
            isFromDataSource: true
          })
        }
      })
    } else {
      // If not found, try to find CSV data by matching plant and machineNo
      // This is for backward compatibility
      const datasets = csvStore.datasets
      datasets.forEach((dataset, periodId) => {
        if (dataset.plant === eventInfo.plant && dataset.machineNo === eventInfo.machineNo) {
          dataset.parameters.forEach(paramName => {
            const unit = dataset.units[paramName] || ''
            const key = `${paramName}|${unit}`
            
            if (!allParameters.has(key)) {
              allParameters.set(key, {
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
        }
      })
    }
  })

  return Array.from(allParameters.values())
}

/**
 * Check if any parameters are available for the given data sources
 */
export function hasParametersForDataSources(selectedDataSourceItems?: EventInfo[]): boolean {
  if (!selectedDataSourceItems || selectedDataSourceItems.length === 0) {
    return false
  }

  const parameters = getParametersFromCSVData(selectedDataSourceItems)
  return parameters.length > 0
}