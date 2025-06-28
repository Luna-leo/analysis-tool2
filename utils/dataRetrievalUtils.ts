import { getPlantMachineData, filterDataByDateRange } from './plantMachineDataUtils'
import { getCSVDataFromDB, getAllCSVMetadataFromDB } from './indexedDBUtils'
import { CSVDataPoint } from '@/stores/useCSVDataStore'
import { SearchResult, SearchCondition, EventInfo } from '@/types'
import { createLogger } from './logger'

const logger = createLogger('DataRetrievalUtils')

// Define error types for better error handling
export class DataRetrievalError extends Error {
  constructor(
    message: string,
    public code: 'PLANT_MACHINE_ERROR' | 'PERIOD_STORE_ERROR' | 'NO_DATA' | 'UNKNOWN_ERROR',
    public details?: any
  ) {
    super(message)
    this.name = 'DataRetrievalError'
  }
}

/**
 * Get data for a specific period from Plant/Machine store or period-based store
 */
export async function getDataForPeriod(
  plant: string,
  machineNo: string,
  startDate: string,
  endDate: string
): Promise<CSVDataPoint[]> {
  try {
    // First, try to get data from Plant/Machine store
    const plantMachineId = `${plant}_${machineNo}`
    const plantMachineData = await getPlantMachineData(plantMachineId)
    
    if (plantMachineData && plantMachineData.data.length > 0) {
      logger.debug('Found data in Plant/Machine store', {
        plant,
        machineNo,
        totalRecords: plantMachineData.data.length
      })
      
      // Filter by date range
      return filterDataByDateRange(plantMachineData.data, startDate, endDate)
    }
    
    // Fallback to period-based store
    logger.debug('Checking period-based store', { plant, machineNo })
    const allPeriods = await getAllCSVMetadataFromDB()
    
    const matchingPeriods = allPeriods.filter(period => 
      period.metadata.plant === plant && 
      period.metadata.machineNo === machineNo
    )
    
    if (matchingPeriods.length === 0) {
      logger.debug('No data found for Plant/Machine combination')
      return []
    }
    
    // Collect data from all matching periods
    const allData: CSVDataPoint[] = []
    
    for (const periodMeta of matchingPeriods) {
      const periodData = await getCSVDataFromDB(periodMeta.periodId)
      if (periodData && periodData.data) {
        allData.push(...periodData.data)
      }
    }
    
    // Filter by date range and remove duplicates
    const filteredData = filterDataByDateRange(allData, startDate, endDate)
    
    // Remove duplicates by timestamp
    const uniqueData = Array.from(
      new Map(filteredData.map(item => [item.timestamp, item])).values()
    )
    
    logger.debug('Retrieved data from period-based store', {
      totalRecords: uniqueData.length,
      periodsChecked: matchingPeriods.length
    })
    
    return uniqueData
    
  } catch (error) {
    logger.error('Error retrieving data for period:', error)
    
    // Re-throw as a structured error for better handling
    if (error instanceof DataRetrievalError) {
      throw error
    }
    
    throw new DataRetrievalError(
      'Failed to retrieve data for period',
      'UNKNOWN_ERROR',
      { plant, machineNo, startDate, endDate, originalError: error }
    )
  }
}

/**
 * Evaluate a single data point against search conditions
 */
function evaluateDataPoint(
  dataPoint: CSVDataPoint,
  conditions: SearchCondition[]
): boolean {
  if (conditions.length === 0) return true
  
  // All conditions must be met (AND logic)
  return conditions.every(condition => {
    if (!condition.parameter || !condition.operator || !condition.value) {
      return false
    }
    
    const value = dataPoint[condition.parameter]
    if (value === undefined || value === null) return false
    
    const numValue = typeof value === 'number' ? value : parseFloat(value.toString())
    if (isNaN(numValue)) return false
    
    const threshold = parseFloat(condition.value)
    if (isNaN(threshold)) return false
    
    switch (condition.operator) {
      case 'gt':
        return numValue > threshold
      case 'lt':
        return numValue < threshold
      case 'gte':
        return numValue >= threshold
      case 'lte':
        return numValue <= threshold
      case 'eq':
        return Math.abs(numValue - threshold) < 0.0001 // Allow small floating point differences
      case 'ne':
        return Math.abs(numValue - threshold) >= 0.0001
      case 'crossAbove':
      case 'crossBelow':
      case 'isOn':
      case 'isOff':
      case 'switchedOn':
      case 'switchedOff':
        // These operators require historical data, not supported in simple evaluation
        logger.warn('Operator requires historical data:', condition.operator)
        return false
      default:
        logger.warn('Unknown operator:', condition.operator)
        return false
    }
  })
}

