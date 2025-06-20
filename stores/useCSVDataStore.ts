import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { StandardizedCSVData } from '@/types/csv-data'
import { ensureMap } from '@/utils/mapUtils'
import { transformToDataPoints, extractParameterData, DataPoint } from '@/utils/dataTransformUtils'
import { 
  saveCSVDataToDB, 
  getCSVDataFromDB, 
  getAllCSVMetadataFromDB, 
  deleteCSVDataFromDB,
  clearAllCSVDataFromDB,
  IndexedDBCSVData 
} from '@/utils/indexedDBUtils'

export interface CSVMetadata {
  parameterInfo?: {
    parameters: string[];
    units: string[];
  };
  fileName?: string;
  format?: string;
}

export type CSVDataPoint = DataPoint

export interface CSVDataSet {
  periodId: string
  plant: string
  machineNo: string
  dataSourceType: string
  parameters: string[]
  units: Record<string, string>
  data: CSVDataPoint[]
  lastUpdated: string
}

interface CSVDataStore {
  datasets: Map<string, CSVDataSet>
  
  // Store CSV data for a period
  saveCSVData: (periodId: string, standardizedData: StandardizedCSVData[], metadata?: CSVMetadata) => Promise<void>
  
  // Get CSV data for a period
  getCSVData: (periodId: string) => CSVDataSet | undefined
  
  // Get data points for specific parameters
  getParameterData: (periodId: string, parameters: string[]) => Promise<CSVDataPoint[] | undefined>
  
  // Get paginated data points for specific parameters
  getParameterDataPaginated: (periodId: string, parameters: string[], page: number, pageSize: number) => Promise<{ data: CSVDataPoint[]; total: number }>
  
  // Remove CSV data for a period
  removeCSVData: (periodId: string) => Promise<void>
  
  // Clear all CSV data
  clearAllData: () => Promise<void>
  
  // Get total storage size
  getStorageSize: () => number
  
  // Get available parameters for a period
  getAvailableParameters: (periodId: string) => { name: string; unit: string }[]
  
  // Load all datasets from IndexedDB
  loadFromIndexedDB: () => Promise<void>
  
  // Check if data exists for a period
  hasData: (periodId: string) => Promise<boolean>
}


// Maximum storage size in characters (roughly 2MB to be safe)
const MAX_STORAGE_SIZE = 2 * 1024 * 1024

// Store actual data in memory only (not persisted)
const inMemoryDataStore = new Map<string, CSVDataPoint[]>()

