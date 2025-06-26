import { openDB, IDBPDatabase } from 'idb'
import { CSVDataPoint } from '@/stores/useCSVDataStore'

const DB_NAME = 'CSVDataStore'
const DB_VERSION = 1
const STORE_NAME = 'csvData'

interface PaginatedResult<T> {
  data: T[]
  total: number
  hasMore: boolean
  nextCursor?: any
}

/**
 * Open or create the IndexedDB database
 */
async function getDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        // Create indexes for efficient querying
        store.createIndex('dataSourceId', 'dataSourceId', { unique: false })
        store.createIndex('timestamp', 'timestamp', { unique: false })
        store.createIndex('dataSourceId_timestamp', ['dataSourceId', 'timestamp'], { unique: false })
      }
    }
  })
}

/**
 * Get paginated data from IndexedDB using cursor-based pagination
 */
export async function getPaginatedData(
  dataSourceId: string,
  page: number,
  pageSize: number,
  parameters?: string[]
): Promise<PaginatedResult<CSVDataPoint>> {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const index = store.index('dataSourceId_timestamp')
  
  const data: CSVDataPoint[] = []
  let total = 0
  let hasMore = false
  let nextCursor: any = null
  
  // Count total items
  const countTx = db.transaction(STORE_NAME, 'readonly')
  const countIndex = countTx.objectStore(STORE_NAME).index('dataSourceId')
  total = await countIndex.count(dataSourceId)
  
  // Calculate skip count
  const skip = (page - 1) * pageSize
  let skipped = 0
  let collected = 0
  
  // Use cursor to iterate through data
  const range = IDBKeyRange.bound(
    [dataSourceId, -Infinity],
    [dataSourceId, Infinity]
  )
  
  let cursor = await index.openCursor(range)
  
  while (cursor) {
    // Skip to the correct page
    if (skipped < skip) {
      skipped++
      cursor = await cursor.continue()
      continue
    }
    
    // Collect page data
    if (collected < pageSize) {
      const value = cursor.value
      
      // Filter by parameters if specified
      if (!parameters || parameters.length === 0) {
        data.push(value)
        collected++
      } else {
        // Check if data point has any of the requested parameters
        const hasParameter = parameters.some(param => 
          value.hasOwnProperty(param) && value[param] !== undefined
        )
        
        if (hasParameter) {
          // Only include requested parameters
          const filteredPoint: CSVDataPoint = {
            timestamp: value.timestamp,
            dataSourceId: value.dataSourceId
          }
          
          parameters.forEach(param => {
            if (value[param] !== undefined) {
              filteredPoint[param] = value[param]
            }
          })
          
          data.push(filteredPoint)
          collected++
        }
      }
      
      // Check if there's more data
      if (collected === pageSize) {
        const nextCursorCheck = await cursor.continue()
        if (nextCursorCheck) {
          hasMore = true
          nextCursor = cursor.key
        }
        break
      }
    }
    
    cursor = await cursor.continue()
  }
  
  await tx.done
  
  return {
    data,
    total,
    hasMore,
    nextCursor
  }
}

/**
 * Get paginated data for multiple data sources
 */
export async function getPaginatedDataMultiple(
  dataSourceIds: string[],
  page: number,
  pageSize: number,
  parameters?: string[]
): Promise<PaginatedResult<CSVDataPoint>> {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  
  const allData: CSVDataPoint[] = []
  let total = 0
  
  // Get data from each source
  for (const dataSourceId of dataSourceIds) {
    const index = store.index('dataSourceId')
    const range = IDBKeyRange.only(dataSourceId)
    
    // Count items for this source
    const count = await index.count(range)
    total += count
    
    // Get all data for this source (we'll paginate the combined result)
    let cursor = await index.openCursor(range)
    
    while (cursor) {
      const value = cursor.value
      
      if (!parameters || parameters.length === 0) {
        allData.push(value)
      } else {
        // Filter by parameters
        const hasParameter = parameters.some(param => 
          value.hasOwnProperty(param) && value[param] !== undefined
        )
        
        if (hasParameter) {
          const filteredPoint: CSVDataPoint = {
            timestamp: value.timestamp,
            dataSourceId: value.dataSourceId
          }
          
          parameters.forEach(param => {
            if (value[param] !== undefined) {
              filteredPoint[param] = value[param]
            }
          })
          
          allData.push(filteredPoint)
        }
      }
      
      cursor = await cursor.continue()
    }
  }
  
  await tx.done
  
  // Sort by timestamp
  allData.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime()
    const timeB = new Date(b.timestamp).getTime()
    return timeA - timeB
  })
  
  // Paginate the combined result
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const paginatedData = allData.slice(start, end)
  const hasMore = end < allData.length
  
  return {
    data: paginatedData,
    total: allData.length,
    hasMore,
    nextCursor: hasMore ? end : undefined
  }
}

/**
 * Get data in chunks for streaming/progressive loading
 */
export async function* getDataInChunks(
  dataSourceId: string,
  chunkSize: number = 1000,
  parameters?: string[]
): AsyncGenerator<CSVDataPoint[], void, unknown> {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  const index = store.index('dataSourceId_timestamp')
  
  const range = IDBKeyRange.bound(
    [dataSourceId, -Infinity],
    [dataSourceId, Infinity]
  )
  
  let cursor = await index.openCursor(range)
  let chunk: CSVDataPoint[] = []
  
  while (cursor) {
    const value = cursor.value
    
    if (!parameters || parameters.length === 0) {
      chunk.push(value)
    } else {
      // Filter by parameters
      const hasParameter = parameters.some(param => 
        value.hasOwnProperty(param) && value[param] !== undefined
      )
      
      if (hasParameter) {
        const filteredPoint: CSVDataPoint = {
          timestamp: value.timestamp,
          dataSourceId: value.dataSourceId
        }
        
        parameters.forEach(param => {
          if (value[param] !== undefined) {
            filteredPoint[param] = value[param]
          }
        })
        
        chunk.push(filteredPoint)
      }
    }
    
    // Yield chunk when it reaches the specified size
    if (chunk.length >= chunkSize) {
      yield chunk
      chunk = []
    }
    
    cursor = await cursor.continue()
  }
  
  // Yield remaining data
  if (chunk.length > 0) {
    yield chunk
  }
  
  await tx.done
}