/**
 * Search data with conditions from multiple periods
 */
export async function searchDataWithConditions(
  periods: EventInfo[],
  conditions: SearchCondition[]
): Promise<SearchResult[]> {
  const results: SearchResult[] = []
  const errors: Array<{ periodId: string; error: any }> = []
  
  // Process periods in parallel for better performance
  const searchPromises = periods.map(async (period) => {
    try {
      // Get data for this period
      const periodData = await getDataForPeriod(
        period.plant,
        period.machineNo,
        period.start,
        period.end
      )
      
      logger.debug(`Searching in period ${period.id}`, {
        dataPoints: periodData.length,
        conditions: conditions.length
      })
      
      const periodResults: SearchResult[] = []
      
      // Evaluate each data point against conditions
      periodData.forEach((dataPoint, index) => {
        if (evaluateDataPoint(dataPoint, conditions)) {
          // Extract parameter values
          const parameters: Record<string, number> = {}
          
          // Get all numeric parameters from the data point
          Object.keys(dataPoint).forEach(key => {
            if (key !== 'timestamp' && key !== 'periodId') {
              const value = dataPoint[key]
              if (typeof value === 'number') {
                parameters[key] = value
              } else if (typeof value === 'string') {
                const numValue = parseFloat(value)
                if (!isNaN(numValue)) {
                  parameters[key] = numValue
                }
              }
            }
          })
          
          periodResults.push({
            id: `${period.id}_result_${index}_${Date.now()}`,
            timestamp: dataPoint.timestamp,
            plant: period.plant,
            machineNo: period.machineNo,
            parameters,
            matchedConditions: conditions.map(c => 
              `${c.parameter} ${c.operator} ${c.value}`
            )
          })
        }
      })
      
      return periodResults
      
    } catch (error) {
      logger.error(`Error searching data for period ${period.id}:`, error)
      errors.push({ periodId: period.id, error })
      return []
    }
  })
  
  // Wait for all searches to complete
  const allResults = await Promise.all(searchPromises)
  
  // Flatten results
  allResults.forEach(periodResults => {
    results.push(...periodResults)
  })
  
  logger.info('Search completed', {
    totalResults: results.length,
    periodsSearched: periods.length,
    errorsCount: errors.length
  })
  
  // Log errors if any occurred
  if (errors.length > 0) {
    logger.warn('Some periods had errors during search', { errors })
  }
  
  return results
}

/**
 * Get data for manual entry with optional existing data
 */
export async function getDataForManualEntry(
  plant: string,
  machineNo: string,
  startDate: string,
  endDate: string
): Promise<{
  hasData: boolean
  data: CSVDataPoint[]
  parameters: string[]
}> {
  try {
    const data = await getDataForPeriod(plant, machineNo, startDate, endDate)
    
    if (data.length === 0) {
      return {
        hasData: false,
        data: [],
        parameters: []
      }
    }
    
    // Extract available parameters
    const parameterSet = new Set<string>()
    data.forEach(point => {
      Object.keys(point).forEach(key => {
        if (key !== 'timestamp' && key !== 'periodId') {
          parameterSet.add(key)
        }
      })
    })
    
    return {
      hasData: true,
      data,
      parameters: Array.from(parameterSet).sort()
    }
  } catch (error) {
    logger.error('Error getting data for manual entry:', error)
    
    // Return empty data on error but log the issue
    return {
      hasData: false,
      data: [],
      parameters: []
    }
  }
}