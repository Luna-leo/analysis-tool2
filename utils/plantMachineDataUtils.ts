import { PlantMachineData, ImportHistoryRecord } from '@/types/plant-machine-data'
import { CSVDataPoint } from '@/stores/useCSVDataStore'

const DB_NAME = 'AnalysisToolDB'
const DB_VERSION = 2  // Incremented for new object store
const PLANT_MACHINE_STORE_NAME = 'plantMachineDataStore'
const CSV_STORE_NAME = 'csvDataStore'  // Keep for backward compatibility

/**
 * Initialize or upgrade IndexedDB with Plant/Machine store
 */
export const initPlantMachineDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      const error = request.error
      console.error('IndexedDB open error:', error)
      reject(new Error(`Failed to open IndexedDB: ${error?.message || 'Unknown error'}`))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      const oldVersion = event.oldVersion

      console.log(`IndexedDB upgrade needed: ${oldVersion} -> ${DB_VERSION}`)

      // Keep existing CSV store for backward compatibility
      if (!db.objectStoreNames.contains(CSV_STORE_NAME)) {
        const csvStore = db.createObjectStore(CSV_STORE_NAME, { keyPath: 'periodId' })
        csvStore.createIndex('lastUpdated', 'metadata.lastUpdated', { unique: false })
      }

      // Add new Plant/Machine store in version 2
      if (oldVersion < 2 && !db.objectStoreNames.contains(PLANT_MACHINE_STORE_NAME)) {
        const plantMachineStore = db.createObjectStore(PLANT_MACHINE_STORE_NAME, { keyPath: 'id' })
        
        // Indexes for efficient querying
        plantMachineStore.createIndex('plant', 'plant', { unique: false })
        plantMachineStore.createIndex('machineNo', 'machineNo', { unique: false })
        plantMachineStore.createIndex('lastUpdated', 'metadata.lastUpdated', { unique: false })
        
        // Compound index for plant+machine queries
        plantMachineStore.createIndex('plant_machine', ['plant', 'machineNo'], { unique: false })
      }
    }
  })
}

/**
 * Save or update Plant/Machine data
 */
export const savePlantMachineData = async (data: PlantMachineData): Promise<void> => {
  try {
    const db = await initPlantMachineDB()
    const transaction = db.transaction([PLANT_MACHINE_STORE_NAME], 'readwrite')
    const store = transaction.objectStore(PLANT_MACHINE_STORE_NAME)
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(data)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to save Plant/Machine data'))
    })

    db.close()
  } catch (error) {
    console.error('Error saving Plant/Machine data to IndexedDB:', error)
    throw error
  }
}

/**
 * Get Plant/Machine data by ID
 */
export const getPlantMachineData = async (id: string): Promise<PlantMachineData | undefined> => {
  try {
    const db = await initPlantMachineDB()
    const transaction = db.transaction([PLANT_MACHINE_STORE_NAME], 'readonly')
    const store = transaction.objectStore(PLANT_MACHINE_STORE_NAME)
    
    const data = await new Promise<PlantMachineData | undefined>((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(new Error('Failed to get Plant/Machine data'))
    })

    db.close()
    return data
  } catch (error) {
    console.error('Error getting Plant/Machine data from IndexedDB:', error)
    throw error
  }
}

/**
 * Get all Plant/Machine metadata (without full data for performance)
 */
export const getAllPlantMachineMetadata = async (): Promise<Array<Omit<PlantMachineData, 'data'>>> => {
  try {
    const db = await initPlantMachineDB()
    const transaction = db.transaction([PLANT_MACHINE_STORE_NAME], 'readonly')
    const store = transaction.objectStore(PLANT_MACHINE_STORE_NAME)
    
    const allData = await new Promise<PlantMachineData[]>((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(new Error('Failed to get all Plant/Machine metadata'))
    })

    db.close()
    
    // Return metadata only (exclude large data arrays)
    return allData.map(({ data, ...metadata }) => metadata)
  } catch (error) {
    console.error('Error getting all Plant/Machine metadata:', error)
    return []
  }
}

/**
 * Delete Plant/Machine data by ID
 */
export const deletePlantMachineData = async (id: string): Promise<void> => {
  try {
    const db = await initPlantMachineDB()
    const transaction = db.transaction([PLANT_MACHINE_STORE_NAME], 'readwrite')
    const store = transaction.objectStore(PLANT_MACHINE_STORE_NAME)
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to delete Plant/Machine data'))
    })

    db.close()
  } catch (error) {
    console.error('Error deleting Plant/Machine data:', error)
    throw error
  }
}

/**
 * Merge and deduplicate CSV data points by timestamp
 */
export const mergeAndDeduplicateData = (
  existingData: CSVDataPoint[],
  newData: CSVDataPoint[],
  preferNew: boolean = true
): CSVDataPoint[] => {
  // Create a map with timestamp as key
  const dataMap = new Map<string, CSVDataPoint>()
  
  // Add data based on preference
  const firstData = preferNew ? existingData : newData
  const secondData = preferNew ? newData : existingData
  
  // Add first dataset
  firstData.forEach(point => {
    dataMap.set(point.timestamp, point)
  })
  
  // Add/merge second dataset
  secondData.forEach(point => {
    const existing = dataMap.get(point.timestamp)
    if (existing) {
      // Merge parameters, second dataset takes precedence
      dataMap.set(point.timestamp, {
        ...existing,
        ...point,
        timestamp: point.timestamp  // Ensure timestamp is preserved
      })
    } else {
      dataMap.set(point.timestamp, point)
    }
  })
  
  // Convert back to array and sort by timestamp
  return Array.from(dataMap.values())
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

/**
 * Filter data by date range
 */
export const filterDataByDateRange = (
  data: CSVDataPoint[],
  startDate: string | Date,
  endDate: string | Date
): CSVDataPoint[] => {
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  
  return data.filter(point => {
    const timestamp = new Date(point.timestamp).getTime()
    return timestamp >= start && timestamp <= end
  })
}

/**
 * Update metadata based on data
 */
export const updatePlantMachineMetadata = (
  data: CSVDataPoint[],
  existingMetadata?: PlantMachineData['metadata']
): PlantMachineData['metadata'] => {
  if (data.length === 0 && existingMetadata) {
    return existingMetadata
  }
  
  // Extract parameters from first data point
  const samplePoint = data[0] || {}
  const parameters = Object.keys(samplePoint).filter(key => key !== 'timestamp')
  
  // Extract units if available (preserve existing units)
  const units = existingMetadata?.units || {}
  
  // Calculate date range
  const timestamps = data.map(d => new Date(d.timestamp).getTime())
  const minTimestamp = Math.min(...timestamps)
  const maxTimestamp = Math.max(...timestamps)
  
  return {
    totalRecords: data.length,
    dateRange: {
      min: new Date(minTimestamp).toISOString(),
      max: new Date(maxTimestamp).toISOString()
    },
    parameters,
    units,
    lastUpdated: new Date().toISOString()
  }
}

/**
 * Generate Plant/Machine ID
 */
export const generatePlantMachineId = (plant: string, machineNo: string): string => {
  return `${plant}_${machineNo}`
}

/**
 * Check if Plant/Machine data exists
 */
export const plantMachineDataExists = async (plant: string, machineNo: string): Promise<boolean> => {
  const id = generatePlantMachineId(plant, machineNo)
  const data = await getPlantMachineData(id)
  return !!data
}