export const useCSVDataStore = create<CSVDataStore>()(
  persist(
    (set, get) => ({
      datasets: new Map(),

      saveCSVData: async (periodId, standardizedData, metadata) => {
        if (standardizedData.length === 0) {
          return
        }

        const first = standardizedData[0]
        const parameters: string[] = []
        const units: Record<string, string> = {}
        
        console.log('saveCSVData called:', {
          periodId,
          firstDataKeys: Object.keys(first),
          metadata
        })
        
        // Extract parameter names from actual data keys (more reliable)
        const excludedKeys = ['plant', 'machineNo', 'sourceType', 'rowNumber', 'timestamp']
        Object.keys(first).forEach(key => {
          if (!excludedKeys.includes(key)) {
            parameters.push(key)
          }
        })
        
        // Extract units from metadata if available
        if (metadata?.parameterInfo) {
          // Map parameter names to units based on the headers
          const headers = Object.keys(first).filter(k => !excludedKeys.includes(k))
          headers.forEach((header) => {
            // Find matching parameter in metadata
            const paramIndex = metadata.parameterInfo?.parameters.findIndex((p: string) => p === header) ?? -1
            if (paramIndex !== -1 && metadata.parameterInfo?.units?.[paramIndex]) {
              units[header] = metadata.parameterInfo.units[paramIndex]
            }
          })
        }

        // Convert standardized data to CSVDataPoint format
        const dataPoints = transformToDataPoints(standardizedData, parameters, 'timestamp')

        // Don't sample data - keep all points
        const sampledDataPoints = dataPoints

        // Store actual data in memory for quick access
        inMemoryDataStore.set(periodId, sampledDataPoints)
        
        // Store data in IndexedDB for persistence
        const indexedDBData: IndexedDBCSVData = {
          periodId,
          data: sampledDataPoints,
          metadata: {
            plant: first.plant,
            machineNo: first.machineNo,
            dataSourceType: first.sourceType,
            parameters,
            units,
            lastUpdated: new Date().toISOString()
          }
        }
        
        try {
          await saveCSVDataToDB(indexedDBData)
        } catch (error) {
          console.error('Failed to save to IndexedDB:', error)
          // Continue even if IndexedDB fails
        }
        
        // Store metadata in zustand state
        const dataset: CSVDataSet = {
          periodId,
          plant: first.plant,
          machineNo: first.machineNo,
          dataSourceType: first.sourceType,
          parameters,
          units,
          data: [], // Don't persist actual data in localStorage
          lastUpdated: new Date().toISOString()
        }

        set(state => {
          let datasets = state.datasets
          
          // Ensure datasets is a Map
          datasets = ensureMap<string, CSVDataSet>(datasets)
          
          // Simply add the new dataset
          const newDatasets = new Map(datasets)
          newDatasets.set(periodId, dataset)
          
          return { datasets: newDatasets }
        })
      },

      getCSVData: (periodId) => {
        const state = get()
        let datasets = state.datasets
        
        // Ensure datasets is a Map
        datasets = ensureMap<string, CSVDataSet>(datasets)
        
        return datasets.get(periodId)
      },

      getParameterData: async (periodId, parameters) => {
        const state = get()
        let datasets = state.datasets
        
        // Ensure datasets is a Map
        datasets = ensureMap<string, CSVDataSet>(datasets)
        
        const dataset = datasets.get(periodId)
        if (!dataset) {
          console.warn('No dataset found for periodId:', periodId)
          return undefined
        }

        // First try to get data from memory
        let memoryData = inMemoryDataStore.get(periodId)
        
        // If not in memory, try to load from IndexedDB
        if (!memoryData) {
          console.log('Loading data from IndexedDB for periodId:', periodId)
          try {
            const dbData = await getCSVDataFromDB(periodId)
            if (dbData && dbData.data) {
              // Store in memory for future access
              inMemoryDataStore.set(periodId, dbData.data)
              memoryData = dbData.data
            }
          } catch (error) {
            console.error('Failed to load from IndexedDB:', error)
          }
        }
        
        if (!memoryData) {
          console.warn('No data found in memory or IndexedDB for periodId:', periodId)
          return undefined
        }

        // Debug logging
        console.log('getParameterData called:', {
          periodId,
          requestedParameters: parameters,
          availableParameters: dataset.parameters,
          dataLength: memoryData.length,
          sampleData: memoryData[0],
          actualDataKeys: memoryData.length > 0 ? Object.keys(memoryData[0]) : []
        })

        // Extract parameter data with cleaning
        const result = memoryData.map(point => 
          extractParameterData(point as DataPoint, parameters, true) as CSVDataPoint
        )
        
        return result
      },

      getParameterDataPaginated: async (periodId, parameters, page, pageSize) => {
        const { getPaginatedData } = await import('@/utils/indexedDB/paginatedQueries')
        
        try {
          const result = await getPaginatedData(periodId, page, pageSize, parameters)
          return {
            data: result.data,
            total: result.total
          }
        } catch (error) {
          console.error('Failed to get paginated data:', error)
          // Fallback to in-memory data
          const allData = await get().getParameterData(periodId, parameters)
          if (!allData) return { data: [], total: 0 }
          
          const start = (page - 1) * pageSize
          const end = start + pageSize
          return {
            data: allData.slice(start, end),
            total: allData.length
          }
        }
      },

      getAvailableParameters: (periodId) => {
        const state = get()
        let datasets = state.datasets
        
        // Ensure datasets is a Map
        datasets = ensureMap<string, CSVDataSet>(datasets)
        
        const dataset = datasets.get(periodId)
        if (!dataset) return []

        return dataset.parameters.map(param => ({
          name: param,
          unit: dataset.units[param] || ''
        }))
      },

      removeCSVData: async (periodId) => {
        // Remove from memory
        inMemoryDataStore.delete(periodId)
        
        // Remove from IndexedDB
        try {
          await deleteCSVDataFromDB(periodId)
        } catch (error) {
          console.error('Failed to delete from IndexedDB:', error)
        }
        
        set(state => {
          let datasets = state.datasets
          
          // Ensure datasets is a Map
          datasets = ensureMap<string, CSVDataSet>(datasets)
          
          const newDatasets = new Map(datasets)
          newDatasets.delete(periodId)
          return { datasets: newDatasets }
        })
      },

      clearAllData: async () => {
        // Clear memory store
        inMemoryDataStore.clear()
        
        // Clear IndexedDB
        try {
          await clearAllCSVDataFromDB()
        } catch (error) {
          console.error('Failed to clear IndexedDB:', error)
        }
        
        set({ datasets: new Map() })
        // Also clear from localStorage
        localStorage.removeItem('csv-data-storage')
      },
      
      getStorageSize: () => {
        const state = get()
        let datasets = state.datasets
        datasets = ensureMap<string, CSVDataSet>(datasets)
        
        try {
          const data = JSON.stringify(Array.from(datasets.entries()))
          return data.length
        } catch (e) {
          return 0
        }
      },
      
      loadFromIndexedDB: async () => {
        try {
          // Get all metadata from IndexedDB
          const allData = await getAllCSVMetadataFromDB()
          
          if (allData.length > 0) {
            const newDatasets = new Map<string, CSVDataSet>()
            
            for (const item of allData) {
              const dataset: CSVDataSet = {
                periodId: item.periodId,
                plant: item.metadata.plant,
                machineNo: item.metadata.machineNo,
                dataSourceType: item.metadata.dataSourceType,
                parameters: item.metadata.parameters,
                units: item.metadata.units,
                data: [], // Don't load actual data into state
                lastUpdated: item.metadata.lastUpdated
              }
              newDatasets.set(item.periodId, dataset)
            }
            
            set({ datasets: newDatasets })
          }
        } catch (error) {
          console.error('Failed to load from IndexedDB:', error)
        }
      },
      
      hasData: async (periodId) => {
        const state = get()
        let datasets = state.datasets
        
        // Ensure datasets is a Map
        datasets = ensureMap<string, CSVDataSet>(datasets)
        
        // First check if dataset exists in state
        if (datasets.has(periodId)) {
          return true
        }
        
        // Check if data exists in IndexedDB
        try {
          const { getCSVDataFromDB } = await import('@/utils/indexedDBUtils')
          const data = await getCSVDataFromDB(periodId)
          return data !== null && data.length > 0
        } catch (error) {
          console.error('Error checking data existence:', error)
          return false
        }
      }
    }),
    {
      name: 'csv-data-storage',
      version: 1,
      // Custom storage for Map serialization
      storage: {
        getItem: (name) => {
          try {
            if (typeof window === 'undefined') return null
            const str = localStorage.getItem(name)
            if (!str) return null
            
            const parsed = JSON.parse(str)
            
            // Handle different data structures
            let datasets: Map<string, CSVDataSet>
            
            // Direct state structure (new Zustand format)
            if (parsed.datasets !== undefined) {
              if (Array.isArray(parsed.datasets)) {
                datasets = new Map(parsed.datasets)
              } else {
                datasets = new Map()
              }
              
              return {
                state: {
                  datasets
                },
                version: parsed.version || 0
              }
            }
            
            // Nested state structure (old format)
            if (parsed.state?.datasets !== undefined) {
              if (Array.isArray(parsed.state.datasets)) {
                datasets = new Map(parsed.state.datasets)
              } else {
                datasets = new Map()
              }
              
              return {
                state: {
                  datasets
                },
                version: parsed.version || 0
              }
            }
            
            // Fallback
            return {
              state: {
                datasets: new Map()
              },
              version: 0
            }
          } catch (error) {
            console.error('Error loading CSV data store:', error)
            return null
          }
        },
        setItem: (name, value) => {
          try {
            if (typeof window === 'undefined') return
            const serialized = {
              ...value,
              state: {
                ...value.state,
                datasets: Array.from(value.state.datasets.entries())
              }
            }
            localStorage.setItem(name, JSON.stringify(serialized))
          } catch (e) {
            // If localStorage is full, just log the error
            // The actual data is in memory, so the app will continue to work
            console.warn('LocalStorage save failed (data is preserved in memory):', e)
          }
        },
        removeItem: (name) => {
          if (typeof window === 'undefined') return
          localStorage.removeItem(name)
        }
      }
    }
  )
)