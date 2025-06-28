import { plantMachineDataExists } from './plantMachineDataUtils'
import { getAllCSVMetadataFromDB } from './indexedDBUtils'
import { createLogger } from './logger'

const logger = createLogger('DataAvailabilityUtils')

export interface DataAvailability {
  hasData: boolean
  totalRecords: number
  dateRange?: {
    min: string
    max: string
  }
  sources: Array<{
    type: 'plantMachine' | 'period'
    recordCount: number
    dateRange?: { min: string; max: string }
  }>
}

/**
 * Check if data is available for a specific Plant/Machine combination
 * Checks both Plant/Machine store and period-based store
 */
export async function checkDataAvailability(
  plant: string,
  machineNo: string
): Promise<DataAvailability> {
  const result: DataAvailability = {
    hasData: false,
    totalRecords: 0,
    sources: []
  }

  try {
    // Check Plant/Machine store
    const hasPlantMachineData = await plantMachineDataExists(plant, machineNo)
    if (hasPlantMachineData) {
      // We could get more details if needed, but for now just mark as available
      result.hasData = true
      result.sources.push({
        type: 'plantMachine',
        recordCount: -1 // Unknown without fetching full data
      })
    }

    // Check period-based store
    const allPeriodMetadata = await getAllCSVMetadataFromDB()
    const matchingPeriods = allPeriodMetadata.filter(
      meta => meta.metadata.plant === plant && meta.metadata.machineNo === machineNo
    )

    if (matchingPeriods.length > 0) {
      result.hasData = true
      matchingPeriods.forEach(period => {
        result.sources.push({
          type: 'period',
          recordCount: -1 // Metadata doesn't include count
        })
      })
    }

    logger.debug('Data availability check', {
      plant,
      machineNo,
      hasData: result.hasData,
      sourceCount: result.sources.length
    })

  } catch (error) {
    logger.error('Error checking data availability:', error)
  }

  return result
}

/**
 * Batch check data availability for multiple Plant/Machine combinations
 */
export async function batchCheckDataAvailability(
  items: Array<{ plant: string; machineNo: string }>
): Promise<Map<string, DataAvailability>> {
  const results = new Map<string, DataAvailability>()

  // Process in parallel for better performance
  const promises = items.map(async ({ plant, machineNo }) => {
    const key = `${plant}_${machineNo}`
    const availability = await checkDataAvailability(plant, machineNo)
    return { key, availability }
  })

  const resolvedResults = await Promise.all(promises)
  
  resolvedResults.forEach(({ key, availability }) => {
    results.set(key, availability)
  })

  return results
}

/**
 * Check if data exists for a specific date range
 */
export async function checkDataAvailabilityForDateRange(
  plant: string,
  machineNo: string,
  startDate: string,
  endDate: string
): Promise<DataAvailability> {
  const result = await checkDataAvailability(plant, machineNo)
  
  // TODO: Add date range filtering logic once we have metadata with date ranges
  // For now, just return if any data exists
  
  return result
}