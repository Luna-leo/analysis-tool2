import { CSVDataSourceType } from '@/types'
import { CSV_VALIDATION_MESSAGES } from '@/constants/csvImport'

interface ValidationResult {
  isValid: boolean
  errors: string[]
}

interface CSVImportValidationParams {
  plant: string
  machineNo: string
  files: File[] | string[]
  dataSourceType?: CSVDataSourceType
}

/**
 * Hook for CSV import validation
 */
export function useCSVValidation() {
  const validate = ({
    plant,
    machineNo,
    files,
    dataSourceType
  }: CSVImportValidationParams): ValidationResult => {
    const errors: string[] = []

    // Check required fields
    if (!plant?.trim()) {
      errors.push('Plant is required')
    }

    if (!machineNo?.trim()) {
      errors.push('Machine No is required')
    }

    if (!files || files.length === 0) {
      errors.push(CSV_VALIDATION_MESSAGES.noFiles)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const validateSingle = (
    field: string,
    value: string | File[] | string[]
  ): boolean => {
    switch (field) {
      case 'plant':
      case 'machineNo':
        return typeof value === 'string' && value.trim().length > 0
      case 'files':
        return Array.isArray(value) && value.length > 0
      default:
        return true
    }
  }

  return {
    validate,
    validateSingle
  }
}