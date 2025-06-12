import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { StandardizedCSVData } from '@/types/csv-data'
import { ensureMap } from '@/utils/mapUtils'
import { cleanParameterNames } from '@/utils/parameterUtils'
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
  
  // Get available parameters for a period
  getAvailableParameters: (periodId: string) => { name: string; unit: string }[]
}

// Type alias for better type safety
type DatasetsMap = Map<string, CSVDataSet>

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
        
        // Extract parameter names and units from metadata if available
        if (metadata?.parameterInfo) {
          parameters.push(...metadata.parameterInfo.parameters)
          metadata.parameterInfo.parameters.forEach((param: string, index: number) => {
            if (metadata.parameterInfo.units[index]) {
              units[param] = metadata.parameterInfo.units[index]
            }
          })
        } else {
          // Fallback: extract from data keys
          Object.keys(first).forEach(key => {
            if (!['plant', 'machineNo', 'sourceType', 'rowNumber', 'timestamp'].includes(key)) {
              parameters.push(key)
            }
          })
        }

        // Convert standardized data to CSVDataPoint format
        const dataPoints = transformToDataPoints(standardizedData, parameters, 'timestamp')

        const dataset: CSVDataSet = {
          periodId,
          plant: first.plant,
          machineNo: first.machineNo,
          dataSourceType: first.sourceType,
          parameters,
          units,
          data: dataPoints,
          lastUpdated: new Date().toISOString()
        }

        set(state => {
          let datasets = state.datasets
          
          // Ensure datasets is a Map
          datasets = ensureMap<string, CSVDataSet>(datasets)
          
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

        // Debug logging
        console.log('getParameterData called:', {
          periodId,
          requestedParameters: parameters,
          availableParameters: dataset.parameters,
          dataLength: dataset.data.length,
          sampleData: dataset.data[0]
        })

        // Extract parameter data with cleaning
        const result = dataset.data.map(point => 
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
        set({ datasets: new Map() })
      }
    }),
    {
      name: 'csv-data-storage',
      version: 1,
      // Custom serialization for Map
      serialize: (state) => JSON.stringify({
        ...state,
        datasets: Array.from(state.datasets.entries())
      }),
      deserialize: (str) => {
        try {
          const parsed = JSON.parse(str)
          const datasets = new Map(parsed.datasets || [])
          return {
            ...parsed,
            datasets
          }
        } catch (error) {
          console.error('Error deserializing CSV data store:', error)
          return {
            datasets: new Map()
          }
        }
      }
    }
  )
)