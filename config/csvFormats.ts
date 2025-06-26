interface CSVFormatConfig {
  patterns?: string[]
  validator?: (fileName: string, lines?: string[]) => boolean
  description?: string
}

export const CSV_FORMAT_PATTERNS: Record<string, CSVFormatConfig> = {
  CHINAMI: {
    patterns: ['PlantA_GT-', 'test_import', 'test_ssac', 'sample_parameters'],
    description: 'CHINAMI format test data files',
    validator: (fileName: string) => {
      const patterns = CSV_FORMAT_PATTERNS.CHINAMI.patterns || []
      return patterns.some(pattern => fileName.includes(pattern))
    }
  },
  CASS: {
    description: 'CASS format data files',
    validator: (fileName: string, lines?: string[]) => {
      // CASS format validation logic would go here
      // This would be imported from the existing cassParser
      return false // Placeholder
    }
  },
  STANDARD: {
    description: 'Standard CSV format',
    validator: () => true // Default format
  }
}

export function detectCSVFormat(fileName: string, lines?: string[]): string {
  for (const [format, config] of Object.entries(CSV_FORMAT_PATTERNS)) {
    if (config.validator && config.validator(fileName, lines)) {
      return format
    }
  }
  return 'STANDARD'
}

export function isTestDataFile(fileName: string): boolean {
  return CSV_FORMAT_PATTERNS.CHINAMI.validator?.(fileName) || false
}