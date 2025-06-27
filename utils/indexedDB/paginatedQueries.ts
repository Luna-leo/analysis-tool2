import { openDB, IDBPDatabase } from 'idb'
import { CSVDataPoint } from '@/stores/useCSVDataStore'

const DB_NAME = 'AnalysisToolDB'
const DB_VERSION = 1
const STORE_NAME = 'csvDataStore'

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
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'periodId' })
        // Create indexes for efficient querying
        store.createIndex('lastUpdated', 'metadata.lastUpdated', { unique: false })
        store.createIndex('plant', 'metadata.plant', { unique: false })
        store.createIndex('machineNo', 'metadata.machineNo', { unique: false })
      }
    }
  })
}

/**
 * Get paginated data from IndexedDB using cursor-based pagination
 */
export async function getPaginatedData(
  periodId: string,
  page: number,
  pageSize: number,
  parameters?: string[]
): Promise<PaginatedResult<CSVDataPoint>> {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  
  // Get the CSV data for this periodId
  const csvData = await store.get(periodId)
  
  if (!csvData || !csvData.data) {
    return {
      data: [],
      total: 0,
      hasMore: false
    }
  }
  
  const allData = csvData.data
  const total = allData.length
  
  // Calculate pagination
  const skip = (page - 1) * pageSize
  const end = skip + pageSize
  
  // Slice the data for this page
  let pageData = allData.slice(skip, end)
  
  // Filter by parameters if specified
  if (parameters && parameters.length > 0) {
    pageData = pageData.map((point: CSVDataPoint) => {
      const filteredPoint: CSVDataPoint = {
        timestamp: point.timestamp
      }
      
      parameters.forEach(param => {
        if (point[param] !== undefined) {
          filteredPoint[param] = point[param]
        }
      })
      
      return filteredPoint
    })
  }
  
  await tx.done
  
  return {
    data: pageData,
    total,
    hasMore: end < total,
    nextCursor: end < total ? end : undefined
  }
}

/**
 * Get paginated data for multiple periods
 */
export async function getPaginatedDataMultiple(
  periodIds: string[],
  page: number,
  pageSize: number,
  parameters?: string[]
): Promise<PaginatedResult<CSVDataPoint>> {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  
  const allData: CSVDataPoint[] = []
  let totalCount = 0
  
  // Get data from each period
  for (const periodId of periodIds) {
    const csvData = await store.get(periodId)
    
    if (csvData && csvData.data) {
      totalCount += csvData.data.length
      
      // Add periodId to each data point for tracking
      const dataWithPeriodId = csvData.data.map((point: any) => ({
        ...point,
        periodId
      }))
      
      allData.push(...dataWithPeriodId)
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
  let paginatedData = allData.slice(start, end)
  
  // Filter by parameters if specified
  if (parameters && parameters.length > 0) {
    paginatedData = paginatedData.map((point: CSVDataPoint) => {
      const filteredPoint: CSVDataPoint = {
        timestamp: point.timestamp,
        periodId: (point as any).periodId
      }
      
      parameters.forEach(param => {
        if (point[param] !== undefined) {
          filteredPoint[param] = point[param]
        }
      })
      
      return filteredPoint
    })
  }
  
  return {
    data: paginatedData,
    total: totalCount,
    hasMore: end < allData.length,
    nextCursor: end < allData.length ? end : undefined
  }
}

/**
 * Get data in chunks for streaming/progressive loading
 */
export async function* getDataInChunks(
  periodId: string,
  chunkSize: number = 1000,
  parameters?: string[]
): AsyncGenerator<CSVDataPoint[], void, unknown> {
  const db = await getDB()
  const tx = db.transaction(STORE_NAME, 'readonly')
  const store = tx.objectStore(STORE_NAME)
  
  // Get the CSV data for this periodId
  const csvData = await store.get(periodId)
  
  if (!csvData || !csvData.data) {
    await tx.done
    return
  }
  
  const allData = csvData.data
  let chunk: CSVDataPoint[] = []
  
  for (let i = 0; i < allData.length; i++) {
    const point = allData[i]
    
    if (!parameters || parameters.length === 0) {
      chunk.push(point)
    } else {
      // Filter by parameters
      const filteredPoint: CSVDataPoint = {
        timestamp: point.timestamp
      }
      
      let hasAnyParameter = false
      parameters.forEach(param => {
        if (point[param] !== undefined) {
          filteredPoint[param] = point[param]
          hasAnyParameter = true
        }
      })
      
      if (hasAnyParameter) {
        chunk.push(filteredPoint)
      }
    }
    
    // Yield chunk when it reaches the specified size
    if (chunk.length >= chunkSize) {
      yield chunk
      chunk = []
    }
  }
  
  // Yield remaining data
  if (chunk.length > 0) {
    yield chunk
  }
  
  await tx.done
}