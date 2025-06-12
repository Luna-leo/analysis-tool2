import { CSVDataSourceType } from "@/types"

export interface DataSourceConfig {
  id: CSVDataSourceType
  name: string
  description: string
  columns: {
    required: string[]
    optional?: string[]
  }
  // Column mappings to standard format
  columnMappings: {
    timestamp: string
    parameter: string
    value: string
    quality: string
  }
}

export const DATA_SOURCE_CONFIGS: Record<CSVDataSourceType, DataSourceConfig> = {
  CASS: {
    id: "CASS",
    name: "CASS",
    description: "System Status and Control data source",
    columns: {
      required: ['timestamp', 'tag_name', 'value', 'quality'],
      optional: ['unit', 'description']
    },
    columnMappings: {
      timestamp: 'timestamp',
      parameter: 'tag_name',
      value: 'value',
      quality: 'quality'
    }
  },
  ACS: {
    id: "ACS",
    name: "ACS",
    description: "System Control Application data source",
    columns: {
      required: ['datetime', 'parameter', 'measurement', 'status'],
      optional: ['remarks']
    },
    columnMappings: {
      timestamp: 'datetime',
      parameter: 'parameter',
      value: 'measurement',
      quality: 'status'
    }
  },
  CHINAMI: {
    id: "CHINAMI",
    name: "CHINAMI",
    description: "Industrial Motion data source",
    columns: {
      required: ['time', 'signal_id', 'data', 'valid'],
      optional: ['notes']
    },
    columnMappings: {
      timestamp: 'time',
      parameter: 'signal_id',
      value: 'data',
      quality: 'valid'
    }
  }
}

// Get all available data source types
export const getDataSourceTypes = (): CSVDataSourceType[] => {
  return Object.keys(DATA_SOURCE_CONFIGS) as CSVDataSourceType[]
}

// Get configuration for a specific data source type
export const getDataSourceConfig = (type: CSVDataSourceType): DataSourceConfig => {
  return DATA_SOURCE_CONFIGS[type]
}