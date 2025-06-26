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
    // Try different periodId formats to find matching CSV data
    const possiblePeriodIds = [
      getPeriodIdFromEventInfo(eventInfo),
      // Also try with the event ID directly as some CSV data might use that
      eventInfo.id,
      // Try without timestamps for batch imports
      `${eventInfo.plant}_${eventInfo.machineNo}`
    ]

    for (const periodId of possiblePeriodIds) {
      const availableParams = csvStore.getAvailableParameters(periodId)
      
      if (availableParams.length > 0) {
        // Found parameters for this data source
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
        break // Found data, no need to try other periodId formats
      }
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