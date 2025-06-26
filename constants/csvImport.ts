import { CSVDataSourceType } from '@/types'

/**
 * CSV Import Constants
 */

// Default values
export const CSV_DEFAULTS = {
  dataSourceType: 'CASS' as CSVDataSourceType,
  patternType: 'wildcard' as const,
  fileExtensions: ['.csv', '.CSV'] as const,
} as const

// Validation messages
export const CSV_VALIDATION_MESSAGES = {
  missingFields: 'Please fill in all required fields',
  noFiles: 'Please select at least one CSV file',
  invalidFiles: 'Please select valid CSV files',
  importError: 'An error occurred during import',
  parseError: 'Error parsing CSV file',
  validationError: 'CSV validation failed',
} as const

// Import status messages
export const CSV_IMPORT_STATUS = {
  idle: '',
  validating: 'Validating CSV files...',
  parsing: 'Parsing CSV data...',
  importing: 'Importing data...',
  complete: 'Import completed successfully',
  error: 'Import failed',
} as const

// UI Text (English)
export const CSV_UI_TEXT = {
  // Dialog/Form labels
  dataSourceType: 'Data Source Type',
  plant: 'Plant',
  machineNo: 'Machine No',
  selectFiles: 'Select CSV Files',
  fileName: 'File Name',
  filePattern: 'File Name Pattern',
  patternType: 'Pattern Type',
  
  // Buttons
  import: 'Import',
  importing: 'Importing...',
  cancel: 'Cancel',
  selectAll: 'Select All',
  deselectAll: 'Deselect All',
  
  // Descriptions
  importDescription: 'Import CSV files to register data periods',
  patternDescription: 'Use * for any characters, ? for single character',
  regexDescription: 'Use regular expression for advanced pattern matching',
  
  // Status
  filesSelected: (count: number) => `${count} file(s) selected`,
  importProgress: (current: number, total: number) => `Processing ${current} of ${total} files`,
} as const

// Column requirements for each data source type
export const CSV_COLUMN_REQUIREMENTS = {
  CASS: {
    required: ['timestamp', 'tag_name', 'value', 'quality'],
    optional: ['unit', 'description'],
  },
  ACS: {
    required: ['datetime', 'parameter', 'measurement', 'status'],
    optional: ['remarks'],
  },
  CHINAMI: {
    required: ['time', 'signal_id', 'data', 'valid'],
    optional: ['notes'],
  },
} as const