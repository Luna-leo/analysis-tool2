// IndexedDB utility functions for CSV data storage

const DB_NAME = 'AnalysisToolDB'
const DB_VERSION = 1
const CSV_STORE_NAME = 'csvDataStore'

export interface IndexedDBCSVData {
  periodId: string
  data: any[]
  metadata: {
    plant: string
    machineNo: string
    dataSourceType: string
    parameters: string[]
    units: Record<string, string>
    lastUpdated: string
  }
}

// Initialize IndexedDB
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB'))
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Create CSV data store if it doesn't exist
      if (!db.objectStoreNames.contains(CSV_STORE_NAME)) {
        const store = db.createObjectStore(CSV_STORE_NAME, { keyPath: 'periodId' })
        store.createIndex('lastUpdated', 'metadata.lastUpdated', { unique: false })
      }
    }
  })
}

// Save CSV data to IndexedDB
export const saveCSVDataToDB = async (data: IndexedDBCSVData): Promise<void> => {
  try {
    const db = await initDB()
    const transaction = db.transaction([CSV_STORE_NAME], 'readwrite')
    const store = transaction.objectStore(CSV_STORE_NAME)
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(data)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to save CSV data'))
    })

    db.close()
  } catch (error) {
    console.error('Error saving CSV data to IndexedDB:', error)
    throw error
  }
}

// Get CSV data from IndexedDB
export const getCSVDataFromDB = async (periodId: string): Promise<IndexedDBCSVData | undefined> => {
  try {
    const db = await initDB()
    const transaction = db.transaction([CSV_STORE_NAME], 'readonly')
    const store = transaction.objectStore(CSV_STORE_NAME)
    
    const data = await new Promise<IndexedDBCSVData | undefined>((resolve, reject) => {
      const request = store.get(periodId)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(new Error('Failed to get CSV data'))
    })

    db.close()
    return data
  } catch (error) {
    console.error('Error getting CSV data from IndexedDB:', error)
    return undefined
  }
}

// Get all CSV data metadata from IndexedDB
export const getAllCSVMetadataFromDB = async (): Promise<IndexedDBCSVData[]> => {
  try {
    const db = await initDB()
    const transaction = db.transaction([CSV_STORE_NAME], 'readonly')
    const store = transaction.objectStore(CSV_STORE_NAME)
    
    const data = await new Promise<IndexedDBCSVData[]>((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => {
        // Return only metadata, not the actual data arrays
        const results = request.result.map(item => ({
          ...item,
          data: [] // Don't load all data into memory at once
        }))
        resolve(results)
      }
      request.onerror = () => reject(new Error('Failed to get CSV metadata'))
    })

    db.close()
    return data
  } catch (error) {
    console.error('Error getting CSV metadata from IndexedDB:', error)
    return []
  }
}

// Delete CSV data from IndexedDB
export const deleteCSVDataFromDB = async (periodId: string): Promise<void> => {
  try {
    const db = await initDB()
    const transaction = db.transaction([CSV_STORE_NAME], 'readwrite')
    const store = transaction.objectStore(CSV_STORE_NAME)
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(periodId)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to delete CSV data'))
    })

    db.close()
  } catch (error) {
    console.error('Error deleting CSV data from IndexedDB:', error)
    throw error
  }
}

// Clear all CSV data from IndexedDB
export const clearAllCSVDataFromDB = async (): Promise<void> => {
  try {
    const db = await initDB()
    const transaction = db.transaction([CSV_STORE_NAME], 'readwrite')
    const store = transaction.objectStore(CSV_STORE_NAME)
    
    await new Promise<void>((resolve, reject) => {
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(new Error('Failed to clear CSV data'))
    })

    db.close()
  } catch (error) {
    console.error('Error clearing CSV data from IndexedDB:', error)
    throw error
  }
}

// Get storage size estimate
export const getStorageEstimate = async (): Promise<{ usage: number; quota: number } | null> => {
  if (typeof window === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
    return null
  }

  try {
    const estimate = await navigator.storage.estimate()
    return {
      usage: estimate.usage || 0,
      quota: estimate.quota || 0
    }
  } catch (error) {
    console.error('Error getting storage estimate:', error)
    return null
  }
}