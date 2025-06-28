import { plantMachineDataExists, getPlantMachineData } from './plantMachineDataUtils'
import { getAllCSVMetadataFromDB, getCSVDataFromDB } from './indexedDBUtils'
import { createLogger } from './logger'
import { CSVDataPoint } from '@/stores/useCSVDataStore'

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

export interface PeriodCoverage {
  coveragePercentage: number
  coveredRanges: Array<{ start: string; end: string }>
  gaps: Array<{ start: string; end: string }>
  totalDataPoints: number
  expectedDataPoints: number
}

export interface SuggestedPeriod {
  start: string
  end: string
  coverage: number
  dataPoints: number
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

/**
 * Calculate period coverage for a specific date range
 * Returns detailed information about data coverage within the specified period
 */
export async function calculatePeriodCoverage(
  plant: string,
  machineNo: string,
  startDate: string,
  endDate: string,
  samplingIntervalMinutes: number = 1
): Promise<PeriodCoverage> {
  const result: PeriodCoverage = {
    coveragePercentage: 0,
    coveredRanges: [],
    gaps: [],
    totalDataPoints: 0,
    expectedDataPoints: 0
  }

  try {
    // Get all data for the period
    const plantMachineId = `${plant}_${machineNo}`
    const plantMachineData = await getPlantMachineData(plantMachineId)
    
    let allData: CSVDataPoint[] = []
    
    if (plantMachineData && plantMachineData.data.length > 0) {
      allData = plantMachineData.data
    } else {
      // Fallback to period-based store
      const allPeriods = await getAllCSVMetadataFromDB()
      const matchingPeriods = allPeriods.filter(period => 
        period.metadata.plant === plant && 
        period.metadata.machineNo === machineNo
      )
      
      for (const periodMeta of matchingPeriods) {
        const periodData = await getCSVDataFromDB(periodMeta.periodId)
        if (periodData && periodData.data) {
          allData.push(...periodData.data)
        }
      }
    }
    
    // Filter data within the date range
    const startTime = new Date(startDate).getTime()
    const endTime = new Date(endDate).getTime()
    
    const filteredData = allData
      .filter(point => {
        const timestamp = new Date(point.timestamp).getTime()
        return timestamp >= startTime && timestamp <= endTime
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    
    result.totalDataPoints = filteredData.length
    
    // Calculate expected data points
    const durationMinutes = (endTime - startTime) / (1000 * 60)
    result.expectedDataPoints = Math.floor(durationMinutes / samplingIntervalMinutes)
    
    if (result.expectedDataPoints > 0) {
      result.coveragePercentage = (result.totalDataPoints / result.expectedDataPoints) * 100
    }
    
    // Find covered ranges and gaps
    if (filteredData.length > 0) {
      let currentRangeStart = filteredData[0].timestamp
      let lastTimestamp = filteredData[0].timestamp
      
      for (let i = 1; i < filteredData.length; i++) {
        const currentTimestamp = filteredData[i].timestamp
        const timeDiff = new Date(currentTimestamp).getTime() - new Date(lastTimestamp).getTime()
        
        // If gap is larger than 5 times the sampling interval, consider it a gap
        if (timeDiff > samplingIntervalMinutes * 5 * 60 * 1000) {
          // End current range
          result.coveredRanges.push({
            start: currentRangeStart,
            end: lastTimestamp
          })
          
          // Add gap
          result.gaps.push({
            start: lastTimestamp,
            end: currentTimestamp
          })
          
          // Start new range
          currentRangeStart = currentTimestamp
        }
        
        lastTimestamp = currentTimestamp
      }
      
      // Add final range
      result.coveredRanges.push({
        start: currentRangeStart,
        end: lastTimestamp
      })
      
      // Check for gaps at the beginning and end
      if (new Date(filteredData[0].timestamp).getTime() > startTime) {
        result.gaps.unshift({
          start: startDate,
          end: filteredData[0].timestamp
        })
      }
      
      if (new Date(filteredData[filteredData.length - 1].timestamp).getTime() < endTime) {
        result.gaps.push({
          start: filteredData[filteredData.length - 1].timestamp,
          end: endDate
        })
      }
    } else {
      // No data at all - entire period is a gap
      result.gaps.push({
        start: startDate,
        end: endDate
      })
    }
    
  } catch (error) {
    logger.error('Error calculating period coverage:', error)
  }
  
  return result
}

/**
 * Get suggested periods based on available data
 * Returns periods with high data coverage
 */
export async function getSuggestedPeriods(
  plant: string,
  machineNo: string,
  maxSuggestions: number = 5
): Promise<SuggestedPeriod[]> {
  const suggestions: SuggestedPeriod[] = []
  
  try {
    // Get all available data
    const plantMachineId = `${plant}_${machineNo}`
    const plantMachineData = await getPlantMachineData(plantMachineId)
    
    let allData: CSVDataPoint[] = []
    
    if (plantMachineData && plantMachineData.data.length > 0) {
      allData = plantMachineData.data
    } else {
      // Fallback to period-based store
      const allPeriods = await getAllCSVMetadataFromDB()
      const matchingPeriods = allPeriods.filter(period => 
        period.metadata.plant === plant && 
        period.metadata.machineNo === machineNo
      )
      
      for (const periodMeta of matchingPeriods) {
        const periodData = await getCSVDataFromDB(periodMeta.periodId)
        if (periodData && periodData.data) {
          allData.push(...periodData.data)
        }
      }
    }
    
    if (allData.length === 0) {
      return suggestions
    }
    
    // Sort by timestamp
    allData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    
    // Find continuous data segments
    const segments: Array<{ start: string; end: string; dataPoints: number }> = []
    let currentSegmentStart = allData[0].timestamp
    let lastTimestamp = allData[0].timestamp
    let currentSegmentPoints = 1
    
    for (let i = 1; i < allData.length; i++) {
      const currentTimestamp = allData[i].timestamp
      const timeDiff = new Date(currentTimestamp).getTime() - new Date(lastTimestamp).getTime()
      
      // If gap is larger than 5 minutes, end current segment
      if (timeDiff > 5 * 60 * 1000) {
        segments.push({
          start: currentSegmentStart,
          end: lastTimestamp,
          dataPoints: currentSegmentPoints
        })
        
        currentSegmentStart = currentTimestamp
        currentSegmentPoints = 1
      } else {
        currentSegmentPoints++
      }
      
      lastTimestamp = currentTimestamp
    }
    
    // Add final segment
    segments.push({
      start: currentSegmentStart,
      end: lastTimestamp,
      dataPoints: currentSegmentPoints
    })
    
    // Sort segments by data points (descending)
    segments.sort((a, b) => b.dataPoints - a.dataPoints)
    
    // Convert top segments to suggestions
    for (let i = 0; i < Math.min(maxSuggestions, segments.length); i++) {
      const segment = segments[i]
      const duration = new Date(segment.end).getTime() - new Date(segment.start).getTime()
      const expectedPoints = Math.floor(duration / (60 * 1000)) // Assuming 1-minute intervals
      const coverage = expectedPoints > 0 ? (segment.dataPoints / expectedPoints) * 100 : 100
      
      suggestions.push({
        start: segment.start,
        end: segment.end,
        coverage: Math.min(coverage, 100),
        dataPoints: segment.dataPoints
      })
    }
    
  } catch (error) {
    logger.error('Error getting suggested periods:', error)
  }
  
  return suggestions
}

/**
 * Get data gaps for a specific date range
 * Returns periods where data is missing
 */
export async function getDataGaps(
  plant: string,
  machineNo: string,
  startDate: string,
  endDate: string
): Promise<Array<{ start: string; end: string; duration: number }>> {
  const coverage = await calculatePeriodCoverage(plant, machineNo, startDate, endDate)
  
  return coverage.gaps.map(gap => ({
    ...gap,
    duration: new Date(gap.end).getTime() - new Date(gap.start).getTime()
  }))
}