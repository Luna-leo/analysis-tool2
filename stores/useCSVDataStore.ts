import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { StandardizedCSVData } from '@/types/csv-data'
import { ensureMap } from '@/utils/mapUtils'
import { transformToDataPoints, extractParameterData, DataPoint } from '@/utils/dataTransformUtils'

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
  saveCSVData: (periodId: string, standardizedData: StandardizedCSVData[], metadata?: CSVMetadata) => void
  
  // Get CSV data for a period
  getCSVData: (periodId: string) => CSVDataSet | undefined
  
  // Get data points for specific parameters
  getParameterData: (periodId: string, parameters: string[]) => CSVDataPoint[] | undefined
  
  // Remove CSV data for a period
  removeCSVData: (periodId: string) => void
  
  // Clear all CSV data
  clearAllData: () => void
  
  // Get total storage size
  getStorageSize: () => number
  
  // Get available parameters for a period
  getAvailableParameters: (periodId: string) => { name: string; unit: string }[]
}


// Maximum storage size in characters (roughly 2MB to be safe)
const MAX_STORAGE_SIZE = 2 * 1024 * 1024

// Store actual data in memory only (not persisted)
const inMemoryDataStore = new Map<string, CSVDataPoint[]>()

export const useCSVDataStore = create<CSVDataStore>()(
  persist(
    (set, get) => ({
      datasets: new Map(),

      saveCSVData: (periodId, standardizedData, metadata) => {
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

        // Store actual data in memory
        inMemoryDataStore.set(periodId, sampledDataPoints)
        
        // Store only metadata in localStorage
        const dataset: CSVDataSet = {
          periodId,
          plant: first.plant,
          machineNo: first.machineNo,
          dataSourceType: first.sourceType,
          parameters,
          units,
          data: [], // Don't persist actual data
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

      getParameterData: (periodId, parameters) => {
        const state = get()
        let datasets = state.datasets
        
        // Ensure datasets is a Map
        datasets = ensureMap<string, CSVDataSet>(datasets)
        
        const dataset = datasets.get(periodId)
        if (!dataset) {
          console.warn('No dataset found for periodId:', periodId)
          return undefined
        }

        // Get actual data from memory
        const memoryData = inMemoryDataStore.get(periodId)
        if (!memoryData) {
          console.warn('No in-memory data found for periodId:', periodId)
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

      removeCSVData: (periodId) => {
        // Remove from memory
        inMemoryDataStore.delete(periodId)
        
        set(state => {
          let datasets = state.datasets
          
          // Ensure datasets is a Map
          datasets = ensureMap<string, CSVDataSet>(datasets)
          
          const newDatasets = new Map(datasets)
          newDatasets.delete(periodId)
          return { datasets: newDatasets }
        })
      },

      clearAllData: () => {
        // Clear memory store
        inMemoryDataStore.clear()
        
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