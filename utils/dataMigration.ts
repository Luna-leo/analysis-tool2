import { getAllCSVMetadataFromDB, getCSVDataFromDB } from './indexedDBUtils'
import { 
  generatePlantMachineId, 
  getPlantMachineData, 
  savePlantMachineData,
  mergeAndDeduplicateData,
  updatePlantMachineMetadata
} from './plantMachineDataUtils'
import { PlantMachineData, ImportHistoryRecord } from '@/types/plant-machine-data'
import { createLogger } from './logger'

const logger = createLogger('DataMigration')

export interface MigrationResult {
  success: boolean
  migratedCount: number
  errors: string[]
  details: {
    periodId: string
    plant: string
    machineNo: string
    recordCount: number
    status: 'success' | 'error' | 'skipped'
    message?: string
  }[]
}

/**
 * Migrate all period-based data to Plant/Machine structure
 */
export async function migrateAllData(dryRun: boolean = false): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    errors: [],
    details: []
  }

  try {
    logger.info('Starting data migration', { dryRun })
    
    // Get all period metadata
    const allPeriods = await getAllCSVMetadataFromDB()
    logger.info(`Found ${allPeriods.length} periods to migrate`)

    for (const periodMeta of allPeriods) {
      const detail: MigrationResult['details'][0] = {
        periodId: periodMeta.periodId,
        plant: periodMeta.metadata.plant,
        machineNo: periodMeta.metadata.machineNo,
        recordCount: 0,
        status: 'success',
        message: ''
      }

      try {
        // Get full data for this period
        const periodData = await getCSVDataFromDB(periodMeta.periodId)
        if (!periodData || !periodData.data || periodData.data.length === 0) {
          detail.status = 'skipped'
          detail.message = 'No data found'
          result.details.push(detail)
          continue
        }

        detail.recordCount = periodData.data.length
        
        if (!dryRun) {
          await migratePeriodToPlantMachine(
            periodMeta.periodId,
            periodData.metadata.plant,
            periodData.metadata.machineNo,
            periodData.data,
            periodData.metadata
          )
        }
        
        result.migratedCount++
        logger.info(`Migrated period ${periodMeta.periodId}`, {
          plant: periodData.metadata.plant,
          machineNo: periodData.metadata.machineNo,
          records: periodData.data.length
        })

      } catch (error) {
        detail.status = 'error'
        detail.message = error instanceof Error ? error.message : 'Unknown error'
        result.errors.push(`Period ${periodMeta.periodId}: ${detail.message}`)
        result.success = false
        logger.error(`Error migrating period ${periodMeta.periodId}:`, error)
      }

      result.details.push(detail)
    }

    logger.info('Migration completed', {
      success: result.success,
      migratedCount: result.migratedCount,
      errors: result.errors.length
    })

  } catch (error) {
    result.success = false
    result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    logger.error('Migration failed:', error)
  }

  return result
}

/**
 * Migrate a single period to Plant/Machine structure
 */
async function migratePeriodToPlantMachine(
  periodId: string,
  plant: string,
  machineNo: string,
  data: any[],
  metadata: any
): Promise<void> {
  const plantMachineId = generatePlantMachineId(plant, machineNo)
  
  // Get existing Plant/Machine data if any
  const existingData = await getPlantMachineData(plantMachineId)
  
  // Create import history record
  const importHistoryRecord: ImportHistoryRecord = {
    periodId,
    importedAt: metadata.lastUpdated || new Date().toISOString(),
    startDate: '', // Will be calculated from data
    endDate: '',   // Will be calculated from data
    dataSourceType: metadata.dataSourceType || 'unknown',
    fileCount: 1,
    recordCount: data.length
  }
  
  // Calculate date range from data
  if (data.length > 0) {
    const timestamps = data.map(d => new Date(d.timestamp).getTime())
    importHistoryRecord.startDate = new Date(Math.min(...timestamps)).toISOString()
    importHistoryRecord.endDate = new Date(Math.max(...timestamps)).toISOString()
  }
  
  let plantMachineData: PlantMachineData
  
  if (existingData) {
    // Merge with existing data
    const mergedData = mergeAndDeduplicateData(existingData.data, data, false) // Prefer existing data
    const updatedMetadata = updatePlantMachineMetadata(mergedData, existingData.metadata)
    
    // Preserve units from period metadata if available
    if (metadata.units) {
      updatedMetadata.units = { ...updatedMetadata.units, ...metadata.units }
    }
    
    plantMachineData = {
      ...existingData,
      data: mergedData,
      importHistory: [...existingData.importHistory, importHistoryRecord],
      metadata: updatedMetadata
    }
  } else {
    // Create new Plant/Machine data
    const newMetadata = updatePlantMachineMetadata(data)
    
    // Use units from period metadata if available
    if (metadata.units) {
      newMetadata.units = metadata.units
    }
    
    plantMachineData = {
      id: plantMachineId,
      plant,
      machineNo,
      data,
      importHistory: [importHistoryRecord],
      metadata: newMetadata
    }
  }
  
  // Save to Plant/Machine store
  await savePlantMachineData(plantMachineData)
}

/**
 * Migrate specific periods to Plant/Machine structure
 */
export async function migrateSelectedPeriods(
  periodIds: string[],
  dryRun: boolean = false
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: true,
    migratedCount: 0,
    errors: [],
    details: []
  }

  for (const periodId of periodIds) {
    try {
      const periodData = await getCSVDataFromDB(periodId)
      if (!periodData) {
        result.errors.push(`Period ${periodId} not found`)
        continue
      }

      const detail: MigrationResult['details'][0] = {
        periodId,
        plant: periodData.metadata.plant,
        machineNo: periodData.metadata.machineNo,
        recordCount: periodData.data.length,
        status: 'success'
      }

      if (!dryRun) {
        await migratePeriodToPlantMachine(
          periodId,
          periodData.metadata.plant,
          periodData.metadata.machineNo,
          periodData.data,
          periodData.metadata
        )
      }

      result.migratedCount++
      result.details.push(detail)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      result.errors.push(`Period ${periodId}: ${errorMessage}`)
      result.success = false
      
      result.details.push({
        periodId,
        plant: '',
        machineNo: '',
        recordCount: 0,
        status: 'error',
        message: errorMessage
      })
    }
  }

  return result
}